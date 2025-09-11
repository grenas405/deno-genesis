/**
 * ============================================================================
 * DENOGENESIS FRAMEWORK - ENHANCED MAIN APPLICATION ENTRY POINT
 * ============================================================================
 *
 * Unix Philosophy Implementation:
 * 1. Do One Thing Well: Application bootstrap and server management
 * 2. Make Everything a Filter: Clear input → process → output flow
 * 3. Avoid Captive User Interfaces: Structured logging and error reporting
 * 4. Store Data in Flat Text Files: Configuration via .env and simple files
 * 5. Leverage Software Leverage: Compose framework utilities and middleware
 *
 * Enhanced with comprehensive ConsoleStyler integration for enterprise-grade
 * application monitoring, debugging, and operational visibility.
 *
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 2.1.0-enhanced-logging
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

  validateFrameworkIntegrity,
  getFrameworkVersion,

  // Process Handler Utilities - Process lifecycle management
  registerSignalHandlers,
  registerErrorHandlers,
  validateHandlerSetup,

  // Console Utilities - Professional logging
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
interface AppBootstrapConfig {
  port: number;
  host: string;
  environment: string;
  enableFrameworkIntegrity: boolean;
  enableDatabaseConnection: boolean;
  enableAdvancedLogging: boolean;
}

/**
 * Performance Metrics Tracking
 */
interface AppMetrics {
  startTime: number;
  totalRequests: number;
  totalErrors: number;
  dbConnections: number;
  lastHealthCheck?: Date;
}

/**
 * Dependency Status Tracking
 */
interface DependencyInfo {
  name: string;
  version: string;
  status: 'loaded' | 'error' | 'missing';
  optional?: boolean;
}

// ============================================================================
// UNIX PRINCIPLE 2: GLOBAL APPLICATION STATE
// ============================================================================

/**
 * Application metrics - centralized state tracking
 */
const appMetrics: AppMetrics = {
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  dbConnections: 0,
};

/**
 * Bootstrap configuration from environment
 */
const bootstrapConfig: AppBootstrapConfig = {
  port: PORT,
  host: SERVER_HOST,
  environment: DENO_ENV,
  corsOrigins: CORS_ORIGINS,
  enableFrameworkIntegrity: true,
  enableDatabaseConnection: true,
  enableAdvancedLogging: DENO_ENV === 'development',
};

// ============================================================================
// UNIX PRINCIPLE 3: COMPOSABLE UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate application configuration for banner display
 */
function generateAppConfig(): any {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    environment: DENO_ENV,
    port: PORT,
    author: "Pedro M. Dominguez - Dominguez Tech Solutions LLC",
    repository: "https://github.com/domtech/denogenesis",
    description: "Enterprise-grade Deno framework following Unix Philosophy",
    features: [
      "Unix Philosophy Compliant",
      "Type-Safe Routing",
      "Advanced Middleware",
      "Enterprise Logging",
      "Database Integration",
      "Security Hardened"
    ],
    database: "SQLite with Enterprise Extensions",
    ai: {
      enabled: false,
      models: []
    }
  };
}

/**
 * Collect dependency information for status display
 */
function collectDependencyInfo(): DependencyInfo[] {
  const dependencies: DependencyInfo[] = [
    { name: "Oak Framework", version: "12.6.1", status: "loaded" },
    { name: "CORS Middleware", version: "1.2.2", status: "loaded" },
    { name: "DotEnv", version: "3.2.2", status: "loaded" },
    { name: "DenoGenesis Router", version: VERSION, status: "loaded" },
    { name: "DenoGenesis Middleware", version: VERSION, status: "loaded" },
    { name: "Process Handlers", version: VERSION, status: "loaded" },
    { name: "MIME Type Manager", version: VERSION, status: "loaded" },
    { name: "Framework Validator", version: VERSION, status: "loaded" },
  ];

  // Add database dependency if enabled
  if (bootstrapConfig.enableDatabaseConnection) {
    try {
      const dbStatus = getDatabaseStatus();
      dependencies.push({
        name: "Database Connection",
        version: "SQLite",
        status: dbStatus ? "loaded" : "error"
      });
    } catch {
      dependencies.push({
        name: "Database Connection",
        version: "SQLite",
        status: "error"
      });
    }
  }

  return dependencies;
}

