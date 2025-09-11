/**
 * ============================================================================
 * DENOGENESIS FRAMEWORK - MAIN APPLICATION ENTRY POINT
 * ============================================================================
 *
 * Unix Philosophy Implementation:
 * 1. Do One Thing Well: Application bootstrap and server management
 * 2. Make Everything a Filter: Clear input → process → output flow
 * 3. Avoid Captive User Interfaces: Structured logging and error reporting
 * 4. Store Data in Flat Text Files: Configuration via .env and simple files
 * 5. Leverage Software Leverage: Compose framework utilities and middleware
 *
 * This is the main entry point for a DenoGenesis Framework application.
 * Updated to use enhanced ConsoleStyler with ASCII art capabilities
 * following Unix Philosophy principles for maximum maintainability.
 *
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 2.1.0-ascii-enhanced
 * @license AGPL-3.0
 * @framework DenoGenesis Framework
 * @follows Unix Philosophy + Deno security model
 * ============================================================================
 */

// ============================================================================
// FRAMEWORK IMPORTS - UNIX PHILOSOPHY COMPLIANT
// ============================================================================

import {
  // Core Oak Framework - HTTP server functionality
  Application,
  send,

  // Environment Management - Configuration loading
  loadEnv,

  // DenoGenesis Framework Components - Request processing
  router,
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,

  // Database Layer - Data persistence
  db,
  getDatabaseStatus,
  closeDatabaseConnection,

  // Environment Configuration - Runtime settings
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,

  // MIME Type Configuration - Static file serving
  DEFAULT_MIME_TYPES,
  getMimeType,
  getSupportedExtensions,
  isExtensionSupported,

  // Process Handler Utilities - Process lifecycle management
  registerSignalHandlers,
  registerErrorHandlers,
  validateHandlerSetup,

  // Framework Utilities - Version and integrity management
  getFrameworkVersion,
  validateFrameworkIntegrity,

  // Console Utilities - Professional logging with ASCII art
  ConsoleStyler,
} from "./mod.ts";

// ============================================================================
// UNIX PRINCIPLE 1: DO ONE THING WELL
// ============================================================================

/**
 * Application Bootstrap Configuration
 *
 * Pure data structure that defines how the application should be configured.
 * Following Unix principle of storing configuration in flat, readable formats.
 */
interface ApplicationBootstrap {
  framework: {
    version: string;
    buildDate: string;
    buildHash?: string;
    siteKey: string;
    environment: string;
  };
  server: {
    port: number;
    host: string;
    environment: string;
  };
  static: {
    root: string;
    supportedExtensions: string[];
    enableCaching: boolean;
    maxAge: number;
  };
  database: {
    enabled: boolean;
    connectionString?: string;
  };
  middleware: {
    enableCors: boolean;
    enableSecurity: boolean;
    enableLogging: boolean;
    enableHealthCheck: boolean;
  };
  processHandlers: {
    enableSignalHandlers: boolean;
    enableErrorHandlers: boolean;
    validateSetup: boolean;
  };
}

/**
 * Create Bootstrap Configuration
 *
 * Pure function that transforms environment variables into typed configuration.
 * Returns complete application configuration without side effects.
 *
 * @param env Environment variables object
 * @returns Complete application bootstrap configuration
 */
function createBootstrapConfig(env: Record<string, string>): ApplicationBootstrap {
  return {
    framework: {
      version: VERSION,
      buildDate: BUILD_DATE,
      buildHash: BUILD_HASH,
      siteKey: SITE_KEY,
      environment: DENO_ENV,
    },
    server: {
      port: PORT,
      host: SERVER_HOST,
      environment: DENO_ENV,
    },
    static: {
      root: Deno.cwd() + "/public",
      supportedExtensions: getSupportedExtensions(),
      enableCaching: DENO_ENV === 'production',
      maxAge: 86400, // 24 hours in seconds
    },
    database: {
      enabled: true, // Can be made configurable via env
      connectionString: env.DATABASE_URL,
    },
    middleware: {
      enableCors: true,
      enableSecurity: true,
      enableLogging: true,
      enableHealthCheck: true,
    },
    processHandlers: {
      enableSignalHandlers: true,
      enableErrorHandlers: true,
      validateSetup: DENO_ENV === 'development',
    },
  };
}

// ============================================================================
// UNIX PRINCIPLE 2: MAKE EVERYTHING A FILTER
// ============================================================================

/**
 * Initialize Process Handlers
 *
 * Pure function that sets up process signal and error handlers.
 * Returns handler references for validation and cleanup.
 *
 * @param config Process handler configuration
 * @param cleanup Cleanup function to call on exit
 * @returns Handler setup results
 */
