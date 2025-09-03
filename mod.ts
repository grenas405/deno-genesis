// =============================================================================
// DenoGenesis Framework - Core Module Exports
// =============================================================================
// Centralized export hub for the DenoGenesis business operating system
// Location: /core/mod.ts
// Purpose: Single source of truth for all framework components
// =============================================================================

// =============================================================================
// DenoGenesis Framework - Core Module Exports
// =============================================================================
// Centralized export hub for the DenoGenesis business operating system
// Location: /core/mod.ts
// Purpose: Re-export all framework components from their modular locations
// =============================================================================

// === ENVIRONMENT & CONFIGURATION ===
export * from "./config/env.ts";
export * from "./config/database.ts";
export * from "./config/cors.ts";
export * from "./config/index.ts";

// === MIDDLEWARE COMPONENTS ===
export * from "./middleware/index.ts";
export * from "./middleware/performance.ts";
export * from "./middleware/security.ts";
export * from "./middleware/logging.ts";
export * from "./middleware/error.ts";
export * from "./middleware/health.ts";

// === DATABASE LAYER ===
export * from "./database/index.ts";
export * from "./database/connection.ts";
export * from "./database/models.ts";

// === UTILITIES ===
export * from "./utils/index.ts";
export * from "./utils/consoleStyler.ts";
export * from "./utils/validation.ts";
export * from "./utils/helpers.ts";

// === SERVICES ===
export * from "./services/index.ts";

// === TYPES ===
export * from "./types/index.ts";

// === AUTHENTICATION & AUTHORIZATION ===
export * from "./auth/index.ts";

// === WEBSOCKET SUPPORT ===
export * from "./websocket/index.ts";

// === FRAMEWORK METADATA ===
// These might be defined in config/env.ts, but we ensure they're available
export const FRAMEWORK_NAME = "DenoGenesis";
export const DEVELOPER = "Pedro M. Dominguez";

// === FALLBACK IMPLEMENTATIONS ===
// If specific modules don't exist yet, provide fallback implementations
// These can be removed once the actual modules are created

// Fallback for middleware if ./middleware/index.ts doesn't exist yet
export const createMiddlewareStack = (config: any) => {
  // This would normally be imported from ./middleware/index.ts
  const monitor = { getMetrics: () => ({ uptime: 0, requests: 0, errors: 0, successRate: 100 }) };
  const middlewares: any[] = [];
  return { monitor, middlewares };
};

// Fallback for MiddlewareManager if not in ./middleware/index.ts
export class MiddlewareManager {
  private static instance: any = null;
  static getInstance(config?: any): MiddlewareManager {
    if (!this.instance) this.instance = new MiddlewareManager();
    return this.instance;
  }
  logStatus(): void {
    console.log("📊 Middleware Status: Loaded");
  }
}

// === COMPATIBILITY NOTE ===
// Once you have the actual modular files in place:
// 1. Remove the fallback implementations above
// 2. The imports at the top will take precedence
// 3. Your existing main.ts will work without modification

// === FRAMEWORK UTILITIES ===
export const getFrameworkVersion = async (): Promise<string> => {
  return VERSION;
};

export const validateFrameworkIntegrity = async (): Promise<boolean> => {
  try {
    // Check if core files exist
    const coreFiles = [
      `${Deno.cwd()}/core/mod.ts`,
      `${Deno.cwd()}/core/config`,
      `${Deno.cwd()}/core/utils`
    ];

    for (const file of coreFiles) {
      try {
        await Deno.stat(file);
      } catch {
        console.warn(`⚠️ Missing framework component: ${file}`);
        return false;
      }
    }

    console.log("✅ Framework integrity check passed");
    return true;
  } catch (error) {
    console.error(`❌ Framework integrity validation failed: ${error.message}`);
    return false;
  }
};

// === FRAMEWORK CONFIGURATION ===
export interface FrameworkConfig {
  name: string;
  version: string;
  environment: string;
  siteKey: string;
  buildInfo: {
    date: string;
    hash?: string;
    developer: string;
  };
  server: {
    host: string;
    port: number;
    corsOrigins: string[];
  };
  database: DatabaseConfig;
}

export const frameworkConfig: FrameworkConfig = {
  name: FRAMEWORK_NAME,
  version: VERSION,
  environment: DENO_ENV,
  siteKey: SITE_KEY,
  buildInfo: {
    date: BUILD_DATE,
    hash: BUILD_HASH,
    developer: DEVELOPER
  },
  server: {
    host: SERVER_HOST,
    port: PORT,
    corsOrigins: CORS_ORIGINS
  },
  database: getDatabaseConfig()
};

// === UTILITY FUNCTIONS ===
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatUptime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

export const getSystemInfo = () => ({
  framework: {
    name: FRAMEWORK_NAME,
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH,
    developer: DEVELOPER
  },
  runtime: {
    deno: Deno.version.deno,
    platform: Deno.build.os,
    architecture: Deno.build.arch,
    processId: Deno.pid
  },
  environment: {
    mode: DENO_ENV,
    siteKey: SITE_KEY,
    serverHost: SERVER_HOST,
    serverPort: PORT
  },
  database: {
    config: getDatabaseConfig(),
    status: getDatabaseStatus() ? "connected" : "disconnected"
  }
});

