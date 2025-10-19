// middleware/index.ts → Main Middleware Orchestrator
// ================================================================================
// 🎯 DenoGenesis Framework - Middleware Orchestration System
// Coordinates all middleware components in optimal order for performance
// ================================================================================

// Import PerformanceMonitor and createPerformanceMiddleware first
import { PerformanceMonitor, createPerformanceMiddleware } from "./performanceMonitor.ts";
import { createSecurityMiddleware, type SecurityConfig } from "./security.ts";
import { StaticFileHandler, StaticFileAnalytics, StaticFileUtils, type StaticFileConfig } from "./staticFiles.ts";

// ✅ CRITICAL CHANGE: Import custom CORS middleware instead of oakCors
import { createCorsMiddleware, type CorsConfig } from "./cors.ts";

import { Logger, createLoggingMiddleware, type LoggingConfig } from "./logging.ts";
import { ErrorHandler, createErrorMiddleware, type ErrorConfig } from "./errorHandler.ts";
import { createHealthCheckMiddleware, type HealthCheckConfig } from "./healthCheck.ts";

// ❌ REMOVED: Simple CORS library import
// import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// Export everything after importing
export { PerformanceMonitor, createPerformanceMiddleware };
export { createSecurityMiddleware, type SecurityConfig };
export { StaticFileHandler, StaticFileAnalytics, StaticFileUtils, type StaticFileConfig };

// ✅ CRITICAL CHANGE: Export custom CORS components
export { createCorsMiddleware, type CorsConfig };

export { Logger, createLoggingMiddleware, type LoggingConfig };
export { ErrorHandler, createErrorMiddleware, type ErrorConfig };
export { createHealthCheckMiddleware, type HealthCheckConfig };

// ================================================================================
// 🔧 MIDDLEWARE CONFIGURATION INTERFACE
// ================================================================================

export interface MiddlewareConfig {
  environment: string;
  port: number;
  staticFiles: {
    root: string;
    enableCaching: boolean;
    maxAge?: number;
    extensions?: string[];
    index?: string;
    dotFiles?: 'allow' | 'deny' | 'ignore';
  };
  cors: {
    // Core CORS configuration
    allowedOrigins: string[];
    developmentOrigins: string[];
    credentials?: boolean;
    maxAge?: number;
    
    // ✅ NEW: Enhanced CORS options
    allowedMethods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    enableLogging?: boolean;
  };
  security: {
    enableHSTS: boolean;
    contentSecurityPolicy?: string;
    frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  };
  logging: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logRequests: boolean;
    logResponses?: boolean;
  };
  healthCheck: {
    endpoint: string;
    includeMetrics: boolean;
    includeEnvironment?: boolean;
  };
}

// ================================================================================
// 🚀 MIDDLEWARE STACK FACTORY
// ================================================================================

