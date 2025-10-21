/**
 * ============================================================================
 * DENOGENESIS FRAMEWORK - ENHANCED MAIN APPLICATION ENTRY POINT
 * ============================================================================
 *
 * Unix Philosophy Implementation with Enhanced Logging:
 * 1. Do One Thing Well: Application bootstrap and server management
 * 2. Make Everything a Filter: Clear input → process → output flow
 * 3. Avoid Captive User Interfaces: Structured logging and error reporting
 * 4. Store Data in Flat Text Files: Configuration via .env and simple files
 * 5. Leverage Software Leverage: Compose framework utilities and middleware
 *
 * Enhanced with comprehensive ConsoleStyler integration for enterprise-grade
 * application monitoring, debugging, and operational visibility.
 * All imports centralized through mod.ts for version consistency.
 *
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 2.2.1-cors-fixed
 * @license AGPL-3.0
 * @framework DenoGenesis Framework
 * @follows Unix Philosophy + Centralized Module Pattern
 * ============================================================================
 */

// ============================================================================
// CENTRALIZED FRAMEWORK IMPORTS - ALL THROUGH MOD.TS
// ============================================================================

import {
  // Core Oak Framework - HTTP server functionality
  Application,
  BUILD_DATE,
  BUILD_HASH,
  closeDatabaseConnection,
  // Console Utilities - Professional logging
  ConsoleStyler,
  CORS_ORIGINS,
  // Custom CORS utilities
  createCorsTestHelper,
  createMiddlewareStack,
  createStaticFileTestHelper,
  // Database Layer - Data persistence
  db,
  DB_HOST,
  // MIME Type Configuration - Static file serving
  DEFAULT_MIME_TYPES,
  DENO_ENV,
  getDatabaseStatus,
  getFrameworkVersion,
  getMimeType,
  getSupportedExtensions,
  isExtensionSupported,
  // Environment Management - Configuration loading
  loadEnv,
  type MiddlewareConfig,
  MiddlewareManager,
  // Environment Configuration - Runtime settings
  PORT,
  registerErrorHandlers,
  // Process Handler Utilities - Process lifecycle management
  registerSignalHandlers,
  // DenoGenesis Framework Components - Request processing
  router,
  SITE_KEY,
  StaticFileAnalytics,
  StaticFileHandler,
  StaticFileUtils,
  // Framework Utilities
  validateFrameworkIntegrity,
  validateHandlerSetup,
  VERSION,
} from "./mod.ts";

// ============================================================================
// APPLICATION CONFIGURATION - UNIX PHILOSOPHY COMPLIANT
// ============================================================================

/**
 * Application Bootstrap Configuration
 */
interface AppBootstrapConfig {
  port: number;
  host: string;
  environment: string;
  enableFrameworkIntegrity: boolean;
  enableDatabaseConnection: boolean;
  enableAdvancedLogging: boolean;
  enableCorsValidation: boolean;
}

/**
 * Performance Metrics Tracking
 */
interface AppMetrics {
  startTime: number;
  totalRequests: number;
  totalErrors: number;
  dbConnections: number;
  corsRequests: number;
  corsBlocked: number;
  lastHealthCheck?: Date;
}

/**
 * Dependency Status Tracking
 */
interface DependencyInfo {
  name: string;
  version: string;
  status: "loaded" | "error" | "missing";
  optional?: boolean;
}

// ============================================================================
// GLOBAL APPLICATION STATE
// ============================================================================

/**
 * Application metrics - centralized state tracking
 */
const appMetrics: AppMetrics = {
  startTime: Date.now(),
  totalRequests: 0,
  totalErrors: 0,
  dbConnections: 0,
  corsRequests: 0,
  corsBlocked: 0,
};

/**
 * Bootstrap configuration from environment
 */
const bootstrapConfig: AppBootstrapConfig = {
  port: PORT,
  host: DB_HOST,
  environment: DENO_ENV,
  enableFrameworkIntegrity: true,
  enableDatabaseConnection: true,
  enableAdvancedLogging: DENO_ENV === "development",
  enableCorsValidation: true,
};

