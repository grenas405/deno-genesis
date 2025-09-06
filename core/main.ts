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
  ConsoleStyler.logInfo(`🔗 Build Hash: ${BUILD_HASH}`);
}

// ============================================================================
// ENTERPRISE MIDDLEWARE CONFIGURATION
// ============================================================================

ConsoleStyler.logInfo("🔧 Initializing Enterprise Middleware Stack...");

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
ConsoleStyler.logInfo("⚙️ Creating middleware stack...");
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
    ConsoleStyler.logSuccess(`✅ ${component.name} initialized`);
    ConsoleStyler.logDebug(`🔍 ${component.description}`);
  }
});

ConsoleStyler.logSuccess("🎯 Middleware orchestration completed successfully!");

// ============================================================================
// ENHANCED STATIC FILE MIDDLEWARE
// ============================================================================

ConsoleStyler.logInfo("📁 Configuring static file handler...");

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
        ConsoleStyler.logDebug(`🔍 Static file not found: ${filePath}`);
      }
    }
  }

  await next();
});

ConsoleStyler.logSuccess(`📁 Enhanced static file handler configured (${supportedExtensions.length} file types)`);

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

ConsoleStyler.logInfo("🛣️ Configuring API routes...");
app.use(router.routes());
app.use(router.allowedMethods());
ConsoleStyler.logSuccess("🛣️ API routes configured successfully");

// ============================================================================
// 404 FALLBACK HANDLER
// ============================================================================

app.use(async (ctx) => {
  ConsoleStyler.logWarning(`❌ 404 Not Found: ${ctx.request.url.pathname}`);
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

ConsoleStyler.logSection("🚀 DENOGENESIS FRAMEWORK - SERVER STARTUP", "cyan");

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

// Display server information using ConsoleStyler methods
serverInfo.forEach(info => {
  ConsoleStyler.logInfo(`📋 ${info.label}: ${info.value}`);
});

// ============================================================================
// ENVIRONMENT-SPECIFIC MESSAGES
// ============================================================================

if (DENO_ENV === "development") {
  ConsoleStyler.logWarning("⚠️ Development mode active - Enhanced debugging enabled");
  ConsoleStyler.logInfo("🔄 Hot reload and detailed logging available");
  ConsoleStyler.logInfo(`📦 Version: ${version} (${buildDate})`);
} else {
  ConsoleStyler.logSuccess("🏭 Production mode active - Optimized for performance");
  ConsoleStyler.logInfo("🔒 Security headers and caching enabled");
  ConsoleStyler.logInfo(`🏭 Production version: ${version}`);
}

// ============================================================================
// MIDDLEWARE STATUS DISPLAY
// ============================================================================

ConsoleStyler.logInfo("🔍 Middleware Manager Status:");
middlewareManager.logStatus();

// ============================================================================
// FINAL SUCCESS MESSAGES
// ============================================================================

ConsoleStyler.logSuccess(`🎉 DenoGenesis Framework ${version} initialization complete!`);

// ============================================================================
// SYSTEM METRICS DISPLAY
// ============================================================================

// Show initial metrics after server stabilization
setTimeout(() => {
  const metrics = monitor.getMetrics();

  ConsoleStyler.logSection("📊 SYSTEM STATUS", "green");
  
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

  // Display metrics using ConsoleStyler
  metricsData.forEach(metric => {
    ConsoleStyler.logInfo(`📈 ${metric.metric}: ${metric.value}`);
  });

  ConsoleStyler.logSection(`🌐 LOCAL-FIRST DIGITAL SOVEREIGNTY PLATFORM ${version} - READY!`, "gold");
  ConsoleStyler.logInfo("🎓 Framework validated for academic research collaboration");
}, 2000);

// ============================================================================
// ERROR HANDLING & GRACEFUL SHUTDOWN
// ============================================================================

const handleShutdown = async (signal: string) => {
  ConsoleStyler.logWarning(`⚠️ Received ${signal}, shutting down DenoGenesis ${version} gracefully...`);

  // Log final metrics
  const finalMetrics = monitor.getMetrics();
  ConsoleStyler.logInfo(`📊 Final metrics: ${finalMetrics.requests || 0} requests processed`);

  // Close database connection
  try {
    await closeDatabaseConnection();
    ConsoleStyler.logSuccess("✅ Database connection closed gracefully");
  } catch (error) {
    ConsoleStyler.logError(`❌ Error closing database: ${error.message}`);
  }

  ConsoleStyler.logSuccess(`✅ DenoGenesis Framework ${version} shutdown complete`);
  Deno.exit(0);
};

// Register framework signal and error handlers
registerSignalHandlers(version, async () => {
  const finalMetrics = monitor.getMetrics();
  ConsoleStyler.logInfo(`📊 Final metrics: ${finalMetrics.requests || 0} requests processed`);
});

registerErrorHandlers(version);

// ============================================================================
// SERVER STARTUP & FINAL CONFIGURATION
// ============================================================================

ConsoleStyler.logSuccess(`🚀 DenoGenesis server is now running on http://localhost:${port}`);
ConsoleStyler.logInfo(`🌐 External access: http://${SERVER_HOST}:${port}`);
ConsoleStyler.logInfo(`❤️ Health check: http://localhost:${port}/health`);
ConsoleStyler.logInfo(`ℹ️ System info: http://localhost:${port}/api/system/info`);

try {
  await app.listen({
    port,
    hostname: SERVER_HOST === 'localhost' ? '0.0.0.0' : SERVER_HOST
  });
} catch (error) {
  ConsoleStyler.logError(`❌ Failed to start DenoGenesis ${version}: ${error.message}`);
  ConsoleStyler.logError("🔍 Check if port is already in use or permissions are correct");

  // Close database connection before exit
  try {
    await closeDatabaseConnection();
  } catch (dbError) {
    ConsoleStyler.logError(`❌ Error closing database during startup failure: ${dbError.message}`);
  }

  Deno.exit(1);
}