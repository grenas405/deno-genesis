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
 * Updated to use the centralized mod.ts export hub with split utilities
 * following Unix Philosophy principles for maximum maintainability.
 *
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 2.0.0-unix-compliant
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
interface ApplicationBootstrap {
  /** Server configuration */
  server: {
    port: number;
    host: string;
    environment: string;
  };
  /** Static file serving configuration */
  static: {
    root: string;
    enableCaching: boolean;
    maxAge: number;
    supportedExtensions: readonly string[];
  };
  /** Process management configuration */
  process: {
    enableSignalHandlers: boolean;
    enableErrorHandlers: boolean;
    validateSetup: boolean;
  };
  /** Framework metadata */
  framework: {
    version: string;
    buildDate: string;
    buildHash?: string;
    siteKey: string;
  };
}

// ============================================================================
// UNIX PRINCIPLE 2: MAKE EVERYTHING A FILTER
// ============================================================================

/**
 * Create Application Bootstrap Configuration
 *
 * Pure function that transforms environment variables into application config.
 * Returns structured configuration object instead of side effects.
 *
 * @param env Environment variables loaded from .env file
 * @returns ApplicationBootstrap configuration object
 */
function createBootstrapConfig(env: Record<string, string>): ApplicationBootstrap {
  const port = parseInt(env.PORT || PORT.toString() || "3000");
  const supportedExtensions = getSupportedExtensions();

  return {
    server: {
      port,
      host: SERVER_HOST,
      environment: DENO_ENV,
    },
    static: {
      root: `${Deno.cwd()}/public`,
      enableCaching: DENO_ENV === 'production',
      maxAge: DENO_ENV === 'production' ? 86400 : 300,
      supportedExtensions,
    },
    process: {
      enableSignalHandlers: true,
      enableErrorHandlers: true,
      validateSetup: true,
    },
    framework: {
      version: VERSION,
      buildDate: BUILD_DATE,
      buildHash: BUILD_HASH,
      siteKey: SITE_KEY,
    },
  };
}

/**
 * Initialize Process Handlers
 *
 * Pure function that sets up signal and error handlers.
 * Returns registration information for validation and monitoring.
 *
 * @param config Process configuration
 * @returns Process handler setup result
 */
async function initializeProcessHandlers(config: ApplicationBootstrap['process']) {
  if (!config.enableSignalHandlers && !config.enableErrorHandlers) {
    return { enabled: false };
  }

  const cleanup = async () => {
    ConsoleStyler.logInfo("🧹 Starting cleanup process...");

    try {
      await closeDatabaseConnection();
      ConsoleStyler.logSuccess("✅ Database connection closed gracefully");
    } catch (error) {
      ConsoleStyler.logError(`❌ Error closing database: ${error.message}`);
    }
  };

  const results = {
    enabled: true,
    signalHandlers: config.enableSignalHandlers ? registerSignalHandlers(cleanup) : null,
    errorHandlers: config.enableErrorHandlers ? registerErrorHandlers() : null,
  };

  // Validate setup if requested
  if (config.validateSetup && results.signalHandlers && results.errorHandlers) {
    const validation = validateHandlerSetup(results.signalHandlers, results.errorHandlers);

    if (validation.valid) {
      ConsoleStyler.logSuccess("✅ Process handlers configured correctly");
    } else {
      ConsoleStyler.logWarning("⚠️ Process handler setup issues:");
      validation.issues.forEach(issue => ConsoleStyler.logWarning(`   → ${issue}`));
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
          root: config.static.root,
          index: "index.html",
        });
        return;
      } catch (error) {
        // File not found, let it fall through to next middleware
        if (DENO_ENV === 'development') {
          ConsoleStyler.logWarning(`📁 Static file not found: ${filePath}`);
        }
      }
    }

    await next();
  };
}

// ============================================================================
// UNIX PRINCIPLE 3: AVOID CAPTIVE USER INTERFACES
// ============================================================================

/**
 * Display Application Startup Information
 *
 * Returns structured startup information instead of just logging.
 * Other programs can consume this data for monitoring or testing.
 *
 * @param config Application bootstrap configuration
 * @returns Startup information object
 */