/**
 * Initialize database connection with enhanced logging
 */
async function initializeDatabase(): Promise<boolean> {
  if (!bootstrapConfig.enableDatabaseConnection) {
    ConsoleStyler.logInfo("Database connection disabled in configuration");
    return true;
  }

  const spinner = ConsoleStyler.createSpinner("Establishing database connection...");
  const startTime = performance.now();

  try {
    spinner.start();
    
    // Simulate connection time for demonstration
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dbStatus = getDatabaseStatus();
    const duration = performance.now() - startTime;
    
    if (dbStatus) {
      appMetrics.dbConnections = 1;
      spinner.stop("Database connection established successfully");
      ConsoleStyler.logDatabase("Connection established", "main", duration);
      return true;
    } else {
      spinner.stop();
      ConsoleStyler.logError("Database connection failed");
      return false;
    }
  } catch (error) {
    spinner.stop();
    ConsoleStyler.logError("Database initialization error", { 
      error: error.message,
      duration: performance.now() - startTime 
    });
    return false;
  }
}

/**
 * Validate framework integrity with enhanced reporting
 */
async function validateFramework(): Promise<boolean> {
  if (!bootstrapConfig.enableFrameworkIntegrity) {
    ConsoleStyler.logInfo("Framework integrity validation disabled");
    return true;
  }

  const spinner = ConsoleStyler.createSpinner("Validating framework integrity...");
  const startTime = performance.now();

  try {
    spinner.start();
    
    const isValid = await validateFrameworkIntegrity();
    const frameworkVersion = getFrameworkVersion();
    const duration = performance.now() - startTime;
    
    if (isValid) {
      spinner.stop("Framework integrity validated successfully");
      ConsoleStyler.logSuccess(`Framework v${frameworkVersion} integrity check passed`, {
        duration: `${duration.toFixed(2)}ms`,
        buildHash: BUILD_HASH
      });
      return true;
    } else {
      spinner.stop();
      ConsoleStyler.logError("Framework integrity validation failed");
      return false;
    }
  } catch (error) {
    spinner.stop();
    ConsoleStyler.logError("Framework validation error", { 
      error: error.message,
      duration: performance.now() - startTime 
    });
    return false;
  }
}

/**
 * Setup enhanced request logging middleware
 */
function createRequestLogger() {
  return async (ctx: any, next: any) => {
    const startTime = performance.now();
    const method = ctx.request.method;
    const url = ctx.request.url.pathname;
    
    appMetrics.totalRequests++;
    
    try {
      await next();
      const duration = performance.now() - startTime;
      const status = ctx.response.status;
      
      // Log route with timing
      ConsoleStyler.logRoute(
        method,
        url,
        `Status: ${status}`,
        duration
      );
      
    } catch (error) {
      appMetrics.totalErrors++;
      const duration = performance.now() - startTime;
      
      ConsoleStyler.logError(`Request failed: ${method} ${url}`, {
        error: error.message,
        duration: `${duration.toFixed(2)}ms`,
        userAgent: ctx.request.headers.get("user-agent")
      });
      throw error;
    }
  };
}

/**
 * Display application performance metrics
 */
