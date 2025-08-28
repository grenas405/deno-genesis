// denogenesis-framework/mod.ts
// Main framework export file

// Core middleware system
export {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig
} from "./core/middleware/index.ts";

// Database system
export {
  db,
  databaseManager,
  executeQuery,
  getDatabaseStatus,
  closeDatabaseConnection
} from "./core/database/client.ts";

// Configuration system
export {
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  frameworkConfig,
  dbConfig,
  getEnvironmentInfo
} from "./core/config/env.ts";

// Framework metadata
export { getFrameworkVersion, validateFrameworkIntegrity } from "./core/meta.ts";

// Site creation utilities
export { createNewSite, updateSiteFramework}
