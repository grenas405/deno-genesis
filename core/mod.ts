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
 * Updated to follow Unix Philosophy principles:
 * - Each export does one thing well
 * - Clear separation of concerns
 * - Composable components
 * - Explicit dependencies
 *
 * @module DenoGenesis
 * @version 1.5.0-unix-compliant
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 * @follows Unix Philosophy + Deno security model
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
} from "./routes/index.ts";

/**
 * Middleware Stack Components
 * Imports middleware management system from middleware/index.ts
 */
export {
  createMiddlewareStack,
  MiddlewareManager,
  createStaticFileTestHelper, // ✅ NEW UTILITY
  StaticFileHandler,
  StaticFileAnalytics,
  StaticFileUtils,
  type MiddlewareConfig,
} from "./middleware/index.ts";

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
} from "./database/client.ts";

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Environment Configuration
 * Imports all environment variables and system configuration from config/env.ts
 */
export {
  dbConfig,
  PORT,
  DENO_ENV,
  SITE_KEY,
  DB_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  getEnvironmentInfo,
} from "./config/env.ts";

// =============================================================================
// FRAMEWORK UTILITIES - UNIX PHILOSOPHY COMPLIANT
// =============================================================================

/**
 * MIME Type Configuration
 * Static file serving utilities following Unix Philosophy:
 * - DEFAULT_MIME_TYPES: File extension to MIME type mappings
 * - getMimeType: Pure function for extension lookup
 * - getSupportedExtensions: List of supported file types
 * - isExtensionSupported: Extension validation predicate
 */
export {
  DEFAULT_MIME_TYPES,
  getMimeType,
  getSupportedExtensions,
  isExtensionSupported,
  MIME_TYPES_METADATA,
} from "./utils/mime-types.ts";

/**
 * Process Handler Utilities
 * Process lifecycle management following Unix Philosophy:
 * - registerSignalHandlers: Graceful shutdown signal handling
 * - registerErrorHandlers: Global error and rejection handling
 * - validateHandlerSetup: Handler configuration validation
 */
export {
  registerSignalHandlers,
  registerErrorHandlers,
  validateHandlerSetup,
  type SignalHandlerRegistration,
  type ErrorHandlerRegistration,
  type HandlerValidationResult,
  PROCESS_HANDLERS_METADATA,
} from "./utils/process-handlers.ts";


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
} from "./utils/consoleStyler.ts";

export {
  validateFrameworkIntegrity,
  getFrameworkVersion,
} from "./meta.ts";


// =============================================================================
// UNIX PHILOSOPHY COMPLIANCE DOCUMENTATION
// =============================================================================

/**
 * USAGE EXAMPLE - Unix Philosophy Pattern:
 *
 * ```typescript
 * import {
 *   // Core Oak Framework - HTTP server functionality
 *   Application,
 *   send,
 *   oakCors,
 *
 *   // Environment Management - Configuration loading
 *   loadEnv,
 *
 *   // DenoGenesis Framework Components - Request processing
 *   router,
 *   createMiddlewareStack,
 *   MiddlewareManager,
 *   type MiddlewareConfig,
 *
 *   // Database Layer - Data persistence
 *   db,
 *   getDatabaseStatus,
 *   closeDatabaseConnection,
 *
 *   // Environment Configuration - Runtime settings
 *   PORT,
 *   DENO_ENV,
 *   SITE_KEY,
 *   SERVER_HOST,
 *   CORS_ORIGINS,
 *   VERSION,
 *   BUILD_DATE,
 *   BUILD_HASH,
 *
 *   // Framework Utilities - Core utilities only
 *   DEFAULT_MIME_TYPES,
 *   registerSignalHandlers,
 *   registerErrorHandlers,
 * } from "./mod.ts";
 *
 * // Unix Philosophy: Each step does one thing well
 *
 * // 1. Initialize error and signal handling
 * const errorHandlers = registerErrorHandlers();
 * const signalHandlers = registerSignalHandlers(async () => {
 *   await closeDatabaseConnection();
 * });
 *
 * // 2. Create Oak application
 * const app = new Application();
 *
 * // 3. Configure middleware stack
 * const middlewareConfig: MiddlewareConfig = {
 *   environment: DENO_ENV,
 *   port: PORT,
 *   // ... other config
 * };
 *
 * // 4. Apply middleware
 * const { middlewares } = createMiddlewareStack(middlewareConfig);
 * middlewares.forEach(middleware => app.use(middleware));
 *
 * // 5. Register routes
 * app.use(router.routes());
 * app.use(router.allowedMethods());
 *
 * // 6. Start server
 * console.log(`🚀 Server starting on ${SERVER_HOST}:${PORT}`);
 * await app.listen({ port: PORT });
 * ```
 *
 * UNIX PHILOSOPHY COMPLIANCE:
 *
 * 1. **Do One Thing Well**: Each export has a single, clear responsibility
 *    - DEFAULT_MIME_TYPES: File type mappings only
 *    - registerSignalHandlers: Process signal management only
 *    - registerErrorHandlers: Global error handling only
 *
 * 2. **Make Everything a Filter**: Functions accept input, transform, return output
 *    - registerSignalHandlers(cleanup) → SignalHandlerRegistration
 *    - registerErrorHandlers() → ErrorHandlerRegistration
 *    - createMiddlewareStack(config) → { middlewares, monitor }
 *
 * 3. **Avoid Captive User Interfaces**: Return structured data
 *    - All registration functions return metadata objects
 *    - Configuration is declarative, not imperative
 *    - Functions are composable with other programs
 *
 * 4. **Store Data in Flat Text Files**: Configuration is human-readable
 *    - DEFAULT_MIME_TYPES is simple key-value mapping
 *    - FRAMEWORK_METADATA can be written to version files
 *    - Environment variables in .env files
 *
 * 5. **Leverage Software Leverage**: Build composable systems
 *    - Each utility can be used independently
 *    - Clear interfaces enable testing and monitoring
 *    - Modular architecture prevents tight coupling
 *
 * DEPLOYMENT WORKFLOW:
 *
 * 1. Core framework development happens in /core
 * 2. Sites use symbolic links to reference core components
 * 3. The syslink-creator.ts script maintains these symbolic links
 * 4. mod.ts provides centralized access to all framework functionality
 * 5. Each component follows Unix Philosophy for maintainability
 *
 * This ensures consistency, prevents code duplication, and maintains
 * Unix Philosophy principles across all DenoGenesis projects.
 */