function displayPerformanceMetrics() {
  const uptime = Date.now() - appMetrics.startTime;
  const successRate = appMetrics.totalRequests > 0 
    ? ((appMetrics.totalRequests - appMetrics.totalErrors) / appMetrics.totalRequests * 100).toFixed(2)
    : "100.00";

  const metrics = {
    uptime: `${(uptime / 1000).toFixed(1)}s`,
    requests: appMetrics.totalRequests,
    errors: appMetrics.totalErrors,
    successRate: `${successRate}%`,
    memory: (() => {
      try {
        const memUsage = Deno.memoryUsage();
        return {
          heapUsed: ConsoleStyler.formatBytes ? ConsoleStyler.formatBytes(memUsage.heapUsed) : `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: ConsoleStyler.formatBytes ? ConsoleStyler.formatBytes(memUsage.heapTotal) : `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          external: ConsoleStyler.formatBytes ? ConsoleStyler.formatBytes(memUsage.external) : `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
          rss: ConsoleStyler.formatBytes ? ConsoleStyler.formatBytes(memUsage.rss) : `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        };
      } catch {
        return {
          heapUsed: "N/A",
          heapTotal: "N/A", 
          external: "N/A",
          rss: "N/A"
        };
      }
    })(),
    database: {
      connections: appMetrics.dbConnections,
      queries: 0, // Would be tracked in actual implementation
      avgQueryTime: 0
    }
  };

  ConsoleStyler.printTable([
    { label: "Uptime", value: metrics.uptime },
    { label: "Total Requests", value: metrics.requests.toString() },
    { label: "Errors", value: metrics.errors.toString() },
    { label: "Success Rate", value: metrics.successRate },
    { label: "Heap Used", value: metrics.memory.heapUsed },
    { label: "Heap Total", value: metrics.memory.heapTotal },
    { label: "DB Connections", value: metrics.database.connections.toString() }
  ], "Application Metrics");
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(app: Application) {
  const shutdownHandler = async (signal: string) => {
    ConsoleStyler.logWarning(`Received ${signal}, initiating graceful shutdown...`);
    
    const spinner = ConsoleStyler.createSpinner("Shutting down application...");
    spinner.start();
    
    try {
      // Display final metrics
      displayPerformanceMetrics();
      
      // Close database connections
      if (bootstrapConfig.enableDatabaseConnection) {
        await closeDatabaseConnection();
        ConsoleStyler.logDatabase("Connection closed");
      }
      
      spinner.stop("Application shutdown completed successfully");
      ConsoleStyler.logSuccess("Goodbye! 👋");
      
      Deno.exit(0);
    } catch (error) {
      spinner.stop();
      ConsoleStyler.logError("Error during shutdown", { error: error.message });
      Deno.exit(1);
    }
  };

  // Register signal handlers
  registerSignalHandlers(shutdownHandler);
  registerErrorHandlers((error) => {
    ConsoleStyler.logCritical("Unhandled application error", { 
      error: error.message,
      stack: error.stack 
    });
  });
}

// ============================================================================
// UNIX PRINCIPLE 4: MAIN APPLICATION FLOW
// ============================================================================

/**
 * Main application entry point with enhanced logging and monitoring
 */
async function main(): Promise<void> {
  try {
    // ========================================================================
    // Phase 1: Environment and Configuration
    // ========================================================================
    
    // Display startup banner
    const appConfig = generateAppConfig();
    ConsoleStyler.printBanner(appConfig);
    
    // Display environment information
    ConsoleStyler.logEnvironment(DENO_ENV, appConfig.features);
    
    // Load and validate environment configuration
    await loadEnv({ export: true });
    ConsoleStyler.logSuccess("Environment configuration loaded", {
      port: PORT,
      host: SERVER_HOST,
      environment: DENO_ENV
    });
    
    // ========================================================================
    // Phase 2: Framework Validation and Dependencies
    // ========================================================================
    
    // Validate framework integrity
    const frameworkValid = await validateFramework();
    if (!frameworkValid) {
      ConsoleStyler.logCritical("Framework validation failed - aborting startup");
      Deno.exit(1);
    }
    
    // Display dependency status
    const dependencies = collectDependencyInfo();
    ConsoleStyler.logDependencies(dependencies);
    
    // ========================================================================
    // Phase 3: Database Initialization
    // ========================================================================
    
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized && bootstrapConfig.enableDatabaseConnection) {
      ConsoleStyler.logWarning("Database initialization failed - continuing without database");
    }
    
    // ========================================================================
    // Phase 4: Application and Middleware Setup
    // ========================================================================
    
    ConsoleStyler.logSection("🚀 Application Initialization", "blue");
    
    // Create Oak application
    const app = new Application();
    ConsoleStyler.logSuccess("Oak application instance created");
    
    // Setup error handling
    app.addEventListener("error", (evt) => {
      appMetrics.totalErrors++;
      ConsoleStyler.logError("Application error", {
        error: evt.error.message,
        stack: evt.error.stack
      });
    });
    
    // Create and configure middleware stack
    const middlewareConfig: MiddlewareConfig = {
      environment: DENO_ENV,
      port: PORT,
      staticFiles: {
        root: `${Deno.cwd()}/static`,
        enableCaching: DENO_ENV === 'production',
        maxAge: DENO_ENV === 'production' ? 86400 : 300,
      },
      cors: {
        allowedOrigins: CORS_ORIGINS,
        developmentOrigins: CORS_ORIGINS.filter(origin => origin.includes('localhost')),
        credentials: true,
        maxAge: DENO_ENV === 'production' ? 86400 : 300,
      },
      security: {
        enableHSTS: DENO_ENV === 'production',
        contentSecurityPolicy: DENO_ENV === 'production'
          ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
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
        includeEnvironment: DENO_ENV === 'development',
      },
    };
    
    const middlewareStack = createMiddlewareStack(middlewareConfig);
    ConsoleStyler.logSuccess("Middleware stack configured", { 
      middlewareCount: middlewareStack.length,
      cors: middlewareConfig.enableCors,
      compression: middlewareConfig.enableCompression 
    });
    
    // Add request logging middleware
    app.use(createRequestLogger());
    
    // Apply middleware stack
    middlewareStack.forEach(middleware => {
      app.use(middleware);
    });
    
    // Add router
    app.use(router.routes());
    app.use(router.allowedMethods());
    ConsoleStyler.logSuccess("Router configured and mounted");
    
    // ========================================================================
    // Phase 5: Static File Serving Configuration
    // ========================================================================
    
    // Configure static file serving
    app.use(async (ctx) => {
      try {
        await send(ctx, ctx.request.url.pathname, {
          root: `${Deno.cwd()}/static`,
          index: "index.html",
        });
      } catch {
        // Let other middleware handle non-static requests
        return;
      }
    });
    
    const supportedExtensions = getSupportedExtensions();
    ConsoleStyler.logSuccess("Static file serving configured", {
      supportedExtensions: supportedExtensions.length,
      mimeTypes: Object.keys(DEFAULT_MIME_TYPES).length
    });
    
    // ========================================================================
    // Phase 6: Graceful Shutdown Setup
    // ========================================================================
    
    setupGracefulShutdown(app);
    ConsoleStyler.logSuccess("Graceful shutdown handlers registered");
    
    // ========================================================================
    // Phase 7: Server Startup
    // ========================================================================
    
    ConsoleStyler.logSection("🌐 Server Startup", "green");
    
    const serverOptions = {
      port: bootstrapConfig.port,
      hostname: bootstrapConfig.host,
    };
    
    // Display startup summary
    ConsoleStyler.printBox(
      `Server starting on ${bootstrapConfig.host}:${bootstrapConfig.port}\nEnvironment: ${DENO_ENV}\nFramework: DenoGenesis v${VERSION}`,
      "Server Configuration",
      "green"
    );
    
    // Start the server
    ConsoleStyler.logSuccess(`🚀 Server listening on http://${bootstrapConfig.host}:${bootstrapConfig.port}`);
    ConsoleStyler.logInfo("Press Ctrl+C to gracefully shutdown the server");
    
    // Start metrics display interval in development
    if (DENO_ENV === 'development') {
      setInterval(() => {
        if (appMetrics.totalRequests > 0) {
          displayPerformanceMetrics();
        }
      }, 30000); // Display metrics every 30 seconds
    }
    
    await app.listen(serverOptions);
    
  } catch (error) {
    ConsoleStyler.logCritical("Fatal error during application startup", {
      error: error.message,
      stack: error.stack
    });
    
    // Ensure cleanup on fatal error
    try {
      if (bootstrapConfig.enableDatabaseConnection) {
        await closeDatabaseConnection();
      }
    } catch (cleanupError) {
      ConsoleStyler.logError("Error during cleanup", { 
        error: cleanupError.message 
      });
    }
    
    Deno.exit(1);
  }
}

// ============================================================================
// UNIX PRINCIPLE 5: SINGLE ENTRY POINT
// =========================================

/**
 * Application entry point with error boundary
 */
if (import.meta.main) {
  main().catch((error) => {
    ConsoleStyler.logCritical("Unhandled error in main", {
      error: error.message,
      stack: error.stack
    });
    Deno.exit(1);
  });
}