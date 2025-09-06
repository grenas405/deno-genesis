/**
 * =============================================================================
 * DenoGenesis Framework - Main Module (mod.ts)
 * =============================================================================
 * 
 * This module serves as the central export point for the DenoGenesis framework,
 * aggregating all core functionality from configuration, middleware, utilities,
 * and external dependencies. Designed to prevent version drift and maintain
 * consistency across all DenoGenesis sites.
 * 
 * Architecture:
 * - Imports from config/ directory for environment variables and system config
 * - Imports from middleware/ directory for request processing stack
 * - Imports from core/ directory for framework utilities and integrity validation
 * - Exports Oak framework components for consistent usage
 * - Provides framework metadata and utility functions
 * 
 * @module DenoGenesis
 * @version 1.4.0-enterprise
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

// =============================================================================
// CORE OAK FRAMEWORK COMPONENTS
// =============================================================================

/**
 * Oak Framework Exports
 * Core Oak framework components for HTTP server functionality
 */
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

/**
 * Environment Configuration Loading
 * Dotenv loader for environment variable management
 */
export { 
  config as loadEnv 
} from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// =============================================================================
// DENOGENESIS FRAMEWORK COMPONENTS
// =============================================================================

/**
 * Routing System
 * Import the main router from routes/index.ts
 */
export { 
  default as router 
} from "./core/routes/index.ts";

/**
 * Middleware Stack Components
 * Imports middleware management system from middleware/index.ts
 */
export {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig,
} from "./core/middleware/index.ts";

// =============================================================================
// DATABASE LAYER
// =============================================================================

/**
 * Database Management
 * Database connection lifecycle management and main db instance
 */
export {
  db,
  closeDatabaseConnection,
  getDatabaseStatus,
} from "./core/database/client.ts";

// =============================================================================
// ENVIRONMENT CONFIGURATION
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
// FRAMEWORK METADATA, UTILITIES & VALIDATION
// =============================================================================

/**
 * Framework Metadata, Version Management & Integrity Validation
 * All framework metadata and validation utilities from the combined meta.ts
 */
export {
  // Version Information
  getFrameworkVersion,
  getFrameworkStats,
  type FrameworkVersionInfo,
  type FrameworkStats,
  
  // Framework Metadata Collection
  getFrameworkMetadata,
  getConnectedSites,
  getSiteFrameworkVersion,
  type FrameworkMetadata,
  type SiteMetadata,
  
  // Integrity Validation
  validateFrameworkIntegrity,
  validateFrameworkIntegrityDetailed,
  type FrameworkIntegrityResult,
  type IntegrityCheckResult,
  type IntegrityCheck,
  
  // Health Reporting
  getFrameworkHealthReport,
  logFrameworkStartup,
  type FrameworkHealthReport,
} from "./core/meta.ts";

/**
 * Console Styling & Logging
 * Professional console output formatting and logging utilities
 */
export {
  ConsoleStyler,
  type DenoGenesisConfig,
  type LogEntry,
  type LogLevel,
  type PerformanceMetrics,
  type TableColumn,
} from "./core/utils/consoleStyler.ts";


// =============================================================================
// MODULE DOCUMENTATION & USAGE EXAMPLES
// =============================================================================

/**
 * USAGE EXAMPLE:
 * 
 * ```typescript
 * import {
 *   // Core Oak Framework
 *   Application,
 *   send,
 *   oakCors,
 * 
 *   // Environment Management
 *   loadEnv,
 * 
 *   // DenoGenesis Framework Components
 *   router,
 *   createMiddlewareStack,
 *   MiddlewareManager,
 *   type MiddlewareConfig,
 * 
 *   // Database Layer
 *   db,
 *   getDatabaseStatus,
 *   closeDatabaseConnection,
 * 
 *   // Environment Configuration
 *   PORT,
 *   DENO_ENV,
 *   SITE_KEY,
 *   SERVER_HOST,
 *   CORS_ORIGINS,
 *   VERSION,
 *   BUILD_DATE,
 *   BUILD_HASH,
 * 
 *   // Framework Metadata & Utilities
 *   getFrameworkVersion,
 *   getFrameworkMetadata,
 *   validateFrameworkIntegrity,
 *   logFrameworkStartup,
 *   frameworkConfig,
 *   DENOGENESIS_METADATA,
 * 
 *   // Framework Utilities
 *   DEFAULT_MIME_TYPES,
 *   displayFrameworkBanner,
 *   registerSignalHandlers,
 *   registerErrorHandlers,
 * 
 *   // Console Styling
 *   ConsoleStyler
 * } from "./mod.ts";
 * 
 * // Initialize framework
 * displayFrameworkBanner();
 * registerSignalHandlers();
 * registerErrorHandlers();
 * 
 * // Enhanced startup logging
 * await logFrameworkStartup(true);
 * 
 * // Create Oak application
 * const app = new Application();
 * 
 * // Configure middleware
 * const middlewareConfig: MiddlewareConfig = {
 *   environment: DENO_ENV,
 *   port: PORT,
 *   // ... other config
 * };
 * 
 * const { middlewares } = createMiddlewareStack(middlewareConfig);
 * middlewares.forEach(middleware => app.use(middleware));
 * 
 * // Register routes
 * app.use(router.routes());
 * app.use(router.allowedMethods());
 * 
 * // Get framework health report
 * const healthReport = await getFrameworkHealthReport();
 * console.log(`Framework status: ${healthReport.status}`);
 * 
 * // Start server
 * console.log(`🚀 Server starting on ${SERVER_HOST}:${PORT}`);
 * await app.listen({ port: PORT });
 * ```
 * 
 * FRAMEWORK ARCHITECTURE:
 * 
 * The DenoGenesis framework is designed with a modular architecture where:
 * - All core functionality is centralized in the /core directory
 * - Sites reference core components via symbolic links to prevent version drift
 * - The mod.ts file serves as the single source of truth for exports
 * - Professional logging and styling is available framework-wide
 * - Comprehensive metadata and health monitoring built-in
 * 
 * DEPLOYMENT WORKFLOW:
 * 
 * 1. Core framework development happens in /core
 * 2. Sites use symbolic links to reference core components  
 * 3. The syslink-creator.ts script maintains these symbolic links
 * 4. mod.ts provides centralized access to all framework functionality
 * 5. Framework integrity validation ensures system health
 * 
 * This ensures consistency, prevents code duplication, and maintains
 * professional development standards across all DenoGenesis projects.
 */