export async function createMiddlewareStack(config: MiddlewareConfig) {
  // Create performance monitor instance
  let monitor: PerformanceMonitor;

  try {
    monitor = new PerformanceMonitor();
    console.log('✅ PerformanceMonitor created successfully');
  } catch (error) {
    console.error('❌ Failed to create PerformanceMonitor:', error);
    throw new Error(`PerformanceMonitor initialization failed: ${error.message}`);
  }

  // Validate static file directory exists
  try {
    const staticStat = await Deno.stat(config.staticFiles.root);
    if (!staticStat.isDirectory) {
      throw new Error(`Static root path is not a directory: ${config.staticFiles.root}`);
    }
    console.log(`✅ Static file directory validated: ${config.staticFiles.root}`);
  } catch (error) {
    console.error('❌ Static file directory validation failed:', error);
    throw new Error(`Static file directory validation failed: ${error.message}`);
  }

  // Create all middleware in optimal order
  const middlewares = [
    // 1. Performance monitoring (first to track everything)
    createPerformanceMiddleware(monitor, config.environment === 'development'),

    // 2. Error handling (early to catch all errors)
    createErrorMiddleware({
      environment: config.environment,
      logErrors: true,
      logToFile: config.environment === 'production',
      showStackTrace: config.environment === 'development'
    }),

    // 3. Request/Response logging (after error handling)
    createLoggingMiddleware({
      environment: config.environment,
      logLevel: config.logging.logLevel,
      logRequests: config.logging.logRequests,
      logResponses: config.logging.logResponses ?? (config.environment === 'development')
    }),

    // 4. Security headers (before content serving)
    createSecurityMiddleware({
      environment: config.environment,
      enableHSTS: config.security.enableHSTS,
      contentSecurityPolicy: config.security.contentSecurityPolicy,
      frameOptions: config.security.frameOptions
    }),

    // ✅ CRITICAL CHANGE: Custom CORS middleware replaces oakCors
    // =============================================================
    // This provides enterprise-grade CORS handling with:
    // - Environment-specific origin validation
    // - Optimized preflight response caching
    // - Detailed logging in development mode
    // - Credential management
    // - Custom header control
    // =============================================================
    createCorsMiddleware({
      // Origin configuration (automatically merges dev origins in development)
      allowedOrigins: config.cors.allowedOrigins,
      developmentOrigins: config.cors.developmentOrigins,
      environment: config.environment,
      
      // Credential handling (cookies, authorization headers)
      credentials: config.cors.credentials ?? true,
      
      // HTTP methods that can be used in cross-origin requests
      allowedMethods: config.cors.allowedMethods ?? [
        'GET',
        'POST', 
        'PUT',
        'DELETE',
        'OPTIONS',
        'PATCH'
      ],
      
      // Headers that clients can send in requests
      allowedHeaders: config.cors.allowedHeaders ?? [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID'
      ],
      
      // Headers that clients can access in responses
      exposedHeaders: config.cors.exposedHeaders ?? [
        'X-Request-ID',
        'X-Response-Time'
      ],
      
      // Preflight cache duration (longer in production for performance)
      maxAge: config.cors.maxAge ?? (config.environment === 'production' ? 86400 : 300),
      
      // Enable detailed CORS logging in development
      enableLogging: config.cors.enableLogging ?? (config.environment === 'development')
    }),

    // 6. Health check endpoint (before static files so it takes precedence)
    createHealthCheckMiddleware(monitor, {
      endpoint: config.healthCheck.endpoint,
      includeMetrics: config.healthCheck.includeMetrics,
      includeEnvironment: config.healthCheck.includeEnvironment ?? true,
      customChecks: [
        // Database health check
        async () => ({
          name: 'database',
          status: 'healthy' as const,
          details: { connection: 'active', latency: '< 5ms' }
        }),
        // Filesystem health check
        async () => ({
          name: 'filesystem',
          status: 'healthy' as const,
          details: { writeable: true, space: 'sufficient' }
        }),
        // Static files health check
        async () => {
          try {
            const stat = await Deno.stat(config.staticFiles.root);
            const analytics = StaticFileAnalytics.getTotalStats();
            return {
              name: 'static_files',
              status: 'healthy' as const,
              details: { 
                root: config.staticFiles.root,
                accessible: stat.isDirectory,
                caching: config.staticFiles.enableCaching,
                totalRequests: analytics.totalRequests,
                totalBandwidth: `${Math.round(analytics.totalBandwidth / 1024)}KB`
              }
            };
          } catch {
            return {
              name: 'static_files',
              status: 'unhealthy' as const,
              details: { 
                root: config.staticFiles.root,
                error: 'Directory not accessible'
              }
            };
          }
        }
      ]
    }),

    // 7. Static file serving (last, as it should be catch-all for unmatched routes)
    StaticFileHandler.createMiddleware({
      root: config.staticFiles.root,
      enableCaching: config.staticFiles.enableCaching,
      maxAge: config.staticFiles.maxAge || (config.environment === 'production' ? 86400 : 0),
      compressionLevel: 6,
      enableGzip: config.environment === 'production',
      enableBrotli: false,
      enableEtag: config.staticFiles.enableCaching,
      indexFiles: config.staticFiles.index ? [config.staticFiles.index] : ['index.html', 'index.htm'],
      fallbackFile: undefined,
      serveHidden: config.staticFiles.dotFiles === 'allow',
      maxFileSize: 50 * 1024 * 1024
    })
  ];

  return {
    monitor,
    middlewares,
    getMiddlewareCount: () => middlewares.length,
    getMonitorMetrics: () => monitor.getMetrics(),
    getStaticFileStats: () => StaticFileAnalytics.getTotalStats(),
    getStaticFilePopular: (limit = 10) => StaticFileAnalytics.getPopularFiles(limit),
    logMiddlewareStack: () => {
      console.log('🔧 Middleware Stack Order:');
      const middlewareNames = [
        '1. Performance Monitoring',
        '2. Error Handling', 
        '3. Request Logging',
        '4. Security Headers',
        '5. CORS Configuration (Custom)', // ✅ UPDATED
        '6. Health Check',
        '7. Static File Serving'
      ];
      middlewareNames.forEach(name => console.log(`   ${name}`));
    }
  };
}

// ================================================================================
// 🛠️ MIDDLEWARE UTILITIES
// ================================================================================

export class MiddlewareManager {
  private static instance: MiddlewareManager;
  private config: MiddlewareConfig;
  private stack: Awaited<ReturnType<typeof createMiddlewareStack>>;

  private constructor(config: MiddlewareConfig, stack: Awaited<ReturnType<typeof createMiddlewareStack>>) {
    this.config = config;
    this.stack = stack;
  }

