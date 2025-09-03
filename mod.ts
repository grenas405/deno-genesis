/**
 * =============================================================================
 * DenoGenesis Framework - Main Module (mod.ts)
 * =============================================================================
 *
 * This module serves as the central export point for the DenoGenesis framework,
 * aggregating all core functionality from configuration, middleware, and utilities.
 *
 * Architecture:
 * - Imports from config/ directory for environment variables and system config
 * - Imports from middleware/ directory for request processing stack
 * - Imports from core/ directory for framework utilities and integrity validation
 *
 * @module DenoGenesis
 * @version 1.0.0
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

// =============================================================================
// CONFIGURATION IMPORTS
// =============================================================================

/**
 * Environment Configuration
 * Imports all environment variables and system configuration from config/env.ts
 */
export {
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
} from "./config/env.ts";

// =============================================================================
// MIDDLEWARE IMPORTS
// =============================================================================

/**
 * Middleware Stack Components
 * Imports middleware management system from middleware/index.ts
 */
export {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,
} from "./middleware/index.ts";

// =============================================================================
// CORE FRAMEWORK UTILITIES
// =============================================================================

/**
 * Database Management
 * Database connection lifecycle management from existing client.ts
 */
export {
  closeDatabaseConnection,
  getDatabaseStatus,
} from "./database/client.ts";

/**
 * Framework Integrity & Version Management
 * Framework version information and validation utilities
 */
export {
  getFrameworkVersion,
  validateFrameworkIntegrity,
} from "./utils/index.ts";

// =============================================================================
// MODULE DOCUMENTATION
// =============================================================================

/**
 * USAGE EXAMPLE:
 *
 * ```typescript
 * import {
 *   createMiddlewareStack,
 *   MiddlewareManager,
 *   type MiddlewareConfig,
 *   closeDatabaseConnection,
 *   PORT,
 *   DENO_ENV,
 *   SITE_KEY,
 *   SERVER_HOST,
 *   CORS_ORIGINS,
 *   VERSION,
 *   BUILD_DATE,
 *   BUILD_HASH,
 *   getDatabaseStatus,
 *   getFrameworkVersion,
 *   validateFrameworkIntegrity
 * } from "./mod.ts";
 *
 * // Initialize middleware stack
 * const middleware = createMiddlewareStack();
 * const manager = new MiddlewareManager();
 *
 * // Access environment configuration
 * console.log(`Server running on ${SERVER_HOST}:${PORT}`);
 * console.log(`Environment: ${DENO_ENV}`);
 * console.log(`Site Key: ${SITE_KEY}`);
 * console.log(`Framework Version: ${VERSION} (${BUILD_HASH})`);
 *
 * // Framework health checks
 * const dbStatus = await getDatabaseStatus();
 * const frameworkVersion = getFrameworkVersion();
 * const integrityCheck = await validateFrameworkIntegrity();
 *
 * console.log('System Status:', {
 *   database: dbStatus,
 *   framework: frameworkVersion,
 *   integrity: integrityCheck
 * });
 *
 * // Cleanup on shutdown
 * addEventListener("unload", async () => {
 *   await closeDatabaseConnection();
 * });
 * ```
 *
 * MIDDLEWARE CONFIGURATION:
 *
 * ```typescript
 * const middlewareConfig: MiddlewareConfig = {
 *   cors: {
 *     origins: CORS_ORIGINS,
 *     credentials: true
 *   },
 *   security: {
 *     contentSecurityPolicy: true,
 *     frameOptions: "SAMEORIGIN"
 *   },
 *   logging: {
 *     level: DENO_ENV === "production" ? "info" : "debug"
 *   }
 * };
 *
 * const stack = createMiddlewareStack(middlewareConfig);
 * ```
 */

// =============================================================================
// TYPE DEFINITIONS FOR FRAMEWORK EXPORTS
// =============================================================================

/**
 * Environment variables type definitions for better TypeScript support
 */
export interface DenoGenesisEnvironment {
  readonly PORT: number;
  readonly DENO_ENV: "development" | "production" | "staging";
  readonly SITE_KEY: string;
  readonly SERVER_HOST: string;
  readonly CORS_ORIGINS: string[];
  readonly VERSION: string;
  readonly BUILD_DATE: string;
  readonly BUILD_HASH: string;
}

/**
 * Database status information
 */
export interface DatabaseStatus {
  connected: boolean;
  host: string;
  database: string;
  poolSize: number;
  activeConnections: number;
  uptime: number;
}

/**
 * Framework version and integrity information
 */
export interface FrameworkInfo {
  version: string;
  buildDate: string;
  buildHash: string;
  environment: string;
  coreIntegrity: boolean;
  dependencyIntegrity: boolean;
}

// =============================================================================
// FRAMEWORK CONSTANTS
// =============================================================================

/**
 * DenoGenesis Framework Constants
 * Central constants used across the framework
 */
export const FRAMEWORK_NAME = "DenoGenesis";
export const FRAMEWORK_DESCRIPTION = "Local-First Enterprise Web Framework";
export const FRAMEWORK_AUTHOR = "Pedro M. Dominguez - Dominguez Tech Solutions LLC";
export const FRAMEWORK_LICENSE = "AGPL-3.0";
export const FRAMEWORK_REPOSITORY = "https://github.com/dominguez-tech/deno-genesis";

/**
 * Default configuration values for new installations
 */
export const DEFAULT_CONFIG = {
  MAX_REQUEST_SIZE: 50 * 1024 * 1024, // 50MB
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  API_RATE_LIMIT: 1000, // requests per minute
  DATABASE_POOL_SIZE: 10,
  LOG_RETENTION_DAYS: 30,
} as const;

/**
 * Framework status codes for health checks and monitoring
 */
export const STATUS_CODES = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
  UNKNOWN: "unknown",
} as const;

// =============================================================================
// FRAMEWORK INITIALIZATION HELPERS
// =============================================================================

/**
 * Initialize the complete DenoGenesis framework with all components
 * This is a convenience function for quick setup
 */
export async function initializeFramework(): Promise<{
  middleware: ReturnType<typeof createMiddlewareStack>;
  config: DenoGenesisEnvironment;
  status: {
    database: DatabaseStatus;
    framework: FrameworkInfo;
  };
}> {
  // Initialize middleware stack with default configuration
  const middleware = createMiddlewareStack();

  // Gather environment configuration
  const config: DenoGenesisEnvironment = {
    PORT,
    DENO_ENV,
    SITE_KEY,
    SERVER_HOST,
    CORS_ORIGINS,
    VERSION,
    BUILD_DATE,
    BUILD_HASH,
  };

  // Perform health checks
  const status = {
    database: await getDatabaseStatus(),
    framework: {
      ...getFrameworkVersion(),
      coreIntegrity: await validateFrameworkIntegrity(),
      dependencyIntegrity: true, // Placeholder for dependency validation
    },
  };

  return {
    middleware,
    config,
    status,
  };
}

/**
 * Graceful shutdown helper
 * Properly closes all framework resources
 */
export async function shutdownFramework(): Promise<void> {
  try {
    // Close database connections
    await closeDatabaseConnection();

    // Additional cleanup tasks can be added here
    console.log("🔒 DenoGenesis framework shutdown completed successfully");
  } catch (error) {
    console.error("❌ Error during framework shutdown:", error);
    throw error;
  }
}
