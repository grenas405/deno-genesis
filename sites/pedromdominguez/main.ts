import { Application, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config as loadEnv } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import router from "./routes/index.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// Import DenoGenesis Middleware System
import {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig
} from "./middleware/index.ts";

// Import database connection for status checking
import { db, getDatabaseStatus } from "./database/client.ts";

// Import environment configuration
import {
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  frameworkConfig
} from "./config/env.ts";

const env = await loadEnv();
const app = new Application();
const port = parseInt(env.PORT || PORT.toString() || "3000");

// === DENOGENESIS FRAMEWORK BOOTUP LOGS ===
const version = VERSION || "v1.4.0";
const buildDate = BUILD_DATE || "June 2, 2025";

console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");
console.log("\x1b[36m%s\x1b[0m", "         Welcome to the DenoGenesis Framework Engine");
console.log("\x1b[33m%s\x1b[0m", `         ⚙️  Version: ${version}`);
console.log("\x1b[33m%s\x1b[0m", `         📅 Build Date: ${buildDate}`);
if (BUILD_HASH) {
  console.log("\x1b[33m%s\x1b[0m", `         🔗 Build Hash: ${BUILD_HASH}`);
}
console.log("\x1b[33m%s\x1b[0m", "         🚀 Developed by Pedro M. Dominguez");
console.log("\x1b[33m%s\x1b[0m", `         🌍 Environment: ${DENO_ENV}`);
console.log("\x1b[33m%s\x1b[0m", `         🔑 Site Key: ${SITE_KEY}`);
console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");

console.log("\x1b[32m%s\x1b[0m", "💡 This isn't just code — it's a revolution in motion.");
console.log("\x1b[36m%s\x1b[0m", "🔓 Powered by Deno. Structured by Oak. Hardened on Debian.");
console.log("\x1b[34m%s\x1b[0m", "🔗 GitHub: https://github.com/xtcedro");
console.log("\x1b[32m%s\x1b[0m", "🌍 Pedro M. Dominguez is democratizing technology in Oklahoma City");
console.log("\x1b[32m%s\x1b[0m", "   — one system, one local business, one breakthrough at a time.");
console.log("\x1b[33m%s\x1b[0m", "⚡  Bringing AI, automation, and full-stack innovation to the people.");
console.log("\x1b[32m%s\x1b[0m", "🛠️  This is DenoGenesis — born from purpose, built with precision.");
console.log("\x1b[36m%s\x1b[0m", "✨ Let's rebuild the web — together.\n");

// === ENTERPRISE MIDDLEWARE CONFIGURATION ===
console.log("\x1b[34m%s\x1b[0m", "🔧 Initializing Enterprise Middleware Stack...");

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
console.log("\x1b[36m%s\x1b[0m", "📊 Creating middleware stack...");
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
    console.log("\x1b[32m%s\x1b[0m", `✅ ${component.name} initialized`);
    console.log("\x1b[90m%s\x1b[0m", `   → ${component.description}`);
  }
});

console.log("\x1b[32m%s\x1b[0m", "✅ Middleware orchestration completed successfully!");

// === ENHANCED STATIC FILE MIDDLEWARE ===
console.log("\x1b[34m%s\x1b[0m", "📁 Configuring static file handler...");

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4'
};

const supportedExtensions = Object.keys(mimeTypes);

app.use(async (ctx, next) => {
  const filePath = ctx.request.url.pathname;
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

  if (supportedExtensions.includes(extension)) {
    try {
      // Set proper MIME type
      ctx.response.headers.set('Content-Type', mimeTypes[extension as keyof typeof mimeTypes]);

      // Add version header to all static files
      ctx.response.headers.set('X-DenoGenesis-Version', version);

      // Add caching headers for production
      if (DENO_ENV === 'production' && ['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.ttf', '.woff', '.woff2'].includes(extension)) {
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
        console.log("\x1b[90m%s\x1b[0m", `📁 Static file not found: ${filePath}`);
      }
    }
  }

  await next();
});

console.log("\x1b[32m%s\x1b[0m", `✅ Enhanced static file handler configured (${supportedExtensions.length} file types)`);

// === ENHANCED CORS CONFIGURATION ===
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

// === ROUTES ===
console.log("\x1b[34m%s\x1b[0m", "🛣️  Configuring API routes...");
app.use(router.routes());
app.use(router.allowedMethods());
console.log("\x1b[32m%s\x1b[0m", "✅ API routes configured successfully");

// === 404 FALLBACK ===
app.use(async (ctx) => {
  console.log("\x1b[33m%s\x1b[0m", `⚠️  404 Not Found: ${ctx.request.url.pathname}`);
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
      siteKey: SITE_KEY
    };
  }
});

// === MIDDLEWARE MANAGER SETUP ===
const middlewareManager = MiddlewareManager.getInstance(middlewareConfig);

// === SERVER STARTUP INFORMATION ===
console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");
console.log("\x1b[32m%s\x1b[0m", "🚀 DenoGenesis Framework - Server Startup");
console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");

const serverInfo = [
  { label: 'Framework Version', value: version },
  { label: 'Build Date', value: buildDate },
  ...(BUILD_HASH ? [{ label: 'Build Hash', value: BUILD_HASH }] : []),
  { label: 'Server URL', value: `http://${SERVER_HOST}:${port}` },
  { label: 'Environment', value: DENO_ENV },
  { label: 'Site Key', value: SITE_KEY },
  { label: 'Process ID', value: Deno.pid.toString() },
  { label: 'Database Status', value: getDatabaseStatus() ? '✅ Connected' : '❌ Disconnected' }
];