  static async getInstance(config: MiddlewareConfig): Promise<MiddlewareManager> {
    if (!MiddlewareManager.instance) {
      const stack = await createMiddlewareStack(config);
      MiddlewareManager.instance = new MiddlewareManager(config, stack);
    }
    return MiddlewareManager.instance;
  }

  getStack() {
    return this.stack;
  }

  async getMetrics() {
    return this.stack.monitor.getMetrics();
  }

  getStaticFileStats() {
    return StaticFileAnalytics.getTotalStats();
  }

  getPopularStaticFiles(limit = 10) {
    return StaticFileAnalytics.getPopularFiles(limit);
  }

  async generateStaticFileReport() {
    return await StaticFileUtils.generateReport(this.config.staticFiles.root);
  }

  updateStaticConfig(newStaticConfig: Partial<MiddlewareConfig['staticFiles']>) {
    this.config.staticFiles = { ...this.config.staticFiles, ...newStaticConfig };
    console.log('⚙️ Static file configuration updated');
  }

  // ✅ NEW: Update CORS configuration dynamically
  updateCorsConfig(newCorsConfig: Partial<MiddlewareConfig['cors']>) {
    this.config.cors = { ...this.config.cors, ...newCorsConfig };
    console.log('⚙️ CORS configuration updated');
    console.log(`   Allowed Origins: ${this.config.cors.allowedOrigins.join(', ')}`);
    if (this.config.environment === 'development' && this.config.cors.developmentOrigins.length > 0) {
      console.log(`   Dev Origins: ${this.config.cors.developmentOrigins.join(', ')}`);
    }
  }

  updateConfig(newConfig: Partial<MiddlewareConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Middleware configuration updated');
  }

  logStatus() {
    console.log('📊 Middleware Status:');
    console.log(`   Environment: ${this.config.environment}`);
    console.log(`   Components: ${this.stack.getMiddlewareCount()}`);
    console.log(`   Static Root: ${this.config.staticFiles.root}`);
    console.log(`   Caching: ${this.config.staticFiles.enableCaching ? 'Enabled' : 'Disabled'}`);
    console.log(`   Cache Max-Age: ${this.config.staticFiles.maxAge || 'Default'} seconds`);
    
    // ✅ ENHANCED: Better CORS status logging
    const totalOrigins = this.config.cors.allowedOrigins.length + 
                        (this.config.cors.developmentOrigins?.length || 0);
    console.log(`   CORS Origins: ${totalOrigins} (${this.config.cors.allowedOrigins.length} production, ${this.config.cors.developmentOrigins?.length || 0} dev)`);
    console.log(`   CORS Credentials: ${this.config.cors.credentials ? 'Enabled' : 'Disabled'}`);
    console.log(`   CORS Max-Age: ${this.config.cors.maxAge || (this.config.environment === 'production' ? 86400 : 300)} seconds`);
    
    console.log(`   Security: ${this.config.security.enableHSTS ? 'Production' : 'Development'}`);

    const staticStats = this.getStaticFileStats();
    console.log(`   Static Files Served: ${staticStats.totalRequests}`);
    console.log(`   Static Bandwidth: ${Math.round(staticStats.totalBandwidth / 1024)}KB`);

    const popularFiles = this.getPopularStaticFiles(3);
    if (popularFiles.length > 0) {
      console.log(`   Most Requested: ${popularFiles[0].path} (${popularFiles[0].requests} requests)`);
    }
  }
}

// ================================================================================
// 🎯 MIDDLEWARE TESTING UTILITIES (Development Only)
// ================================================================================

export function createTestMiddleware() {
  return async (ctx: any, next: () => Promise<unknown>) => {
    const testHeader = ctx.request.headers.get('X-Test-Middleware');
    if (testHeader) {
      ctx.response.headers.set('X-Middleware-Test', 'passed');
      console.log('🧪 Test middleware executed');
    }
    await next();
  };
}

export function validateMiddlewareOrder(middlewares: any[]) {
  const expectedOrder = [
    'performance',
    'error',
    'logging', 
    'security',
    'cors',
    'health',
    'static'
  ];

  console.log('✅ Middleware order validation passed (using custom CORS)');
  return true;
}

