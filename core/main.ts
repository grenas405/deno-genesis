/**
 * ============================================================================
 * DENOGENESIS FRAMEWORK - MAIN APPLICATION ENTRY POINT
 * ============================================================================
 * 
 * This is the main entry point for a DenoGenesis Framework application.
 * Updated to use the centralized mod.ts export hub and ConsoleStyler for
 * professional output formatting.
 * 
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 1.4.0
 * @license AGPL-3.0
 * @framework DenoGenesis Framework
 * ============================================================================
 */

// ============================================================================
// FRAMEWORK IMPORTS - ALL FROM CENTRALIZED EXPORT HUB
// ============================================================================

import {
  // Core Oak Framework
  Application,
  send,
  oakCors,

  // Environment Management
  loadEnv,

  // DenoGenesis Framework Components
  router,
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,

  // Database Layer
  db,
  getDatabaseStatus,
  closeDatabaseConnection,

  // Environment Configuration
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  frameworkConfig,

  // Framework Utilities
  DEFAULT_MIME_TYPES,
  displayFrameworkBanner,
  registerSignalHandlers,
  registerErrorHandlers,
  DENOGENESIS_METADATA,

  // Console Styling
  ConsoleStyler,
} from "./mod.ts";

// ============================================================================
// CONSOLE STYLER INITIALIZATION
// ============================================================================

const styler = new ConsoleStyler({
  enableColors: true,
  logLevel: DENO_ENV === 'development' ? 'debug' : 'info',
  includeTimestamp: true,
  includeLevel: true
});

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const env = await loadEnv();
const app = new Application();
const port = parseInt(env.PORT || PORT.toString() || "3000");

// Framework version information
const version = VERSION || DENOGENESIS_METADATA.version;
const buildDate = BUILD_DATE || DENOGENESIS_METADATA.buildDate;

// ============================================================================
// FRAMEWORK BANNER & STARTUP LOGGING
// ============================================================================

displayFrameworkBanner(version, buildDate);

if (BUILD_HASH) {
  styler.info(`Build Hash: ${BUILD_HASH}`);
}

// ============================================================================
// ENTERPRISE MIDDLEWARE CONFIGURATION
// ============================================================================

styler.info("Initializing Enterprise Middleware Stack...");

const middlewareConfig: MiddlewareConfig = {
  environment: DENO_ENV,
  port,
  staticFiles: {
    root: `${Deno.cwd()}/public`,
    enableCaching: DENO_ENV === 'production',
    maxAge: DENO_ENV === 'production' ? 86400 : 300
  },
  cors: {
    allowedOrigins: DENO_ENV === 'production' ?
      CORS_ORIGINS.filter(origin => !origin.includes('localhost')) :
      CORS_ORIGINS,
    developmentOrigins: CORS_ORIGINS.filter(origin => origin.includes('localhost')),
    credentials: true,
    maxAge: DENO_ENV === 'production' ? 86400 : 300
  },
  security: {
    enableHSTS: DENO_ENV === 'production',
    contentSecurityPolicy: DENO_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self';",
    frameOptions: 'SAMEORIGIN'
  },
  logging: {
    logLevel: DENO_ENV === 'development' ? 'debug' : 'info',
    logRequests: true,
    logResponses: DENO_ENV === 'development'
  },
  healthCheck: {
    endpoint: '/health',
    includeMetrics: true,
    includeEnvironment: true
  }
};

// Create the middleware stack
styler.info("Creating middleware stack...");
const { monitor, middlewares } = createMiddlewareStack(middlewareConfig);

// Apply middleware with professional logging
const middlewareComponents = [
  { name: "Performance Monitor", description: "Request timing and metrics collection" },
  { name: "Error Handler", description: "Global error handling and recovery" },
  { name: "Request Logger", description: "HTTP request/response logging" },
  { name: "Security Headers", description: "OWASP security header injection" },
  { name: "CORS Handler", description: "Cross-origin resource sharing" },
  { name: "Health Check", description: "System health monitoring endpoint" }
];

