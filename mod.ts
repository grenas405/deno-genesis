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
} from "./core/database/client.ts";

/**
 * Framework Integrity & Version Management
 * Framework version information and validation utilities
 */
export {
  getFrameworkVersion,
  validateFrameworkIntegrity,
} from "./core/utils/index.ts";

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
 *   validateFrameworkIntegrity,
 *   ConsoleStyler,
 *   type DenoGenesisConfig,
 *   type LogLevel
 * } from "./mod.ts";
 * 
 * // Use ConsoleStyler for professional logging
 * ConsoleStyler.logSuccess('Framework initialized successfully!');
 * ConsoleStyler.printBanner(config);
 * 
 * // Initialize middleware stack
 * const middlewareManager = new MiddlewareManager();
 * const stack = createMiddlewareStack(middlewareConfig);
 * ```
 * 
 * FRAMEWORK ARCHITECTURE:
 * 
 * The DenoGenesis framework is designed with a modular architecture where:
 * - All core functionality is centralized in the /core directory
 * - Sites reference core components via symbolic links to prevent version drift
 * - The mod.ts file serves as the single source of truth for exports
 * - Professional logging and styling is available framework-wide
 * 
 * DEPLOYMENT WORKFLOW:
 * 
 * 1. Core framework development happens in /core
 * 2. Sites use symbolic links to reference core components  
 * 3. The syslink-creator.ts script maintains these symbolic links
 * 4. mod.ts provides centralized access to all framework functionality
 * 
 * This ensures consistency, prevents code duplication, and maintains
 * professional development standards across all DenoGenesis projects.
 */