function displayStartupInfo(config: ApplicationBootstrap) {
  const startupInfo = {
    timestamp: new Date().toISOString(),
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

  // Display banner using structured logging with ConsoleStyler
  ConsoleStyler.clear();
  ConsoleStyler.logCustom("\n" + "=".repeat(80), "", "cyan");
  ConsoleStyler.logCustom("🚀 DENOGENESIS FRAMEWORK - UNIX PHILOSOPHY EDITION", "", "brightCyan");
  ConsoleStyler.logCustom("=".repeat(80), "", "cyan");
  ConsoleStyler.logInfo(`📦 Framework: ${startupInfo.framework.name} v${startupInfo.framework.version}`);
  ConsoleStyler.logInfo(`🏗️ Build: ${startupInfo.framework.buildHash || 'development'} (${startupInfo.framework.buildDate})`);
  ConsoleStyler.logInfo(`🌍 Environment: ${startupInfo.server.environment}`);
  ConsoleStyler.logInfo(`⚡ Deno: ${Deno.version.deno}`);
  ConsoleStyler.logInfo(`🔧 Site: ${config.framework.siteKey}`);
  ConsoleStyler.logInfo(`🕒 Started: ${startupInfo.timestamp}`);
  ConsoleStyler.logCustom("=".repeat(80), "", "cyan");

  return startupInfo;
}

// ============================================================================
// MAIN APPLICATION BOOTSTRAP - UNIX PHILOSOPHY FLOW
// ============================================================================

/**
 * Main Application Bootstrap
 *
 * Unix Philosophy: Clear pipeline of pure functions that transform
 * configuration → setup → application → server
 */
async function main() {
  try {
    // Step 1: Load environment (input)
    const env = await loadEnv();

    // Step 2: Transform to configuration (filter)
    const config = createBootstrapConfig(env);

    // Step 3: Display startup information (output + continue)
    const startupInfo = displayStartupInfo(config);

    // Step 4: Initialize process handlers (side effect with structured result)
    const processSetup = await initializeProcessHandlers(config.process);

    // Step 5: Run framework integrity check (validation)
    ConsoleStyler.logInfo("🔍 Running framework integrity validation...");
    const integrity = await validateFrameworkIntegrity();

    if (integrity.overall) {
      ConsoleStyler.logSuccess("✅ Framework integrity: PASSED");
    } else {
      ConsoleStyler.logWarning("⚠️ Framework integrity: ISSUES DETECTED");
      if (integrity.details.warnings?.length) {
        integrity.details.warnings.forEach(warning =>
          ConsoleStyler.logWarning(`   → ${warning}`)
        );
      }
    }

    // Step 6: Create Oak application (initialize)
    const app = new Application();

    // Step 7: Configure middleware stack (composition)
    ConsoleStyler.logInfo("🔧 Initializing middleware stack...");

    const middlewareConfig: MiddlewareConfig = {
      environment: config.server.environment,
      port: config.server.port,
      staticFiles: {
        root: config.static.root,
        enableCaching: config.static.enableCaching,
        maxAge: config.static.maxAge,
      },
      cors: {
        allowedOrigins: DENO_ENV === 'production' ?
          CORS_ORIGINS.filter(origin => !origin.includes('localhost')) :
          CORS_ORIGINS,
        developmentOrigins: CORS_ORIGINS.filter(origin => origin.includes('localhost')),
        credentials: true,
        maxAge: config.static.maxAge,
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
        includeEnvironment: true,
      },
    };

    // Create and apply middleware
    const { monitor, middlewares } = createMiddlewareStack(middlewareConfig);

    // Apply each middleware to the application
    middlewares.forEach((middleware, index) => {
      app.use(middleware);
      ConsoleStyler.logSuccess(`✅ Middleware ${index + 1}/${middlewares.length} applied`);
    });

    ConsoleStyler.logSuccess(`✅ Middleware stack initialized (${middlewares.length} components)`);

    // Step 8: Add static file middleware (using MIME types utility)
    const staticMiddleware = createStaticFileMiddleware(config);
    app.use(staticMiddleware);
    ConsoleStyler.logSuccess(`✅ Static file handler configured (${config.static.supportedExtensions.length} file types)`);

    // Step 9: Register routes (application logic)
    app.use(router.routes());
    app.use(router.allowedMethods());
    ConsoleStyler.logSuccess("✅ Routes registered successfully");

    // Step 10: Final startup summary
    ConsoleStyler.logCustom("\n" + "=".repeat(80), "", "cyan");
    ConsoleStyler.logSuccess("🎯 DenoGenesis Framework Ready!");
    ConsoleStyler.logInfo(`🌐 Local: ${startupInfo.urls.local}`);
    ConsoleStyler.logInfo(`🔗 External: ${startupInfo.urls.external}`);
    ConsoleStyler.logInfo(`💚 Health: ${startupInfo.urls.health}`);
    ConsoleStyler.logInfo(`📊 System: ${startupInfo.urls.systemInfo}`);
    ConsoleStyler.logCustom("=".repeat(80) + "\n", "", "cyan");

    // Step 11: Start server (final action)
    await app.listen({
      port: config.server.port,
      hostname: config.server.host === 'localhost' ? '0.0.0.0' : config.server.host,
    });

  } catch (error) {
    // Unix Philosophy: Explicit error handling with structured output
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      process: {
        pid: Deno.pid,
        version: Deno.version.deno,
      },
    };

    ConsoleStyler.logError(`❌ Failed to start DenoGenesis Framework:`);
    ConsoleStyler.logError(`   → ${error.message}`);

    if (DENO_ENV === 'development') {
      ConsoleStyler.logError("Stack trace:");
      ConsoleStyler.logError(error.stack || 'No stack trace available');
    }

    // Attempt graceful cleanup
    try {
      await closeDatabaseConnection();
      ConsoleStyler.logInfo("✅ Database connection closed during error cleanup");
    } catch (dbError) {
      ConsoleStyler.logError(`❌ Database cleanup failed: ${dbError.message}`);
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
export { main, createBootstrapConfig, initializeProcessHandlers, createStaticFileMiddleware };