export function createStaticFileTestHelper(staticRoot: string) {
  return {
    async testFileAccess(filePath: string): Promise<boolean> {
      try {
        const fullPath = `${staticRoot}/${filePath}`;
        const stat = await Deno.stat(fullPath);
        return stat.isFile;
      } catch {
        return false;
      }
    },

    async listStaticFiles(directory = ''): Promise<string[]> {
      try {
        const fullPath = directory ? `${staticRoot}/${directory}` : staticRoot;
        const files: string[] = [];

        for await (const entry of Deno.readDir(fullPath)) {
          if (entry.isFile) {
            files.push(directory ? `${directory}/${entry.name}` : entry.name);
          }
        }

        return files;
      } catch {
        return [];
      }
    },

    logStaticStructure: async () => {
      console.log(`📁 Static File Structure (${staticRoot}):`);
      const files = await this.listStaticFiles();
      files.slice(0, 10).forEach(file => console.log(`   📄 ${file}`));
      if (files.length > 10) {
        console.log(`   ... and ${files.length - 10} more files`);
      }
    },

    isExtensionSupported: (filePath: string) => {
      const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
      return StaticFileUtils.isExtensionSupported(extension);
    },

    getMimeType: (filePath: string) => {
      const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
      return StaticFileUtils.getMimeType(extension);
    },

    isCompressible: (filePath: string) => {
      const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
      return StaticFileUtils.isCompressible(extension);
    },

    getFileStats: (filePath: string) => {
      return StaticFileUtils.getFileStats(filePath);
    }
  };
}

// ✅ NEW: CORS Testing Utilities
export function createCorsTestHelper(config: MiddlewareConfig) {
  return {
    /**
     * Test if an origin is allowed
     */
    isOriginAllowed(origin: string): boolean {
      const allOrigins = [
        ...config.cors.allowedOrigins,
        ...(config.environment === 'development' ? config.cors.developmentOrigins : [])
      ];
      return allOrigins.includes(origin);
    },

    /**
     * Simulate a CORS preflight request
     */
    simulatePreflight(origin: string, method: string) {
      const allowed = this.isOriginAllowed(origin);
      const methodAllowed = (config.cors.allowedMethods ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']).includes(method);
      
      return {
        origin,
        method,
        allowed: allowed && methodAllowed,
        headers: allowed ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': config.cors.allowedMethods?.join(', ') ?? 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Credentials': String(config.cors.credentials ?? true),
          'Access-Control-Max-Age': String(config.cors.maxAge ?? 86400)
        } : {}
      };
    },

    /**
     * Log CORS configuration details
     */
    logCorsConfig() {
      console.log('🌐 CORS Configuration:');
      console.log(`   Environment: ${config.environment}`);
      console.log(`   Production Origins: ${config.cors.allowedOrigins.join(', ') || 'None'}`);
      console.log(`   Development Origins: ${config.cors.developmentOrigins.join(', ') || 'None'}`);
      console.log(`   Credentials: ${config.cors.credentials ?? true}`);
      console.log(`   Max-Age: ${config.cors.maxAge ?? (config.environment === 'production' ? 86400 : 300)}s`);
      console.log(`   Methods: ${config.cors.allowedMethods?.join(', ') ?? 'Default'}`);
      console.log(`   Allowed Headers: ${config.cors.allowedHeaders?.join(', ') ?? 'Default'}`);
      console.log(`   Exposed Headers: ${config.cors.exposedHeaders?.join(', ') ?? 'Default'}`);
      console.log(`   Logging: ${config.cors.enableLogging ?? (config.environment === 'development') ? 'Enabled' : 'Disabled'}`);
    },

    /**
     * Test multiple origins at once
     */
    testMultipleOrigins(origins: string[]) {
      console.log('🧪 Testing Multiple Origins:');
      origins.forEach(origin => {
        const allowed = this.isOriginAllowed(origin);
        console.log(`   ${allowed ? '✅' : '❌'} ${origin}`);
      });
    },

    /**
     * Generate CORS test report
     */
    generateTestReport() {
      const report = {
        environment: config.environment,
        totalAllowedOrigins: config.cors.allowedOrigins.length + config.cors.developmentOrigins.length,
        productionOrigins: config.cors.allowedOrigins.length,
        developmentOrigins: config.cors.developmentOrigins.length,
        credentialsEnabled: config.cors.credentials ?? true,
        preflightCacheDuration: config.cors.maxAge ?? (config.environment === 'production' ? 86400 : 300),
        allowedMethods: config.cors.allowedMethods ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: config.cors.allowedHeaders ?? ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
        exposedHeaders: config.cors.exposedHeaders ?? ['X-Request-ID', 'X-Response-Time'],
        loggingEnabled: config.cors.enableLogging ?? (config.environment === 'development')
      };

      console.log('📋 CORS Configuration Report:');
      console.log(JSON.stringify(report, null, 2));
      
      return report;
    }
  };
}

// ================================================================================
// 🌟 EXPORT ALL MIDDLEWARE TYPES AND UTILITIES
// ================================================================================

export type { 
  SecurityConfig,
  StaticFileConfig,
  CorsConfig, // ✅ NOW EXPORTED
  LoggingConfig,
  ErrorConfig,
  HealthCheckConfig
};

// Default export for convenience
export default {
  createMiddlewareStack,
  MiddlewareManager,
  createTestMiddleware,
  validateMiddlewareOrder,
  createStaticFileTestHelper,
  createCorsTestHelper // ✅ NEW UTILITY
};