// === ERROR HANDLING UTILITIES ===
export class FrameworkError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(message: string, code: string = "FRAMEWORK_ERROR", statusCode: number = 500, details?: any) {
    super(message);
    this.name = "FrameworkError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const createErrorResponse = (error: FrameworkError | Error, requestId?: string) => ({
  error: error instanceof FrameworkError ? error.code : "INTERNAL_ERROR",
  message: error.message,
  timestamp: new Date().toISOString(),
  requestId: requestId || "unknown",
  framework: `${FRAMEWORK_NAME}/${VERSION}`,
  ...(DENO_ENV === "development" && error.stack && { stack: error.stack }),
  ...(error instanceof FrameworkError && error.details && { details: error.details })
});

// === LOGGING UTILITIES ===
export const logFrameworkEvent = (type: "info" | "warn" | "error", message: string, context?: any) => {
  const timestamp = new Date().toISOString();
  const prefix = type === "error" ? "❌" : type === "warn" ? "⚠️" : "ℹ️";
  
  console.log(`${prefix} [${timestamp}] [${FRAMEWORK_NAME}/${VERSION}] ${message}`);
  
  if (context && DENO_ENV === "development") {
    console.log("Context:", JSON.stringify(context, null, 2));
  }
};

// === SITE IDENTIFICATION UTILITIES ===
export const getSiteKeyFromPort = (port: number): string => {
  const siteMapping: Record<number, string> = {
    3000: "domtech",
    3001: "heavenlyroofing", 
    3002: "okdevs",
    3003: "pedromdominguez",
    3004: "efficientmovers"
  };
  
  return siteMapping[port] || "unknown";
};

export const getPortFromSiteKey = (siteKey: string): number => {
  const portMapping: Record<string, number> = {
    "domtech": 3000,
    "heavenlyroofing": 3001,
    "okdevs": 3002, 
    "pedromdominguez": 3003,
    "efficientmovers": 3004
  };
  
  return portMapping[siteKey] || 3000;
};

// === CONFIGURATION VALIDATION ===
export const validateConfiguration = (): boolean => {
  const requiredEnvVars = ["DENO_ENV", "SITE_KEY"];
  const missing = requiredEnvVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    return false;
  }

  const port = parseInt(Deno.env.get("PORT") || "3000");
  if (isNaN(port) || port < 3000 || port > 3010) {
    console.error(`❌ Invalid port configuration: ${port}. Must be between 3000-3010`);
    return false;
  }

  return true;
};

// === CORE MODULE EXPORTS ===
// Export all existing framework components to maintain compatibility
export * from "./config/index.ts";
export * from "./utils/index.ts"; 
export * from "./middleware/index.ts";
export * from "./database/index.ts";
export * from "./services/index.ts";

// === CONSOLE STYLING UTILITIES ===
export * from "./utils/consoleStyler.ts";

// === ADDITIONAL FRAMEWORK COMPONENTS ===
// Export any additional modules that exist in your core directory
// Uncomment as you add these modules:
// export * from "./auth/index.ts";
// export * from "./validation/index.ts";
// export * from "./cache/index.ts";
// export * from "./websocket/index.ts";
// export * from "./email/index.ts";
// export * from "./storage/index.ts";

// === FRAMEWORK INITIALIZATION ===
export const initializeFramework = async (): Promise<boolean> => {
  console.log(`🚀 Initializing ${FRAMEWORK_NAME} Framework v${VERSION}`);
  
  // Validate configuration
  if (!validateConfiguration()) {
    return false;
  }

  // Initialize database connection
  const dbInitialized = await initializeDatabaseConnection();
  if (!dbInitialized && DENO_ENV === "production") {
    console.error("❌ Database initialization required for production");
    return false;
  }

  // Validate framework integrity
  const integrityValid = await validateFrameworkIntegrity();
  if (!integrityValid && DENO_ENV === "production") {
    console.error("❌ Framework integrity validation required for production");
    return false;
  }

  console.log(`✅ ${FRAMEWORK_NAME} Framework v${VERSION} initialized successfully`);
  return true;
};

// === COMPATIBILITY EXPORTS ===
// Ensure all original imports from your main.ts work exactly as before
// These should come from their respective modules, but we ensure they're available

// Note: Remove these once the actual modules export these properly
export const VERSION = "2.1.0";
export const BUILD_DATE = "September 3, 2025"; 
export const BUILD_HASH = Deno.env.get("BUILD_HASH");
export const DENO_ENV = Deno.env.get("DENO_ENV") || "development";
export const PORT = parseInt(Deno.env.get("PORT") || "3000");
export const SERVER_HOST = Deno.env.get("SERVER_HOST") || "localhost";
export const SITE_KEY = Deno.env.get("SITE_KEY") || "default";
export const CORS_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

// Temporary database functions - should come from ./database/index.ts
export const db = null;
export const getDatabaseStatus = () => false;
export const closeDatabaseConnection = async () => {};
export const getFrameworkVersion = async () => VERSION;
export const validateFrameworkIntegrity = async () => true;
export const frameworkConfig = { version: VERSION };

// === DEFAULT EXPORT ===
export default {
  VERSION,
  FRAMEWORK_NAME,
  DENO_ENV,
  PORT,
  SITE_KEY,
  frameworkConfig,
  createMiddlewareStack,
  MiddlewareManager,
  PerformanceMonitor,
  initializeFramework,
  getSystemInfo,
  logFrameworkEvent
};