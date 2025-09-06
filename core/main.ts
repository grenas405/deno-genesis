import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config as loadEnv } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
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
  BUILD_DATE,
  BUILD_HASH,
  getDatabaseStatus,
  getFrameworkVersion,
  validateFrameworkIntegrity,
  ConsoleStyler,
  type DenoGenesisConfig
} from "./mod.ts";

// Single source of truth for configuration
class ServerConfig {
  private static _instance: ServerConfig;
  private _frameworkVersion: string | null = null;
  
  public readonly port: number;
  public readonly environment: string;
  public readonly middlewareConfig: MiddlewareConfig;

  private constructor() {
    const env = await loadEnv();
    this.port = parseInt(env.PORT || PORT?.toString() || "3000");
    this.environment = DENO_ENV;
    
    // Single middleware configuration - no duplication
    this.middlewareConfig = {
      environment: DENO_ENV,
      port: this.port,
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
  }

  public static async getInstance(): Promise<ServerConfig> {
    if (!this._instance) {
      this._instance = new ServerConfig();
    }
    return this._instance;
  }

  // Cache framework version to avoid multiple calls
  public async getFrameworkVersion(): Promise<string> {
    if (!this._frameworkVersion) {
      this._frameworkVersion = await getFrameworkVersion();
    }
    return this._frameworkVersion;
  }
}

class ServerApplication {
  private app: Application;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.app = new Application();
    this.config = config;
  }

  // Consolidated startup validation and banner using ConsoleStyler
  private async displayStartupInfo(): Promise<void> {
    try {
      const isValid = await validateFrameworkIntegrity();
      if (isValid) {
        ConsoleStyler.logSuccess('Framework integrity validated');
      } else {
        ConsoleStyler.logWarning('Framework integrity warnings detected');
      }
    } catch (error) {
      ConsoleStyler.logError(`Framework integrity check failed: ${error.message}`);
    }

    const version = await this.config.getFrameworkVersion();
    const buildDate = BUILD_DATE || "June 2, 2025";

    // Use ConsoleStyler for professional banner display
    const bannerConfig: DenoGenesisConfig = {
      siteName: SITE_KEY,
      version,
      buildDate,
      environment: this.config.environment,
      port: this.config.port,
      host: SERVER_HOST,
      author: "Pedro M. Dominguez",
      company: "Dominguez Tech Solutions LLC",
      repository: "https://github.com/xtcedro"
    };

    ConsoleStyler.printBanner(bannerConfig);
  }

  // Single middleware setup using ConsoleStyler
  private setupMiddleware(): void {
    ConsoleStyler.logInfo('Initializing middleware stack...');
    
    // Use framework's middleware stack - it handles static files, CORS, security, etc.
    const { middlewares } = createMiddlewareStack(this.config.middlewareConfig);
    middlewares.forEach(middleware => this.app.use(middleware));

    // Initialize MiddlewareManager with same config
    MiddlewareManager.getInstance(this.config.middlewareConfig);

    ConsoleStyler.logSuccess('Middleware stack initialized');
  }

  // Simplified routes setup using ConsoleStyler
  private setupRoutes(): void {
    ConsoleStyler.logInfo('Configuring routes...');
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }

  // Single 404 handler using cached version
  private setup404Handler(): void {
    this.app.use(async (ctx) => {
      ctx.response.status = 404;
      ctx.response.type = 'application/json';
      ctx.response.body = {
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: ctx.request.url.pathname,
        timestamp: new Date().toISOString(),
        version: await this.config.getFrameworkVersion(), // Uses cached version
        environment: this.config.environment
      };
    });
  }

  // Consolidated graceful shutdown using ConsoleStyler
  private setupGracefulShutdown(): void {
    const handleShutdown = async (signal: string) => {
      ConsoleStyler.logWarning(`Received ${signal}, shutting down gracefully...`);

      try {
        await closeDatabaseConnection();
        ConsoleStyler.logSuccess('Database connection closed');
      } catch (error) {
        ConsoleStyler.logError(`Database closure error: ${error.message}`);
      }

      ConsoleStyler.logSuccess('DenoGenesis shutdown complete');
      Deno.exit(0);
    };

    Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
    Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

    // Global error handlers
    globalThis.addEventListener("error", (event) => {
      ConsoleStyler.logError(`Uncaught error: ${event.error?.message || event.error}`);
    });

    globalThis.addEventListener("unhandledrejection", (event) => {
      ConsoleStyler.logError(`Unhandled promise rejection: ${event.reason}`);
      event.preventDefault();
    });
  }

  // Professional metrics display using ConsoleStyler
  private displayMetrics(): void {
    setTimeout(async () => {
      const version = await this.config.getFrameworkVersion(); // Uses cached version
      
      // Use ConsoleStyler for professional system status display
      ConsoleStyler.printSystemStatus({
        version,
        environment: this.config.environment,
        siteKey: SITE_KEY,
        database: getDatabaseStatus() ? 'Connected' : 'Disconnected',
        server: `http://${SERVER_HOST}:${this.config.port}`,
        timestamp: new Date().toISOString()
      });
    }, 2000);
  }

  // Clean startup sequence with professional logging
  public async start(): Promise<void> {
    try {
      await this.displayStartupInfo();
      this.setupMiddleware();
      this.setupRoutes();
      this.setup404Handler();
      this.setupGracefulShutdown();
      this.displayMetrics();

      ConsoleStyler.logSuccess(`Starting server on http://${SERVER_HOST}:${this.config.port}`);

      await this.app.listen({
        port: this.config.port,
        hostname: SERVER_HOST === 'localhost' ? '0.0.0.0' : SERVER_HOST
      });

    } catch (error) {
      ConsoleStyler.logError(`Server startup failed: ${error.message}`);

      try {
        await closeDatabaseConnection();
      } catch (dbError) {
        ConsoleStyler.logError(`Database cleanup error: ${dbError.message}`);
      }

      Deno.exit(1);
    }
  }
}

// Clean application startup
const config = await ServerConfig.getInstance();
const server = new ServerApplication(config);
await server.start();