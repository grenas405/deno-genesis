/**
 * DenoGenesis Framework - Main Application Entry Point
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 1.4.0
 * @license AGPL-3.0
 */

import {
  Application,
  send,
  oakCors,
  loadEnv,
  router,
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,
  db,
  getDatabaseStatus,
  closeDatabaseConnection,
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  DEFAULT_MIME_TYPES,
  displayFrameworkBanner,
  registerSignalHandlers,
  registerErrorHandlers,
  DENOGENESIS_METADATA,
  ConsoleStyler,
} from "./mod.ts";

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const env = await loadEnv();
const app = new Application();
const port = parseInt(env.PORT || PORT.toString() || "3000");
const version = VERSION || DENOGENESIS_METADATA.version;
const buildDate = BUILD_DATE || DENOGENESIS_METADATA.buildDate;

displayFrameworkBanner(version, buildDate);
if (BUILD_HASH) ConsoleStyler.logInfo(`🔗 Build Hash: ${BUILD_HASH}`);

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

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
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self';",
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

const { monitor, middlewares } = createMiddlewareStack(middlewareConfig);

// Apply middleware
middlewares.forEach(middleware => app.use(middleware));
ConsoleStyler.logSuccess("🎯 Middleware stack initialized successfully!");

// ============================================================================
// STATIC FILE HANDLING
// ============================================================================

const supportedExtensions = Array.from(DEFAULT_MIME_TYPES.keys());

app.use(async (ctx, next) => {
  const filePath = ctx.request.url.pathname;
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

  if (supportedExtensions.includes(extension)) {
    try {
      ctx.response.headers.set('Content-Type', DEFAULT_MIME_TYPES.get(extension) || 'application/octet-stream');
      ctx.response.headers.set('X-DenoGenesis-Version', version);

      if (DENO_ENV === 'production') {
        const cacheableExtensions = ['.css', '.js', '.ts', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.ttf', '.woff', '.woff2'];
        if (cacheableExtensions.includes(extension)) {
          ctx.response.headers.set('Cache-Control', 'public, max-age=86400');
          ctx.response.headers.set('ETag', `"${BUILD_HASH || Date.now()}"`);
        }
      }

      await send(ctx, filePath, {
        root: `${Deno.cwd()}/public`,
        index: "index.html",
      });
      return;
    } catch {
      // File not found, continue to next middleware
    }
  }
  await next();
});

// ============================================================================
// CORS & ROUTES
// ============================================================================

app.use(oakCors({
  origin: DENO_ENV === 'production'
    ? ["https://efficientmoversllc.com"]
    : [...CORS_ORIGINS, "https://efficientmoversllc.com"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  maxAge: DENO_ENV === 'production' ? 86400 : 300
}));

app.use(router.routes());
app.use(router.allowedMethods());

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use(async (ctx) => {
  ctx.response.status = 404;
  ctx.response.headers.set('X-DenoGenesis-Version', version);

  try {
    await send(ctx, "/pages/errors/404.html", { root: `${Deno.cwd()}/public` });
  } catch {
    ctx.response.type = 'application/json';
    ctx.response.body = {
      error: 'Not Found',
      message: 'The requested resource was not found',
      path: ctx.request.url.pathname,
      timestamp: new Date().toISOString(),
      version,
      buildDate,
      environment: DENO_ENV,
      siteKey: SITE_KEY,
      framework: DENOGENESIS_METADATA.frameworkName
    };
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const middlewareManager = MiddlewareManager.getInstance(middlewareConfig);

ConsoleStyler.logSection("🚀 SERVER STARTUP", "cyan");

[
  ['Framework Version', version],
  ['Build Date', buildDate],
  ...(BUILD_HASH ? [['Build Hash', BUILD_HASH]] : []),
  ['Server URL', `http://${SERVER_HOST}:${port}`],
  ['Environment', DENO_ENV],
  ['Site Key', SITE_KEY],
  ['Process ID', Deno.pid.toString()],
  ['Database Status', getDatabaseStatus() ? 'Connected' : 'Disconnected']
].forEach(([label, value]) => {
  ConsoleStyler.logInfo(`📋 ${label}: ${value}`);
});

if (DENO_ENV === "development") {
  ConsoleStyler.logWarning("⚠️ Development mode - Enhanced debugging enabled");
} else {
  ConsoleStyler.logSuccess("🏭 Production mode - Optimized for performance");
}

middlewareManager.logStatus();
ConsoleStyler.logSuccess(`🎉 DenoGenesis Framework ${version} ready!`);

// ============================================================================
// METRICS & SHUTDOWN HANDLERS
// ============================================================================

setTimeout(() => {
  const metrics = monitor.getMetrics();
  ConsoleStyler.logSection("📊 SYSTEM STATUS", "green");
  
  [
    ['Version', version],
    ['Uptime', `${metrics.uptime}ms`],
    ['Requests', `${metrics.requests || 0}`],
    ['Errors', `${metrics.errors || 0}`],
    ['Success Rate', `${metrics.successRate || 100}%`],
    ['Environment', DENO_ENV],
    ['Database', getDatabaseStatus() ? 'Connected' : 'Disconnected']
  ].forEach(([metric, value]) => {
    ConsoleStyler.logInfo(`📈 ${metric}: ${value}`);
  });

  ConsoleStyler.logSection(`🌐 PLATFORM ${version} - READY!`, "gold");
}, 2000);

const handleShutdown = async (signal: string) => {
  ConsoleStyler.logWarning(`⚠️ Received ${signal}, shutting down gracefully...`);
  
  const finalMetrics = monitor.getMetrics();
  ConsoleStyler.logInfo(`📊 Final: ${finalMetrics.requests || 0} requests processed`);

  try {
    await closeDatabaseConnection();
    ConsoleStyler.logSuccess("✅ Database connection closed");
  } catch (error) {
    ConsoleStyler.logError(`❌ Database error: ${error.message}`);
  }

  ConsoleStyler.logSuccess(`✅ DenoGenesis ${version} shutdown complete`);
  Deno.exit(0);
};

registerSignalHandlers(version, async () => {
  const finalMetrics = monitor.getMetrics();
  ConsoleStyler.logInfo(`📊 Final: ${finalMetrics.requests || 0} requests processed`);
});

registerErrorHandlers(version);

// ============================================================================
// START SERVER
// ============================================================================

ConsoleStyler.logSuccess(`🚀 Server running: http://localhost:${port}`);
ConsoleStyler.logInfo(`❤️ Health check: http://localhost:${port}/health`);
ConsoleStyler.asciiArt('DENOGENESIS');

try {
  await app.listen({
    port,
    hostname: SERVER_HOST === 'localhost' ? '0.0.0.0' : SERVER_HOST
  });
} catch (error) {
  ConsoleStyler.logError(`❌ Startup failed: ${error.message}`);
  
  try {
    await closeDatabaseConnection();
  } catch (dbError) {
    ConsoleStyler.logError(`❌ Database cleanup error: ${dbError.message}`);
  }
  
  Deno.exit(1);
}