function initializeProcessHandlers(
  config: ApplicationBootstrap['processHandlers'],
  cleanup: () => Promise<void>
) {
  const results = {
    signalHandlers: config.enableSignalHandlers ? 
      registerSignalHandlers(cleanup) : null,
    errorHandlers: config.enableErrorHandlers ? 
      registerErrorHandlers() : null,
  };

  // Validate setup if requested
  if (config.validateSetup && results.signalHandlers && results.errorHandlers) {
    const validation = validateHandlerSetup(results.signalHandlers, results.errorHandlers);

    if (validation.valid) {
      ConsoleStyler.logSuccess("Process handlers configured correctly");
    } else {
      ConsoleStyler.logWarning("Process handler setup issues detected:");
      validation.issues.forEach(issue => 
        ConsoleStyler.logWarning(`   → ${issue}`)
      );
    }
  }

  return results;
}

/**
 * Create Static File Middleware
 *
 * Pure function that creates static file serving middleware using MIME types.
 * Returns Oak middleware function for composing with application.
 *
 * @param config Static file configuration
 * @returns Oak middleware function
 */
function createStaticFileMiddleware(config: ApplicationBootstrap['static']) {
  return async (ctx: any, next: () => Promise<unknown>) => {
    const filePath = ctx.request.url.pathname;
    const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

    if (isExtensionSupported(extension)) {
      try {
        // Set proper MIME type using framework utilities
        const mimeType = getMimeType(extension);
        if (mimeType) {
          ctx.response.headers.set('Content-Type', mimeType);
        }

        // Add framework version header
        ctx.response.headers.set('X-DenoGenesis-Version', VERSION);

        // Add caching headers for production
        if (config.enableCaching) {
          const cacheableExtensions = ['.css', '.js', '.ts', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'];
          if (cacheableExtensions.includes(extension)) {
            ctx.response.headers.set('Cache-Control', `public, max-age=${config.maxAge}`);
            if (BUILD_HASH) {
              ctx.response.headers.set('ETag', `"${BUILD_HASH}"`);
            }
          }
        }

        await send(ctx, filePath, {
          root: config.root,
          index: "index.html",
        });
        return;
      } catch (error) {
        // File not found, let it fall through to next middleware
        if (DENO_ENV === 'development') {
          ConsoleStyler.logWarning(`Static file not found: ${filePath}`);
        }
      }
    }

    await next();
  };
}

// ============================================================================
// ENHANCED STARTUP DISPLAY WITH ASCII ART
// ============================================================================

/**
 * Display Application Startup Information with ASCII Art
 *
 * Enhanced startup display that uses ConsoleStyler's ASCII art capabilities
 * for professional branding and clear visual feedback.
 *
 * @param config Application bootstrap configuration
 * @returns Startup information object
 */
function displayStartupInfo(config: ApplicationBootstrap) {
  const startTime = Date.now();
  
  const startupInfo = {
    timestamp: new Date().toISOString(),
    startTime,
    framework: {
      name: "DenoGenesis",
      version: config.framework.version,
      buildDate: config.framework.buildDate,
      buildHash: config.framework.buildHash,
    },
    server: {
      port: config.server.port,
      host: config.server.host,
      environment: config.server.environment,
    },
    static: {
      supportedTypes: config.static.supportedExtensions.length,
      cachingEnabled: config.static.enableCaching,
    },
    urls: {
      local: `http://localhost:${config.server.port}`,
      external: `http://${config.server.host}:${config.server.port}`,
      health: `http://localhost:${config.server.port}/health`,
      systemInfo: `http://localhost:${config.server.port}/api/system/info`,
    },
  };

  // Clear console and display framework banner using ASCII art
  ConsoleStyler.clear();
  console.log("\n");
  
  // Display the main framework ASCII art banner
  ConsoleStyler.asciiArt('DENOGENESIS');
  
  console.log("\n");
  
  // Display startup configuration box
  ConsoleStyler.logBox([
    `🚀 Local-First Digital Sovereignty Platform`,
    `📦 Version: ${startupInfo.framework.version}`,
    `🏗️ Build: ${startupInfo.framework.buildHash || 'development'}`,
    `🌍 Environment: ${startupInfo.server.environment}`,
    `⚡ Deno Runtime: ${Deno.version.deno}`,
    `🔧 Site Key: ${config.framework.siteKey}`,
    `🕒 Started: ${startupInfo.timestamp}`,
  ], '✨ Framework Initialization', 'gold');

  return startupInfo;
}

/**
 * Display Framework Ready Status with ASCII Art
 *
 * Enhanced ready display that shows the framework is fully operational
 * with clear visual feedback and comprehensive status information.
 *
 * @param config Application configuration
 * @param startupInfo Startup information
 * @param metrics Runtime metrics
 */
function displayFrameworkReady(
  config: ApplicationBootstrap,
  startupInfo: any,
  metrics: {
    routeCount: number;
    startupTime: number;
    memoryUsage: number;
    featuresEnabled: string[];
  }
) {
  console.log("\n");
  
  // Display the READY ASCII art
  ConsoleStyler.asciiArt('READY');
  
  console.log("\n");
  
  // Use the enhanced logFrameworkReady method
  ConsoleStyler.logFrameworkReady(
    {
      version: config.framework.version,
      port: config.server.port,
      environment: config.server.environment,
    } as any,
    metrics
  );

  // Display URL information
  ConsoleStyler.logBox([
    `🌐 Local Development: ${startupInfo.urls.local}`,
    `🔗 External Access: ${startupInfo.urls.external}`,
    `💚 Health Check: ${startupInfo.urls.health}`,
    `📊 System Info: ${startupInfo.urls.systemInfo}`,
    ``,
    `🎯 Ready to accept connections!`,
  ], '🌍 Access Information', 'success');
}

/**
 * Display Error State with ASCII Art
 *
 * Enhanced error display that provides clear visual feedback
 * when the application fails to start.
 *
 * @param error The error that occurred
 * @param config Application configuration
 */
function displayErrorState(error: Error, config?: ApplicationBootstrap) {
  console.log("\n");
  
  // Display the ERROR ASCII art
  ConsoleStyler.asciiArt('ERROR');
  
  console.log("\n");
  
  // Display error information
  ConsoleStyler.logBox([
    `❌ DenoGenesis Framework startup failed`,
    `🔍 Error: ${error.message}`,
    `📝 Type: ${error.name}`,
    `🕒 Time: ${new Date().toISOString()}`,
    ``,
    `Check the console output above for detailed information.`,
  ], '💥 Startup Error', 'error');

  if (config?.server.environment === 'development' && error.stack) {
    console.log("\n" + "=".repeat(80));
    console.log("📋 STACK TRACE (Development Mode)");
    console.log("=".repeat(80));
    console.log(error.stack);
    console.log("=".repeat(80) + "\n");
  }
}

// ============================================================================
// MAIN APPLICATION BOOTSTRAP - ENHANCED WITH ASCII ART
// ============================================================================

/**
 * Main Application Bootstrap
 *
 * Unix Philosophy: Clear pipeline of pure functions that transform
 * configuration → setup → application → server
 * Enhanced with visual feedback using ASCII art
 */
async function main() {
  const overallStartTime = Date.now();
  
  try {
    // Step 1: Load environment (input)
    ConsoleStyler.logInfo("🔧 Loading environment configuration...");
    const env = await loadEnv();

    // Step 2: Transform to configuration (filter)
    ConsoleStyler.logInfo("⚙️ Creating bootstrap configuration...");
    const config = createBootstrapConfig(env);

    // Step 3: Display startup information with ASCII art (output + continue)
    const startupInfo = displayStartupInfo(config);

    // Step 4: Initialize process handlers (side effect with validation)
    ConsoleStyler.logInfo("🛡️ Initializing process handlers...");
    const cleanup = async () => {
      ConsoleStyler.logInfo("🧹 Performing graceful shutdown...");
      try {
        await closeDatabaseConnection();
        ConsoleStyler.logSuccess("Database connection closed");
      } catch (error) {
        ConsoleStyler.logError(`Database cleanup failed: ${error.message}`);
      }
    };

    const handlers = initializeProcessHandlers(config.processHandlers, cleanup);

    // Step 5: Validate framework integrity (quality assurance)
    ConsoleStyler.logInfo("🔍 Validating framework integrity...");
    const integrity = await validateFrameworkIntegrity();
    if (integrity.valid) {
      ConsoleStyler.logSuccess(`Framework integrity verified`);
    } else {
      ConsoleStyler.logWarning("Framework integrity issues detected:");
      integrity.issues.forEach(issue => ConsoleStyler.logWarning(`   → ${issue}`));
    }

    // Step 6: Initialize database (data layer)
    if (config.database.enabled) {
      ConsoleStyler.logInfo("🗄️ Initializing database connection...");
      try {
        const dbStatus = await getDatabaseStatus();
        if (dbStatus.connected) {
          ConsoleStyler.logSuccess(`Database connected successfully`);
        } else {
          ConsoleStyler.logWarning("Database connection issues detected");
        }
      } catch (error) {
        ConsoleStyler.logError(`Database initialization failed: ${error.message}`);
      }
    }

    // Step 7: Create application instance (application framework)
    ConsoleStyler.logInfo("🏗️ Creating application instance...");
    const app = new Application();

    // Step 8: Configure middleware stack (request processing pipeline)
    ConsoleStyler.logInfo("🔧 Configuring middleware stack...");
    const middlewareConfig: MiddlewareConfig = {
      cors: {
        origin: CORS_ORIGINS.split(',').map(origin => origin.trim()),
        credentials: true,
      },
      security: {
        contentSecurityPolicy: DENO_ENV === 'development' ?
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:;" :
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        frameOptions: 'SAMEORIGIN',
      },
      logging: {
        logLevel: DENO_ENV === 'development' ? 'debug' : 'info',
        logRequests: true,
        logResponses: DENO_ENV === 'development',
      },
      healthCheck: {
        endpoint: '/health',
        includeMetrics: true,
        includeEnvironment: true,
      },
    };

    // Create and apply middleware
    const { monitor, middlewares } = createMiddlewareStack(middlewareConfig);

    // Apply each middleware to the application
    middlewares.forEach((middleware, index) => {
      app.use(middleware);
      ConsoleStyler.logSuccess(`Middleware ${index + 1}/${middlewares.length} applied`);
    });

    ConsoleStyler.logSuccess(`Middleware stack initialized (${middlewares.length} components)`);

    // Step 9: Add static file middleware (using MIME types utility)
    ConsoleStyler.logInfo("📁 Configuring static file handler...");
    const staticMiddleware = createStaticFileMiddleware(config.static);
    app.use(staticMiddleware);
    ConsoleStyler.logSuccess(`Static file handler configured (${config.static.supportedExtensions.length} file types)`);

    // Step 10: Register routes (application logic)
    ConsoleStyler.logInfo("🛣️ Registering application routes...");
    app.use(router.routes());
    app.use(router.allowedMethods());
    
    // Count registered routes for metrics
    const routeCount = (router as any).stack?.length || 0;
    ConsoleStyler.logSuccess(`Routes registered successfully (${routeCount} endpoints)`);

    // Step 11: Calculate startup metrics and display ready state
    const totalStartupTime = Date.now() - overallStartTime;
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    const metrics = {
      routeCount,
      startupTime: totalStartupTime,
      memoryUsage,
      featuresEnabled: [
        config.middleware.enableCors && 'CORS',
        config.middleware.enableSecurity && 'Security',
        config.middleware.enableLogging && 'Logging',
        config.middleware.enableHealthCheck && 'Health Check',
        config.static.enableCaching && 'Static Caching',
        config.database.enabled && 'Database',
      ].filter(Boolean) as string[],
    };

    // Display the final ready state with ASCII art
    displayFrameworkReady(config, startupInfo, metrics);

    // Step 12: Start server (final action)
    ConsoleStyler.logInfo("🚀 Starting HTTP server...");
    await app.listen({
      port: config.server.port,
      hostname: config.server.host === 'localhost' ? '0.0.0.0' : config.server.host,
    });

  } catch (error) {
    // Enhanced error handling with ASCII art display
    displayErrorState(error as Error);

    // Unix Philosophy: Explicit error handling with structured output
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      },
      process: {
        pid: Deno.pid,
        version: Deno.version.deno,
      },
    };

    ConsoleStyler.logError(`Failed to start DenoGenesis Framework: ${(error as Error).message}`);

    // Attempt graceful cleanup
    try {
      await closeDatabaseConnection();
      ConsoleStyler.logInfo("Database connection closed during error cleanup");
    } catch (dbError) {
      ConsoleStyler.logError(`Database cleanup failed: ${(dbError as Error).message}`);
    }

    Deno.exit(1);
  }
}

// ============================================================================
// UNIX PRINCIPLE 5: LEVERAGE SOFTWARE LEVERAGE
// ============================================================================

/**
 * Execute main bootstrap if this is the main module
 *
 * Unix Philosophy: Scripts should be executable and composable
 * This allows main.ts to be imported by other modules for testing
 * or executed directly as the application entry point.
 */
if (import.meta.main) {
  main();
}

// Export for testing and composition
export { 
  main, 
  createBootstrapConfig, 
  initializeProcessHandlers, 
  createStaticFileMiddleware,
  displayStartupInfo,
  displayFrameworkReady,
  displayErrorState,
};