serverInfo.forEach(info => {
  console.log("\x1b[36m%s\x1b[0m", `📊 ${info.label}: ${info.value}`);
});

// === ENVIRONMENT-SPECIFIC MESSAGES ===
if (DENO_ENV === "development") {
  console.log("\x1b[33m%s\x1b[0m", "🔧 Development mode active - Enhanced debugging enabled");
  console.log("\x1b[36m%s\x1b[0m", "   Hot reload and detailed logging available");
  console.log("\x1b[36m%s\x1b[0m", `   Version: ${version} (${buildDate})`);
} else {
  console.log("\x1b[32m%s\x1b[0m", "🚀 Production mode active - Optimized for performance");
  console.log("\x1b[36m%s\x1b[0m", "   Security headers and caching enabled");
  console.log("\x1b[36m%s\x1b[0m", `   Production version: ${version}`);
}

// === MIDDLEWARE STATUS DISPLAY ===
middlewareManager.logStatus();

// === FINAL SUCCESS MESSAGES ===
console.log("\x1b[32m%s\x1b[0m", `✅ DenoGenesis Framework ${version} initialization complete!`);
console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");

// Show initial metrics after server stabilization
setTimeout(() => {
  console.log("\x1b[36m%s\x1b[0m", "📊 System Status:");

  const metrics = monitor.getMetrics();

  console.log("\x1b[32m%s\x1b[0m", `   ⚡ Version: ${version}`);
  console.log("\x1b[32m%s\x1b[0m", `   🕐 Uptime: ${metrics.uptime}ms`);
  console.log("\x1b[32m%s\x1b[0m", `   📊 Requests: ${metrics.requests || 0}`);
  console.log("\x1b[32m%s\x1b[0m", `   ❌ Errors: ${metrics.errors || 0}`);
  console.log("\x1b[32m%s\x1b[0m", `   ✅ Success Rate: ${metrics.successRate || 100}%`);
  console.log("\x1b[32m%s\x1b[0m", `   🌍 Environment: ${DENO_ENV}`);
  console.log("\x1b[32m%s\x1b[0m", `   🔑 Site Key: ${SITE_KEY}`);
  console.log("\x1b[32m%s\x1b[0m", `   🗄️  Database: ${getDatabaseStatus() ? 'Connected' : 'Disconnected'}`);

  console.log("\n");
  console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");
  console.log("\x1b[32m%s\x1b[0m", `🎯 Local-First Digital Sovereignty Platform ${version} - Ready! 🚀`);
  console.log("\x1b[33m%s\x1b[0m", "   Framework validated for academic research collaboration");
  console.log("\x1b[35m%s\x1b[0m", "✨========================================================✨");

}, 2000);

// === ERROR HANDLING & GRACEFUL SHUTDOWN ===
import { closeDatabaseConnection } from "./database/client.ts";

const handleShutdown = async (signal: string) => {
  console.log("\x1b[33m%s\x1b[0m", `\n🛑 Received ${signal}, shutting down DenoGenesis ${version} gracefully...`);

  // Log final metrics
  const finalMetrics = monitor.getMetrics();
  console.log("\x1b[36m%s\x1b[0m", `📊 Final metrics: ${finalMetrics.requests || 0} requests processed`);

  // Close database connection
  try {
    await closeDatabaseConnection();
    console.log("\x1b[32m%s\x1b[0m", "✅ Database connection closed gracefully");
  } catch (error) {
    console.log("\x1b[31m%s\x1b[0m", `❌ Error closing database: ${error.message}`);
  }

  console.log("\x1b[32m%s\x1b[0m", `✅ DenoGenesis Framework ${version} shutdown complete`);
  Deno.exit(0);
};

// Register signal handlers
Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

// Handle uncaught errors
globalThis.addEventListener("error", (event) => {
  console.log("\x1b[31m%s\x1b[0m", `❌ Uncaught error in DenoGenesis ${version}: ${event.error?.message || event.error}`);
  if (event.error?.stack) {
    console.log("\x1b[90m%s\x1b[0m", `Stack trace: ${event.error.stack}`);
  }
});

globalThis.addEventListener("unhandledrejection", (event) => {
  console.log("\x1b[31m%s\x1b[0m", `❌ Unhandled promise rejection in DenoGenesis ${version}: ${event.reason}`);
  event.preventDefault();
});

// === START SERVER ===
console.log("\x1b[32m%s\x1b[0m", `⚙️  DenoGenesis server is now running on http://localhost:${port}`);
console.log("\x1b[36m%s\x1b[0m", `🌐 External access: http://${SERVER_HOST}:${port}`);
console.log("\x1b[33m%s\x1b[0m", "🔗 Health check: http://localhost:" + port + "/health");
console.log("\x1b[33m%s\x1b[0m", "📊 System info: http://localhost:" + port + "/api/system/info");

try {
  await app.listen({
    port,
    hostname: SERVER_HOST === 'localhost' ? '0.0.0.0' : SERVER_HOST
  });
} catch (error) {
  console.log("\x1b[31m%s\x1b[0m", `❌ Failed to start DenoGenesis ${version}: ${error.message}`);
  console.log("\x1b[31m%s\x1b[0m", "Check if port is already in use or permissions are correct");

  // Close database connection before exit
  try {
    await closeDatabaseConnection();
  } catch (dbError) {
    console.log("\x1b[31m%s\x1b[0m", `❌ Error closing database during startup failure: ${dbError.message}`);
  }

  Deno.exit(1);
}