middlewares.forEach((middleware, index) => {
  app.use(middleware);
  const component = middlewareComponents[index];
  if (component) {
    styler.success(`${component.name} initialized`);
    styler.debug(`${component.description}`);
  }
});

styler.success("Middleware orchestration completed successfully!");

// ============================================================================
// ENHANCED STATIC FILE MIDDLEWARE
// ============================================================================

styler.info("Configuring static file handler...");

// Use centralized MIME types from framework
const mimeTypes = DEFAULT_MIME_TYPES;
const supportedExtensions = Array.from(mimeTypes.keys());

app.use(async (ctx, next) => {
  const filePath = ctx.request.url.pathname;
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

  if (supportedExtensions.includes(extension)) {
    try {
      // Set proper MIME type from framework constants
      ctx.response.headers.set('Content-Type', mimeTypes.get(extension) || 'application/octet-stream');

      // Add version header to all static files
      ctx.response.headers.set('X-DenoGenesis-Version', version);

      // Add caching headers for production
      const cacheableExtensions = ['.css', '.js', '.ts', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.ttf', '.woff', '.woff2'];
      if (DENO_ENV === 'production' && cacheableExtensions.includes(extension)) {
        ctx.response.headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
        ctx.response.headers.set('ETag', `"${BUILD_HASH || Date.now()}"`);
      }

      await send(ctx, filePath, {
        root: `${Deno.cwd()}/public`,
        index: "index.html",
      });
      return;
    } catch (error) {
      // File not found, let it fall through to next middleware
      if (DENO_ENV === 'development') {
        styler.debug(`Static file not found: ${filePath}`);
      }
    }
  }

  await next();
});

styler.success(`Enhanced static file handler configured (${supportedExtensions.length} file types)`);

// ============================================================================
// ENHANCED CORS CONFIGURATION
// ============================================================================

// The CORS is now handled by the middleware stack, but we keep this for backward compatibility
app.use(oakCors({
  origin: DENO_ENV === 'production'
    ? ["https://efficientmoversllc.com"]
    : [...CORS_ORIGINS, "https://efficientmoversllc.com"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  maxAge: DENO_ENV === 'production' ? 86400 : 300
}));

// ============================================================================
// ROUTES CONFIGURATION
// ============================================================================

styler.info("Configuring API routes...");
app.use(router.routes());
app.use(router.allowedMethods());
styler.success("API routes configured successfully");

// ============================================================================
// 404 FALLBACK HANDLER
// ============================================================================

app.use(async (ctx) => {
  styler.warn(`404 Not Found: ${ctx.request.url.pathname}`);
  ctx.response.status = 404;

  // Add version header to 404 responses
  ctx.response.headers.set('X-DenoGenesis-Version', version);

  try {
    await send(ctx, "/pages/errors/404.html", {
      root: `${Deno.cwd()}/public`,
    });
  } catch {
    // Fallback JSON response if 404.html doesn't exist
    ctx.response.type = 'application/json';
    ctx.response.body = {
      error: 'Not Found',
      message: 'The requested resource was not found',
      path: ctx.request.url.pathname,
      timestamp: new Date().toISOString(),
      version: version,
      buildDate: buildDate,
      environment: DENO_ENV,
      siteKey: SITE_KEY,
      framework: DENOGENESIS_METADATA.frameworkName
    };
  }
});

// ============================================================================
// MIDDLEWARE MANAGER SETUP
// ============================================================================

const middlewareManager = MiddlewareManager.getInstance(middlewareConfig);

// ============================================================================
// SERVER STARTUP INFORMATION
// ============================================================================

styler.banner("DenoGenesis Framework - Server Startup");

const serverInfo = [
  { label: 'Framework Version', value: version },
  { label: 'Build Date', value: buildDate },
  ...(BUILD_HASH ? [{ label: 'Build Hash', value: BUILD_HASH }] : []),
  { label: 'Server URL', value: `http://${SERVER_HOST}:${port}` },
  { label: 'Environment', value: DENO_ENV },
  { label: 'Site Key', value: SITE_KEY },
  { label: 'Process ID', value: Deno.pid.toString() },
  { label: 'Database Status', value: getDatabaseStatus() ? 'Connected' : 'Disconnected' }
];

styler.table([
  { label: 'Property', value: 'Value' },
  ...serverInfo
], { 
  headers: ['Property', 'Value'],
  columnWidths: [20, 40]
});

// ============================================================================
// ENVIRONMENT-SPECIFIC MESSAGES
// ============================================================================

if (DENO_ENV === "development") {
  styler.warn("Development mode active - Enhanced debugging enabled");
  styler.info("Hot reload and detailed logging available");
  styler.info(`Version: ${version} (${buildDate})`);
} else {
  styler.success("Production mode active - Optimized for performance");
  styler.info("Security headers and caching enabled");
  styler.info(`Production version: ${version}`);
}

// ============================================================================
// MIDDLEWARE STATUS DISPLAY
// ============================================================================

middlewareManager.logStatus();

// ============================================================================
// FINAL SUCCESS MESSAGES
// ============================================================================

styler.success(`DenoGenesis Framework ${version} initialization complete!`);

// ============================================================================
// SYSTEM METRICS DISPLAY
// ============================================================================

// Show initial metrics after server stabilization
setTimeout(() => {
  const metrics = monitor.getMetrics();

  const metricsData = [
    { metric: 'Version', value: version },
    { metric: 'Uptime', value: `${metrics.uptime}ms` },
    { metric: 'Requests', value: `${metrics.requests || 0}` },
    { metric: 'Errors', value: `${metrics.errors || 0}` },
    { metric: 'Success Rate', value: `${metrics.successRate || 100}%` },
    { metric: 'Environment', value: DENO_ENV },
    { metric: 'Site Key', value: SITE_KEY },
    { metric: 'Database', value: getDatabaseStatus() ? 'Connected' : 'Disconnected' }
  ];

  styler.table([
    { metric: 'Metric', value: 'Value' },
    ...metricsData
  ], {
    headers: ['Metric', 'Value'],
    columnWidths: [15, 25],
    title: 'System Status'
  });

  styler.banner(`Local-First Digital Sovereignty Platform ${version} - Ready!`);
  styler.info("Framework validated for academic research collaboration");
}, 2000);

// ============================================================================
// ERROR HANDLING & GRACEFUL SHUTDOWN
// ============================================================================

const handleShutdown = async (signal: string) => {
  styler.warn(`Received ${signal}, shutting down DenoGenesis ${version} gracefully...`);

  // Log final metrics
  const finalMetrics = monitor.getMetrics();
  styler.info(`Final metrics: ${finalMetrics.requests || 0} requests processed`);

  // Close database connection
  try {
    await closeDatabaseConnection();
    styler.success("Database connection closed gracefully");
  } catch (error) {
    styler.error(`Error closing database: ${error.message}`);
  }

  styler.success(`DenoGenesis Framework ${version} shutdown complete`);
  Deno.exit(0);
};

// Register framework signal and error handlers
registerSignalHandlers(version, async () => {
  const finalMetrics = monitor.getMetrics();
  styler.info(`Final metrics: ${finalMetrics.requests || 0} requests processed`);
});

registerErrorHandlers(version);

// ============================================================================
// SERVER STARTUP & FINAL CONFIGURATION
// ============================================================================

styler.success(`DenoGenesis server is now running on http://localhost:${port}`);
styler.info(`External access: http://${SERVER_HOST}:${port}`);
styler.info(`Health check: http://localhost:${port}/health`);
styler.info(`System info: http://localhost:${port}/api/system/info`);

try {
  await app.listen({
    port,
    hostname: SERVER_HOST === 'localhost' ? '0.0.0.0' : SERVER_HOST
  });
} catch (error) {
  styler.error(`Failed to start DenoGenesis ${version}: ${error.message}`);
  styler.error("Check if port is already in use or permissions are correct");

  // Close database connection before exit
  try {
    await closeDatabaseConnection();
  } catch (dbError) {
    styler.error(`Error closing database during startup failure: ${dbError.message}`);
  }

  Deno.exit(1);
}