// ============================================================================
// UTILITY FUNCTIONS - PURE FUNCTIONS FOR DATA TRANSFORMATION
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
    author: "Pedro M. Dominguez",
    repository: "https://github.com/grenas405/denogenesis",
    description: "Enterprise-grade Deno framework following Unix Philosophy",
    features: [
      "Unix Philosophy Compliant",
      "Centralized Module System",
      "Type-Safe Routing",
      "Advanced Static File Serving",
      "Enterprise Logging",
      "Database Integration",
      "Security Hardened",
      "Performance Monitoring",
      "Static File Analytics",
      "Custom CORS Middleware",
    ],
    database: "SQLite with Enterprise Extensions",
    ai: {
      enabled: false,
      models: [],
    },
  };
}

/**
 * Collect dependency information for status display
 */
function collectDependencyInfo(): DependencyInfo[] {
  const dependencies: DependencyInfo[] = [
    { name: "Oak Framework", version: "12.6.1", status: "loaded" },
    { name: "Custom CORS Middleware", version: VERSION, status: "loaded" },
    { name: "DotEnv", version: "3.2.2", status: "loaded" },
    { name: "DenoGenesis Router", version: VERSION, status: "loaded" },
    { name: "DenoGenesis Middleware", version: VERSION, status: "loaded" },
    { name: "Static File Handler", version: VERSION, status: "loaded" },
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
        status: dbStatus ? "loaded" : "error",
      });
    } catch {
      dependencies.push({
        name: "Database Connection",
        version: "SQLite",
        status: "error",
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

  const spinner = ConsoleStyler.createSpinner(
    "Establishing database connection...",
  );
  const startTime = performance.now();

  try {
    spinner.start();

    // Simulate connection time for demonstration
    await new Promise((resolve) => setTimeout(resolve, 500));

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
      duration: performance.now() - startTime,
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

  const spinner = ConsoleStyler.createSpinner(
    "Validating framework integrity...",
  );
  const startTime = performance.now();

  try {
    spinner.start();

    const isValid = await validateFrameworkIntegrity();
    const frameworkVersion = getFrameworkVersion();
    const duration = performance.now() - startTime;

    if (isValid) {
      spinner.stop("Framework integrity validated successfully");
      ConsoleStyler.logSuccess(`Framework v${VERSION} integrity check passed`, {
        duration: `${duration.toFixed(2)}ms`,
        buildHash: BUILD_HASH,
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
      duration: performance.now() - startTime,
    });
    return false;
  }
}

/**
 * Validate CORS configuration and test origins
 */
async function validateCorsConfiguration(
  config: MiddlewareConfig,
): Promise<boolean> {
  if (!bootstrapConfig.enableCorsValidation) {
    ConsoleStyler.logInfo("CORS validation disabled in configuration");
    return true;
  }

  const spinner = ConsoleStyler.createSpinner(
    "Validating CORS configuration...",
  );
  const startTime = performance.now();

  try {
    spinner.start();

    const corsHelper = createCorsTestHelper(config);
    const duration = performance.now() - startTime;

    // Validate that we have at least one origin configured
    const totalOrigins = config.cors.allowedOrigins.length +
      (config.environment === "development"
        ? config.cors.developmentOrigins.length
        : 0);

    if (totalOrigins === 0) {
      spinner.stop();
      ConsoleStyler.logWarning("No CORS origins configured", {
        hint:
          "Add origins to allowedOrigins or developmentOrigins in configuration",
      });
      return true; // Don't fail, just warn
    }

    spinner.stop("CORS configuration validated successfully");

    // Log CORS configuration details
    ConsoleStyler.logSuccess("CORS middleware configured", {
      productionOrigins: config.cors.allowedOrigins.length,
      developmentOrigins: config.cors.developmentOrigins.length,
      totalOrigins,
      credentials: config.cors.credentials ?? true,
      maxAge: config.cors.maxAge ??
        (config.environment === "production" ? 86400 : 300),
      duration: `${duration.toFixed(2)}ms`,
    });

    // In development mode, display detailed CORS info
    if (config.environment === "development") {
      corsHelper.logCorsConfig();

      // Test all configured origins
      const allOrigins = [
        ...config.cors.allowedOrigins,
        ...config.cors.developmentOrigins,
      ];

      if (allOrigins.length > 0) {
        ConsoleStyler.logInfo("Testing configured CORS origins:");
        corsHelper.testMultipleOrigins(allOrigins);
      }
    }

    return true;
  } catch (error) {
    spinner.stop();
    ConsoleStyler.logError("CORS validation error", {
      error: error.message,
      duration: performance.now() - startTime,
    });
    return false;
  }
}

/**
 * Create CORS middleware with proper error handling
 * This is a simplified, bulletproof CORS implementation
 */
async function createSafeCorsMiddleware(config: MiddlewareConfig) {
  // Pre-compute allowed origins for performance
  const allowedOriginsSet = new Set([
    ...config.cors.allowedOrigins,
    ...(config.environment === "development"
      ? config.cors.developmentOrigins
      : []),
  ]);

  return async (ctx, next) => {
    const origin = ctx.request.headers.get("Origin");
    const method = ctx.request.method;

    // --- Handle Preflight ---
    if (method === "OPTIONS") {
      if (origin && allowedOriginsSet.has(origin)) {
        ctx.response.headers.set("Access-Control-Allow-Origin", origin);
        ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
        ctx.response.headers.set(
          "Access-Control-Allow-Methods",
          config.cors.allowedMethods?.join(", ") ||
            "GET,POST,PUT,DELETE,OPTIONS",
        );
        ctx.response.headers.set(
          "Access-Control-Allow-Headers",
          config.cors.allowedHeaders?.join(", ") ||
            "Content-Type,Authorization",
        );
        ctx.response.status = 204;
        return; // <-- Only OPTIONS stops the chain
      } else {
        // Even for disallowed origins, reply safely
        ctx.response.status = 204;
        return;
      }
    }

    // --- Normal requests ---
    if (origin && allowedOriginsSet.has(origin)) {
      ctx.response.headers.set("Access-Control-Allow-Origin", origin);
      ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
    } else if (origin) {
      // ⚠️ Log but don't block — just continue
      appMetrics.corsBlocked++;
      if (config.environment === "development") {
        ConsoleStyler.logWarning(`CORS blocked origin: ${origin}`);
      }
    }

    // ✅ Always continue to the next middleware!
    await next();
  };
}

/**
 * Setup enhanced request logging middleware
 * MUST run AFTER CORS middleware
 */
async function createRequestLogger() {
  return async (ctx: any, next: any) => {
    const startTime = performance.now();

    appMetrics.totalRequests++;

    // Track CORS requests
    const origin = ctx.request.headers.get("Origin");
    if (origin) {
      appMetrics.corsRequests++;
    }

    try {
      await next();
    } catch (error) {
      appMetrics.totalErrors++;
      throw error;
    }
  };
}

/**
 * Display application performance metrics with static file analytics
 */
async function displayPerformanceMetrics() {
  const uptime = Date.now() - appMetrics.startTime;
  const successRate = appMetrics.totalRequests > 0
    ? ((appMetrics.totalRequests - appMetrics.totalErrors) /
      appMetrics.totalRequests * 100).toFixed(2)
    : "100.00";

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const metrics = [
    { label: "Uptime", value: `${(uptime / 1000).toFixed(1)}s` },
    { label: "Total Requests", value: appMetrics.totalRequests.toString() },
    { label: "Errors", value: appMetrics.totalErrors.toString() },
    { label: "Success Rate", value: `${successRate}%` },
    { label: "DB Connections", value: appMetrics.dbConnections.toString() },
    { label: "CORS Requests", value: appMetrics.corsRequests.toString() },
    {
      label: "CORS Blocked",
      value: appMetrics.corsBlocked.toString(),
    },
  ];

  // Add static file analytics
  const staticStats = StaticFileAnalytics.getTotalStats();
  metrics.push(
    {
      label: "Static Files Served",
      value: staticStats.totalRequests.toString(),
    },
    {
      label: "Static Bandwidth",
      value: formatBytes(staticStats.totalBandwidth),
    },
  );

  try {
    const memUsage = Deno.memoryUsage();
    metrics.push(
      { label: "Heap Used", value: formatBytes(memUsage.heapUsed) },
      { label: "Heap Total", value: formatBytes(memUsage.heapTotal) },
    );
  } catch {
    metrics.push({ label: "Memory", value: "N/A" });
  }

  ConsoleStyler.printTable(metrics, "Application Metrics");

  // Display popular static files if any
  const popularFiles = StaticFileAnalytics.getPopularFiles(3);
  if (popularFiles.length > 0) {
    const staticMetrics = popularFiles.map((file) => ({
      label: file.path.replace(`${Deno.cwd()}/public`, ""),
      value: `${file.requests} requests`,
    }));
    ConsoleStyler.printTable(staticMetrics, "Popular Static Files");
  }
}

/**
 * Setup graceful shutdown handlers
 */
async function setupGracefulShutdown(app: Application) {
  const shutdownHandler = async (signal: string) => {
    ConsoleStyler.logWarning(
      `Received ${signal}, initiating graceful shutdown...`,
    );

    const spinner = ConsoleStyler.createSpinner("Shutting down application...");
    spinner.start();

    try {
      // Display final metrics
      displayPerformanceMetrics();

      // Generate static file report if development
      if (DENO_ENV === "development") {
        try {
          const report = await StaticFileUtils.generateReport(
            `${Deno.cwd()}/public`,
          );
          ConsoleStyler.logInfo("Static File Analytics Report Generated", {
            totalRequests: report.analytics.totalRequests,
            popularFiles: report.popularFiles.length,
            supportedExtensions: report.systemInfo.supportedExtensions.length,
          });
        } catch (error) {
          ConsoleStyler.logWarning("Could not generate static file report", {
            error: error.message,
          });
        }
      }

      // Close database connections
      if (bootstrapConfig.enableDatabaseConnection) {
        await closeDatabaseConnection();
        ConsoleStyler.logDatabase("Connection closed");
      }

      spinner.stop("Application shutdown completed successfully");
      ConsoleStyler.logSuccess("Goodbye!");

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
      stack: error.stack,
    });
  });
}

/**
 * Validate static file directory and setup
 */
async function validateStaticSetup(staticRoot: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(staticRoot);
    if (!stat.isDirectory) {
      ConsoleStyler.logError(`Static root is not a directory: ${staticRoot}`);
      return false;
    }

    // Check for index files
    const indexFiles = ["index.html", "index.htm"];
    const homeDir = `${staticRoot}/pages/home`;

    let hasIndex = false;
    for (const indexFile of indexFiles) {
      try {
        const indexPath = `${homeDir}/${indexFile}`;
        const indexStat = await Deno.stat(indexPath);
        if (indexStat.isFile) {
          hasIndex = true;
          ConsoleStyler.logSuccess(`Found home page: ${indexPath}`);
          break;
        }
      } catch {
        // Continue checking
      }
    }

    if (!hasIndex) {
      ConsoleStyler.logWarning(`No index files found in ${homeDir}`);
    }

    return true;
  } catch (error) {
    ConsoleStyler.logError("Static file directory validation failed", {
      error: error.message,
      path: staticRoot,
    });
    return false;
  }
}

// ============================================================================
// MAIN APPLICATION FLOW - FIXED MIDDLEWARE ORDER
// ============================================================================

/**
 * Main application entry point with correct middleware ordering
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
      host: DB_HOST,
      environment: DENO_ENV,
    });

    // ========================================================================
    // Phase 2: Framework Validation and Dependencies
    // ========================================================================

    // Validate framework integrity
    const frameworkValid = await validateFramework();
    if (!frameworkValid) {
      ConsoleStyler.logCritical(
        "Framework validation failed - aborting startup",
      );
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
      ConsoleStyler.logWarning(
        "Database initialization failed - continuing without database",
      );
    }

    // ========================================================================
    // Phase 4: Static File Setup Validation
    // ========================================================================

    const staticRoot = `${Deno.cwd()}/public`;
    const staticSetupValid = await validateStaticSetup(staticRoot);
    if (!staticSetupValid) {
      ConsoleStyler.logWarning(
        "Static file setup validation failed - static serving may not work properly",
      );
    }

    // ========================================================================
    // Phase 5: Application and Middleware Setup - CORRECT ORDER
    // ========================================================================

    ConsoleStyler.logSection("🚀 Application Initialization", "blue");

    // Create Oak application
    const app = new Application();
    ConsoleStyler.logSuccess("Oak application instance created");

    // Create middleware configuration
    const middlewareConfig: MiddlewareConfig = {
      environment: DENO_ENV,
      port: PORT,
      staticFiles: {
        root: staticRoot,
        enableCaching: DENO_ENV === "production",
        maxAge: DENO_ENV === "production" ? 86400 : 300,
        extensions: [
          ".html",
          ".htm",
          ".css",
          ".js",
          ".mjs",
          ".json",
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".webp",
          ".svg",
          ".ico",
          ".woff",
          ".woff2",
          ".ttf",
          ".otf",
        ],
        index: "index.html",
        dotFiles: "deny",
      },
      cors: {
        allowedOrigins: CORS_ORIGINS.filter((origin) =>
          !origin.includes("localhost")
        ),
        developmentOrigins: CORS_ORIGINS.filter((origin) =>
          origin.includes("localhost")
        ),
        credentials: true,
        maxAge: DENO_ENV === "production" ? 86400 : 300,
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "X-Request-ID",
        ],
        exposedHeaders: ["X-Request-ID", "X-Response-Time"],
        enableLogging: DENO_ENV === "development",
      },
      security: {
        enableHSTS: DENO_ENV === "production",
        contentSecurityPolicy: DENO_ENV === "production"
          ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        frameOptions: "SAMEORIGIN",
      },
      logging: {
        logLevel: DENO_ENV === "development" ? "debug" : "info",
        logRequests: true,
        logResponses: DENO_ENV === "development",
      },
      healthCheck: {
        endpoint: "/health",
        includeMetrics: true,
        includeEnvironment: DENO_ENV === "development",
      },
    };

    // Validate CORS configuration
    const corsValid = await validateCorsConfiguration(middlewareConfig);
    if (!corsValid) {
      ConsoleStyler.logWarning(
        "CORS validation encountered issues - continuing with current configuration",
      );
    }

    // ========================================================================
    // CRITICAL: APPLY MIDDLEWARE IN CORRECT ORDER
    // ========================================================================

    ConsoleStyler.logSection("📦 Middleware Stack Configuration", "cyan");

    // 1. FIRST: Apply CORS middleware (MUST BE FIRST!)
    const corsMiddleware = createSafeCorsMiddleware(middlewareConfig);
    app.use(corsMiddleware);
    ConsoleStyler.logSuccess(
      "✅ [1/7] CORS middleware applied (FIRST in stack)",
    );

    // 2. Request ID generation
    app.use(async (ctx, next) => {
      ctx.state.requestId = crypto.randomUUID();
      ctx.response.headers.set("X-Request-ID", ctx.state.requestId);
      await next();
    });
    ConsoleStyler.logSuccess("✅ [2/7] Request ID middleware applied");

    // 3. Security headers
    app.use(async (ctx, next) => {
      // Only set security headers if response is still writable
      if (ctx.response.writable) {
        if (middlewareConfig.security.enableHSTS) {
          ctx.response.headers.set(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains",
          );
        }
        if (middlewareConfig.security.frameOptions) {
          ctx.response.headers.set(
            "X-Frame-Options",
            middlewareConfig.security.frameOptions,
          );
        }
        ctx.response.headers.set("X-Content-Type-Options", "nosniff");
        ctx.response.headers.set("X-XSS-Protection", "1; mode=block");
      }
      await next();
    });
    ConsoleStyler.logSuccess("✅ [3/7] Security headers middleware applied");

    // 4. Request logger (AFTER CORS)
    app.use(createRequestLogger());
    ConsoleStyler.logSuccess("✅ [4/7] Request logger middleware applied");

    // 5. Error handler
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        appMetrics.totalErrors++;

        // Check if response is still writable
        if (!ctx.response.writable) {
          ConsoleStyler.logError("Error occurred after response sent:", error);
          return;
        }

        ctx.response.status = error.status || 500;
        ctx.response.body = {
          error: error.message || "Internal Server Error",
          requestId: ctx.state.requestId,
        };

        if (DENO_ENV === "development") {
          ConsoleStyler.logError("Request error", {
            error: error.message,
            requestId: ctx.state.requestId,
            path: ctx.request.url.pathname,
          });
        }
      }
    });
    ConsoleStyler.logSuccess("✅ [5/7] Error handler middleware applied");

    // 6. Health check endpoint
    app.use(async (ctx, next) => {
      if (ctx.request.url.pathname === middlewareConfig.healthCheck.endpoint) {
        ctx.response.status = 200;
        ctx.response.body = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          ...(middlewareConfig.healthCheck.includeMetrics && {
            metrics: {
              totalRequests: appMetrics.totalRequests,
              totalErrors: appMetrics.totalErrors,
              corsRequests: appMetrics.corsRequests,
              corsBlocked: appMetrics.corsBlocked,
              uptime: Date.now() - appMetrics.startTime,
            },
          }),
          ...(middlewareConfig.healthCheck.includeEnvironment && {
            environment: DENO_ENV,
            version: VERSION,
          }),
        };
        return; // Don't call next()
      }
      await next();
    });
    ConsoleStyler.logSuccess("✅ [6/7] Health check endpoint configured");

    // 7. Get remaining middleware from createMiddlewareStack (static files, etc.)
    const { middlewares, monitor } = await createMiddlewareStack(
      middlewareConfig,
    );

    // Apply remaining middleware (static files, etc.)
    // Filter out any CORS middleware from the stack since we already applied it
    const remainingMiddleware = middlewares.filter((m) =>
      !m.toString().includes("cors") && !m.toString().includes("CORS")
    );

    remainingMiddleware.forEach((middleware) => {
      app.use(middleware);
    });
    ConsoleStyler.logSuccess(
      `✅ [7/7] Remaining middleware applied (${remainingMiddleware.length} components)`,
    );

    // Add router (after all middleware)
    console.log("Router object:", router);
    app.use(router.routes());
    app.use(router.allowedMethods());
    ConsoleStyler.logSuccess("✅ Router configured and mounted");

    // Add 404 handler (ABSOLUTE LAST)
    app.use((ctx) => {
      ctx.response.status = 404;
      ctx.response.body = {
        error: "Not Found",
        path: ctx.request.url.pathname,
        requestId: ctx.state.requestId,
      };
    });
    ConsoleStyler.logSuccess("✅ 404 handler configured (last in stack)");

    // Display middleware stack summary
    ConsoleStyler.logBox(
      [
        `Middleware Order: CORS → RequestID → Security → Logger → Error → Health → Static → Router → 404`,
        `Total Middleware Components: ${7 + remainingMiddleware.length}`,
        `CORS Origins: ${
          middlewareConfig.cors.allowedOrigins.length +
          middlewareConfig.cors.developmentOrigins.length
        }`,
        `Static File Caching: ${
          middlewareConfig.staticFiles.enableCaching ? "Enabled" : "Disabled"
        }`,
        `Security Headers: ${
          middlewareConfig.security.enableHSTS
            ? "HSTS Enabled"
            : "Development Mode"
        }`,
      ],
      "Middleware Stack Configuration",
      "green",
    );

    // ========================================================================
    // Phase 6: Static File Analytics Setup
    // ========================================================================

    // Reset analytics for fresh start
    StaticFileAnalytics.reset();
    ConsoleStyler.logSuccess("Static file analytics initialized");

    // Display static file configuration details
    const supportedExtensions = getSupportedExtensions();
    ConsoleStyler.logSuccess("Static file system configured", {
      supportedExtensions: supportedExtensions.length,
      mimeTypes: Object.keys(DEFAULT_MIME_TYPES).length,
      caching: middlewareConfig.staticFiles.enableCaching,
      compression: DENO_ENV === "production" ? "gzip" : "disabled",
      analytics: "enabled",
      securityHeaders: "enabled",
    });

    // ========================================================================
    // Phase 7: Graceful Shutdown Setup
    // ========================================================================

    setupGracefulShutdown(app);
    ConsoleStyler.logSuccess("Graceful shutdown handlers registered");

    // ========================================================================
    // Phase 8: Server Startup
    // ========================================================================

    ConsoleStyler.logSection("🌐 Server Startup", "green");

    const serverOptions = {
      port: bootstrapConfig.port,
      hostname: bootstrapConfig.host,
    };

    // Display startup summary with CORS details
    ConsoleStyler.logBox(
      [
        `Server starting on ${bootstrapConfig.host}:${bootstrapConfig.port}`,
        `Environment: ${DENO_ENV}`,
        `Framework: DenoGenesis v${VERSION}`,
        `CORS: First in stack (${
          middlewareConfig.cors.allowedOrigins.length +
          middlewareConfig.cors.developmentOrigins.length
        } origins)`,
        `Middleware: Correctly ordered (CORS first)`,
        `Static Files: Advanced serving enabled`,
        `Analytics: Real-time monitoring`,
      ],
      "Server Configuration",
      "green",
    );

    ConsoleStyler.asciiArt("DENOGENESIS");
    ConsoleStyler.asciiArt("READY");

    // Start the server
    ConsoleStyler.logSuccess(
      `🚀 Server listening on http://${bootstrapConfig.host}:${bootstrapConfig.port}`,
    );
    ConsoleStyler.logInfo("Press Ctrl+C to gracefully shutdown the server");

    // Display CORS test information in development
    if (DENO_ENV === "development") {
      const corsHelper = createCorsTestHelper(middlewareConfig);
      ConsoleStyler.logInfo(
        "CORS Testing: Use browser console or API client to test cross-origin requests",
      );
      ConsoleStyler.logInfo(
        `Allowed Origins: ${
          middlewareConfig.cors.allowedOrigins.concat(
            middlewareConfig.cors.developmentOrigins,
          ).join(", ")
        }`,
      );

      // Display CORS test commands
      ConsoleStyler.logBox(
        [
          `Test CORS with curl:`,
          `curl -H "Origin: http://localhost:3000" -I http://${bootstrapConfig.host}:${bootstrapConfig.port}/health`,
          ``,
          `Test preflight:`,
          `curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -X OPTIONS http://${bootstrapConfig.host}:${bootstrapConfig.port}/api/endpoint`,
        ],
        "CORS Test Commands",
        "cyan",
      );
    }

    // Start metrics display interval in development
    if (DENO_ENV === "development") {
      setInterval(() => {
        if (
          appMetrics.totalRequests > 0 ||
          StaticFileAnalytics.getTotalStats().totalRequests > 0
        ) {
          displayPerformanceMetrics();
        }
      }, 30000); // Display metrics every 30 seconds
    }

    await app.listen(serverOptions);
  } catch (error) {
    ConsoleStyler.logCritical("Fatal error during application startup", {
      error: error.message,
      stack: error.stack,
    });

    // Ensure cleanup on fatal error
    try {
      if (bootstrapConfig.enableDatabaseConnection) {
        await closeDatabaseConnection();
      }
    } catch (cleanupError) {
      ConsoleStyler.logError("Error during cleanup", {
        error: cleanupError.message,
      });
    }

    Deno.exit(1);
  }
}

// ============================================================================
// APPLICATION ENTRY POINT
// ============================================================================

/**
 * Application entry point with error boundary
 */
if (import.meta.main) {
  main().catch((error) => {
    ConsoleStyler.logCritical("Unhandled error in main", {
      error: error.message,
      stack: error.stack,
    });
    Deno.exit(1);
  });
}
