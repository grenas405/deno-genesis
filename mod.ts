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
} from "./routes/index.ts";

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
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
} from "./config/env.ts";

// ================================================================================
// CONSOLE STYLING & LOGGING UTILITIES
// ================================================================================
export {
  ConsoleStyler,
  type DenoGenesisConfig,
  type LogEntry,
  type LogLevel,
  type PerformanceMetrics,
  type TableColumn,
} from "./utils/consoleStyler.ts";

// =============================================================================
// FRAMEWORK UTILITIES
// =============================================================================

/**
 * Default MIME Types
 * Standard MIME type mappings for static file serving
 */
export const DEFAULT_MIME_TYPES = new Map([
  // Text files
  ['.html', 'text/html; charset=utf-8'],
  ['.htm', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  // Images
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.bmp', 'image/bmp'],
  ['.tiff', 'image/tiff'],
  // Fonts
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.eot', 'application/vnd.ms-fontobject'],
  // Documents
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  // Media
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.webm', 'video/webm'],
]);

/**
 * Framework Configuration Object
 * Central configuration for DenoGenesis framework initialization
 */
export const frameworkConfig = {
  name: "DenoGenesis Framework",
  version: "1.4.0-enterprise",
  description: "Professional web application framework for Deno with enterprise-grade features",
  author: "Pedro M. Dominguez - Dominguez Tech Solutions LLC",
  license: "AGPL-3.0",
  architecture: {
    core: "/core",
    middleware: "/core/middleware",
    routes: "/core/routes",
    utils: "/core/utils",
    database: "/core/database"
  },
  features: [
    "Professional logging and styling",
    "Advanced middleware stack",
    "Database abstraction layer",
    "Security hardening",
    "Performance monitoring",
    "Health check endpoints",
    "Multi-tenant architecture",
    "Static file serving",
    "CORS configuration",
    "Environment management"
  ]
};

/**
 * Framework Banner Display
 * Professional startup banner with framework information
 */
export function displayFrameworkBanner(): void {
  const banner = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           🚀 DenoGenesis Framework                           ║
║                              v1.4.0-enterprise                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Professional web application framework for Deno                             ║
║  Built with enterprise-grade features and security                           ║
║                                                                               ║
║  📊 Multi-tenant architecture    🔒 Security hardening                      ║
║  ⚡ Performance monitoring       🏥 Health check endpoints                   ║
║  🎨 Professional logging         📁 Static file serving                     ║
║  🌐 CORS configuration          🔧 Advanced middleware                       ║
║                                                                               ║
║  Author: Pedro M. Dominguez - Dominguez Tech Solutions LLC                   ║
║  License: AGPL-3.0                                                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

  console.log('\x1b[36m%s\x1b[0m', banner);
  console.log('🎯 Framework initialized successfully!\n');
}

/**
 * Signal Handlers Registration
 * Register graceful shutdown handlers for the application
 */
export function registerSignalHandlers(): void {
  // Handle SIGINT (Ctrl+C)
  Deno.addSignalListener("SIGINT", () => {
    console.log('\n🛑 Received SIGINT, initiating graceful shutdown...');
    Deno.exit(0);
  });

  // Handle SIGTERM (container stop)
  Deno.addSignalListener("SIGTERM", () => {
    console.log('\n🛑 Received SIGTERM, initiating graceful shutdown...');
    Deno.exit(0);
  });

  console.log('📡 Signal handlers registered for graceful shutdown');
}

/**
 * Error Handlers Registration
 * Register global error handlers for uncaught exceptions
 */
export function registerErrorHandlers(): void {
  // Handle uncaught exceptions
  globalThis.addEventListener("error", (event) => {
    console.error('🚨 Uncaught exception:', event.error);
    console.error('Stack trace:', event.error?.stack);
  });

  // Handle unhandled promise rejections
  globalThis.addEventListener("unhandledrejection", (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent default behavior (logging to console)
  });

  console.log('🛡️ Global error handlers registered');
}

/**
 * Framework Metadata
 * Comprehensive metadata about the DenoGenesis framework
 */
export const DENOGENESIS_METADATA = {
  framework: {
    name: "DenoGenesis",
    version: "1.4.0-enterprise",
    description: "Professional web application framework for Deno",
    homepage: "https://github.com/domtech/denogenesis",
    author: "Pedro M. Dominguez",
    company: "Dominguez Tech Solutions LLC",
    license: "AGPL-3.0",
    created: "2024",
    lastUpdated: "2025-01-24"
  },
  runtime: {
    platform: "Deno",
    minimumVersion: "1.40.0",
    tsconfig: "deno-compatible",
    permissions: [
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--allow-env"
    ]
  },
  architecture: {
    pattern: "MVC with Service Layer",
    database: "Multi-tenant MariaDB/MySQL",
    frontend: "Vanilla JS/TypeScript + Tailwind CSS",
    middleware: "Oak-based stack",
    deployment: "Symbolic link prevention of version drift"
  },
  features: {
    core: [
      "Professional logging with ConsoleStyler",
      "Advanced middleware orchestration",
      "Database abstraction layer",
      "Multi-tenant architecture",
      "Environment configuration management"
    ],
    security: [
      "CORS configuration",
      "Security headers middleware",
      "Request validation",
      "Admin authentication",
      "Input sanitization"
    ],
    performance: [
      "Performance monitoring",
      "Health check endpoints",
      "Static file caching",
      "Gzip compression support",
      "Request/response logging"
    ],
    development: [
      "Framework integrity validation",
      "Professional banner display",
      "Graceful shutdown handlers",
      "Error handling system",
      "Symbolic link management"
    ]
  },
  philosophy: [
    "Elegant Simplicity - sophisticated architecture through simple patterns",
    "Local-first architecture for business sovereignty",
    "AI-augmented development workflow",
    "Thin routers, fat controllers",
    "Service layer for business logic",
    "Models for data access patterns"
  ]
};

/**
 * Framework Integrity & Version Management
 * Framework version information and validation utilities
 */
export {
  getFrameworkVersion,
  validateFrameworkIntegrity,
} from "./utils/index.ts";

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

// =============================================================================
// MODULE DOCUMENTATION
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
 *   frameworkConfig,
 *
 *   // Framework Utilities
 *   DEFAULT_MIME_TYPES,
 *   displayFrameworkBanner,
 *   registerSignalHandlers,
 *   registerErrorHandlers,
 *   DENOGENESIS_METADATA
 * } from "./mod.ts";
 *
 * // Initialize framework
 * displayFrameworkBanner();
 * registerSignalHandlers();
 * registerErrorHandlers();
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
