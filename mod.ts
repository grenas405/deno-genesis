/**
 * =============================================================================
 * DenoGenesis Framework - Main Module (mod.ts)
 * =============================================================================
 * 
 * Central export point for the DenoGenesis framework. All core functionality
 * is exported from this module to ensure consistency and prevent version drift.
 * 
 * @module DenoGenesis
 * @version 1.4.0-enterprise
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

// =============================================================================
// CORE OAK FRAMEWORK
// =============================================================================

export { 
  Application,
  send 
} from "https://deno.land/x/oak@v12.6.1/mod.ts";

export { 
  oakCors 
} from "https://deno.land/x/cors@v1.2.2/mod.ts";

// =============================================================================
// ENVIRONMENT MANAGEMENT
// =============================================================================

export { 
  config as loadEnv 
} from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// =============================================================================
// FRAMEWORK COMPONENTS
// =============================================================================

export { 
  default as router 
} from "./core/routes/index.ts";

export {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,
} from "./core/middleware/index.ts";

// =============================================================================
// DATABASE LAYER
// =============================================================================

export {
  db,
  closeDatabaseConnection,
  getDatabaseStatus,
} from "./core/database/client.ts";

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

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
// FRAMEWORK METADATA & VALIDATION
// =============================================================================

export {
  getFrameworkVersion,
  getFrameworkStats,
  getFrameworkMetadata,
  getConnectedSites,
  getSiteFrameworkVersion,
  validateFrameworkIntegrity,
  validateFrameworkIntegrityDetailed,
  getFrameworkHealthReport,
  logFrameworkStartup,
  type FrameworkVersionInfo,
  type FrameworkStats,
  type FrameworkMetadata,
  type SiteMetadata,
  type FrameworkIntegrityResult,
  type IntegrityCheckResult,
  type IntegrityCheck,
  type FrameworkHealthReport,
} from "./core/meta.ts";

// =============================================================================
// UTILITIES
// =============================================================================

export {
  ConsoleStyler,
  type DenoGenesisConfig,
  type LogEntry,
  type LogLevel,
  type PerformanceMetrics,
  type TableColumn,
} from "./core/utils/consoleStyler.ts";

export {
  DEFAULT_MIME_TYPES,
  frameworkConfig,
  DENOGENESIS_METADATA,
  displayFrameworkBanner,
  registerSignalHandlers,
  registerErrorHandlers,
} from "./core/utils/framework.ts";