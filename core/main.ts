import { Application, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config as loadEnv } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import router from "./routes/index.ts";
import {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,
  closeDatabaseConnection,
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  getDatabaseStatus,
  getFrameworkVersion,
  validateFrameworkIntegrity
} from "./mod.ts";

// Initialize environment and application
const env = await loadEnv();
const port = parseInt(env.PORT || PORT?.toString() || "3000");
const app = new Application();

// Framework integrity validation
const validateIntegrity = async (): Promise<void> => {
  try {
    const isValid = await validateFrameworkIntegrity();
    console.log(isValid ? "✅ Framework integrity validated" : "⚠️ Framework integrity warnings");
  } catch (error) {
    console.error(`❌ Framework integrity check failed: ${error.message}`);
  }
};

// Startup banner
const displayBanner = async (): Promise<void> => {
  const version = await getFrameworkVersion();
  const buildDate = BUILD_DATE || "June 2, 2025";

  console.log("✨ DenoGenesis Framework Engine ✨");
  console.log(`⚙️ Version: ${version} | 📅 Build: ${buildDate}`);
  console.log(`🌍 Environment: ${DENO_ENV} | 🔑 Site: ${SITE_KEY}`);
  console.log(`🚀 Server: http://${SERVER_HOST}:${port}`);
  console.log("🔗 GitHub: https://github.com/xtcedro");
  console.log("✨ Developed by Pedro M. Dominguez ✨\n");
};

// Middleware configuration
const createMiddleware = (): void => {
  const config: MiddlewareConfig = {
    environment: DENO_ENV,
    port,
    staticFiles: {
      root: `${Deno.cwd()}/public`,
      enableCaching: DENO_ENV === 'production',
      maxAge: DENO_ENV === 'production' ? 86400 : 300
    },
    cors: {
      allowedOrigins: DENO_ENV === 'production' 
        ? CORS_ORIGINS.filter(origin => !origin.includes('localhost'))
        : CORS_ORIGINS,
      developmentOrigins: CORS_ORIGINS.filter(origin => origin.includes('localhost')),
      credentials: true,
      maxAge: DENO_ENV === 'production' ? 86400 : 300
    },
    security: {
      enableHSTS: DENO_ENV === 'production',
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
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

  const { middlewares } = createMiddlewareStack(config);
  middlewares.forEach(middleware => app.use(middleware));

  console.log("✅ Middleware stack initialized");
};

// Static file handler with MIME types
const setupStaticFiles = (): void => {
  const mimeTypes: Record<string, string> = {
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
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8'
  };

  app.use(async (ctx, next) => {
    const filePath = ctx.request.url.pathname;
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();

    if (mimeTypes[ext]) {
      try {
        ctx.response.headers.set('Content-Type', mimeTypes[ext]);

        if (DENO_ENV === 'production') {
          ctx.response.headers.set('Cache-Control', 'public, max-age=86400');
          ctx.response.headers.set('ETag', `"${BUILD_HASH || Date.now()}"`);
        }

        await send(ctx, filePath, { root: `${Deno.cwd()}/public`, index: "index.html" });
        return;
      } catch {
        // File not found, continue to next middleware
      }
    }
    await next();
  });
};

// CORS setup
const setupCORS = (): void => {
  app.use(oakCors({
    origin: DENO_ENV === 'production' 
      ? ["https://efficientmoversllc.com"]
      : [...CORS_ORIGINS, "https://efficientmoversllc.com"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    maxAge: DENO_ENV === 'production' ? 86400 : 300
  }));
};

// 404 handler
const setup404Handler = (): void => {
  app.use(async (ctx) => {
    ctx.response.status = 404;

    try {
      await send(ctx, "/pages/errors/404.html", { root: `${Deno.cwd()}/public` });
    } catch {
      ctx.response.type = 'application/json';
      ctx.response.body = {
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: ctx.request.url.pathname,
        timestamp: new Date().toISOString(),
        version: await getFrameworkVersion(),
        environment: DENO_ENV
      };
    }
  });
};

// Graceful shutdown handler
const setupGracefulShutdown = (): void => {
  const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    try {
      await closeDatabaseConnection();
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error(`❌ Database closure error: ${error.message}`);
    }

    console.log("✅ DenoGenesis shutdown complete");
    Deno.exit(0);
  };

  Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
  Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

  // Global error handlers
  globalThis.addEventListener("error", (event) => {
    console.error(`❌ Uncaught error: ${event.error?.message || event.error}`);
  });

  globalThis.addEventListener("unhandledrejection", (event) => {
    console.error(`❌ Unhandled promise rejection: ${event.reason}`);
    event.preventDefault();
  });
};

// System metrics display
const displayMetrics = (): void => {
  setTimeout(async () => {
    const version = await getFrameworkVersion();
    console.log("\n📊 System Status:");
    console.log(`⚡ Version: ${version}`);
    console.log(`🌍 Environment: ${DENO_ENV}`);
    console.log(`🔑 Site Key: ${SITE_KEY}`);
    console.log(`🗄️ Database: ${getDatabaseStatus() ? 'Connected' : 'Disconnected'}`);
    console.log(`🚀 Ready at: http://${SERVER_HOST}:${port}\n`);
  }, 2000);
};

// Main startup sequence
const startServer = async (): Promise<void> => {
  try {
    await validateIntegrity();
    await displayBanner();

    console.log("🔧 Initializing middleware stack...");
    createMiddleware();
    setupStaticFiles();
    setupCORS();

    console.log("🛣️ Configuring routes...");
    app.use(router.routes());
    app.use(router.allowedMethods());

    setup404Handler();
    setupGracefulShutdown();
    displayMetrics();

    console.log(`🚀 Starting server on http://${SERVER_HOST}:${port}`);

    await app.listen({
      port,
      hostname: SERVER_HOST === 'localhost' ? '0.0.0.0' : SERVER_HOST
    });

  } catch (error) {
    console.error(`❌ Server startup failed: ${error.message}`);

    try {
      await closeDatabaseConnection();
    } catch (dbError) {
      console.error(`❌ Database cleanup error: ${dbError.message}`);
    }

    Deno.exit(1);
  }
};

// Initialize MiddlewareManager for external access
MiddlewareManager.getInstance({
  environment: DENO_ENV,
  port,
  staticFiles: { root: `${Deno.cwd()}/public`, enableCaching: false, maxAge: 300 },
  cors: { allowedOrigins: CORS_ORIGINS, credentials: true, maxAge: 300 },
  security: { enableHSTS: false, frameOptions: 'SAMEORIGIN' },
  logging: { logLevel: 'info', logRequests: true, logResponses: false },
  healthCheck: { endpoint: '/health', includeMetrics: true, includeEnvironment: true }
});

// Start the application
await startServer();