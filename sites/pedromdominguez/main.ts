// /home/pedro/sites/pedromdominguez-com/main.ts
import { Application, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import router from "./routes/index.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// 🔗 CENTRALIZED FRAMEWORK IMPORTS
import {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig
} from "./middleware/index.ts";

import { db, getDatabaseStatus } from "./database/client.ts";

// 📍 SITE-SPECIFIC CONFIGURATION
import { SITE_CONFIG, getSiteEnvironment } from "./site-config.ts";

// 🌟 SHARED FRAMEWORK CONFIGURATION
import {
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  frameworkConfig
} from "./config/env.ts";

const app = new Application();
const env = getSiteEnvironment();

// ===================================================================
// 🎯 SITE BOOTUP WITH CENTRALIZED FRAMEWORK
// ===================================================================

console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");
console.log("\\x1b[36m%s\\x1b[0m", `         ${SITE_CONFIG.name}`);
console.log("\\x1b[33m%s\\x1b[0m", `         ⚙️  Framework: DenoGenesis ${VERSION}`);
console.log("\\x1b[33m%s\\x1b[0m", `         📅 Build: ${BUILD_DATE}`);
console.log("\\x1b[33m%s\\x1b[0m", `         🚀 Port: ${SITE_CONFIG.port}`);
console.log("\\x1b[33m%s\\x1b[0m", `         🔑 Site: ${SITE_CONFIG.siteKey}`);
console.log("\\x1b[33m%s\\x1b[0m", `         🌍 Domain: ${SITE_CONFIG.domain}`);
console.log("\\x1b[33m%s\\x1b[0m", `         🔗 Centralized: ${SITE_CONFIG.frameworkVersion}`);
console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");

// Site-specific middleware configuration
const middlewareConfig: MiddlewareConfig = {
  environment: env.DENO_ENV || "development",
  port: SITE_CONFIG.port,
  staticFiles: {
    root: `${Deno.cwd()}/public`,
    enableCaching: env.DENO_ENV === 'production',
    maxAge: env.DENO_ENV === 'production' ? 86400 : 300
  },
  cors: {
    allowedOrigins: SITE_CONFIG.corsOrigins,
    developmentOrigins: SITE_CONFIG.corsOrigins.filter(origin => origin.includes('localhost')),
    credentials: true,
    maxAge: env.DENO_ENV === 'production' ? 86400 : 300
  },
  security: {
    enableHSTS: env.DENO_ENV === 'production',
    contentSecurityPolicy: env.DENO_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com;"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com;",
    frameOptions: 'SAMEORIGIN'
  },
  logging: {
    logLevel: env.DENO_ENV === 'development' ? 'debug' : 'info',
    logRequests: true,
    logResponses: env.DENO_ENV === 'development'
  },
  healthCheck: {
    endpoint: '/health',
    includeMetrics: true,
    includeEnvironment: true
  }
};

// Apply centralized framework middleware
console.log("\\x1b[34m%s\\x1b[0m", "🔧 Initializing Centralized Framework Middleware...");
const { monitor, middlewares } = createMiddlewareStack(middlewareConfig);

middlewares.forEach((middleware, index) => {
  app.use(middleware);
  console.log("\\x1b[32m%s\\x1b[0m", `✅ Middleware ${index + 1} initialized`);
});

// Enhanced static file handling
app.use(async (ctx, next) => {
  const filePath = ctx.request.url.pathname;
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  
  const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  
  if (mimeTypes[extension as keyof typeof mimeTypes]) {
    try {
      ctx.response.headers.set('Content-Type', mimeTypes[extension as keyof typeof mimeTypes]);
      ctx.response.headers.set('X-Framework-Version', VERSION);
      ctx.response.headers.set('X-Site-Key', SITE_CONFIG.siteKey);
      
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

// CORS configuration
app.use(oakCors({
  origin: SITE_CONFIG.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  maxAge: env.DENO_ENV === 'production' ? 86400 : 300
}));

// Site-specific routes
app.use(router.routes());
app.use(router.allowedMethods());

// Enhanced 404 fallback
app.use(async (ctx) => {
  ctx.response.status = 404;
  ctx.response.headers.set('X-Framework-Version', VERSION);
  ctx.response.headers.set('X-Site-Key', SITE_CONFIG.siteKey);
  
  try {
    await send(ctx, "/pages/errors/404.html", {
      root: `${Deno.cwd()}/public`,
    });
  } catch {
    ctx.response.type = 'application/json';
    ctx.response.body = {
      error: 'Not Found',
      message: 'The requested resource was not found',
      path: ctx.request.url.pathname,
      timestamp: new Date().toISOString(),
      site: SITE_CONFIG.siteKey,
      framework: VERSION
    };
  }
});

// Graceful shutdown handling
const handleShutdown = async (signal: string) => {
  console.log("\\x1b[33m%s\\x1b[0m", `\\n🛑 Received ${signal}, shutting down ${SITE_CONFIG.name} gracefully...`);
  
  const finalMetrics = monitor.getMetrics();
  console.log("\\x1b[36m%s\\x1b[0m", `📊 Final metrics: ${finalMetrics.requests || 0} requests processed`);
  
  try {
    // Close database connections (shared across framework)
    // Note: Be careful with shared resources in centralized architecture
    console.log("\\x1b[32m%s\\x1b[0m", "✅ Graceful shutdown complete");
  } catch (error) {
    console.log("\\x1b[31m%s\\x1b[0m", `❌ Shutdown error: ${error.message}`);
  }
  
  Deno.exit(0);
};

Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

// Site-specific startup information
console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");
console.log("\\x1b[32m%s\\x1b[0m", `🚀 ${SITE_CONFIG.name} - Centralized Framework Startup`);
console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");

const serverInfo = [
  { label: 'Site Name', value: SITE_CONFIG.name },
  { label: 'Framework Version', value: VERSION },
  { label: 'Build Date', value: BUILD_DATE },
  { label: 'Site Key', value: SITE_CONFIG.siteKey },
  { label: 'Server URL', value: `http://localhost:${SITE_CONFIG.port}` },
  { label: 'Domain', value: SITE_CONFIG.domain },
  { label: 'Process ID', value: Deno.pid.toString() },
  { label: 'Database Status', value: getDatabaseStatus() ? '✅ Connected' : '❌ Disconnected' }
];

serverInfo.forEach(info => {
  console.log("\\x1b[36m%s\\x1b[0m", `📊 ${info.label}: ${info.value}`);
});

console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");

// Start server
console.log("\\x1b[32m%s\\x1b[0m", `⚙️ ${SITE_CONFIG.name} running on port ${SITE_CONFIG.port}`);
console.log("\\x1b[36m%s\\x1b[0m", `🌐 Framework: DenoGenesis ${VERSION} (Centralized)`);
console.log("\\x1b[33m%s\\x1b[0m", `🔗 Health: http://localhost:${SITE_CONFIG.port}/health`);

try {
  await app.listen({
    port: SITE_CONFIG.port,
    hostname: "0.0.0.0"
  });
} catch (error) {
  console.log("\\x1b[31m%s\\x1b[0m", `❌ Failed to start ${SITE_CONFIG.name}: ${error.message}`);
  Deno.exit(1);
}
