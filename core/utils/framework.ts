/**
 * =============================================================================
 * DenoGenesis Framework - Core Utilities (core/utils/framework.ts)
 * =============================================================================
 *
 * Framework utility functions, constants, and configuration.
 *
 * @module FrameworkUtils
 * @version 1.0.0
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

import {
  VERSION,
  BUILD_DATE,
  BUILD_HASH
} from "../../../core/config/env.ts";

// =============================================================================
// MIME TYPES
// =============================================================================

export const DEFAULT_MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.htm', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.mjs', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.bmp', 'image/bmp'],
  ['.tiff', 'image/tiff'],
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.eot', 'application/vnd.ms-fontobject'],
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.mp3', 'audio/mpeg'],
  ['.mp4', 'video/mp4'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.zip', 'application/zip'],
  ['.tar', 'application/x-tar'],
  ['.gz', 'application/gzip'],
]);

// =============================================================================
// FRAMEWORK CONFIGURATION
// =============================================================================

export const frameworkConfig = {
  name: "DenoGenesis",
  version: "1.4.0-enterprise",
  description: "Local-First Digital Sovereignty Framework",
  author: "Pedro M. Dominguez - Dominguez Tech Solutions LLC",
  license: "AGPL-3.0",

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

// =============================================================================
// LEGACY METADATA
// =============================================================================

export const DENOGENESIS_METADATA = {
  version: frameworkConfig.version,
  buildDate: BUILD_DATE || new Date().toISOString(),
  buildHash: BUILD_HASH || 'dev',
  frameworkName: frameworkConfig.name,
  description: frameworkConfig.description,
  author: frameworkConfig.author,
  license: frameworkConfig.license,
  timestamp: Date.now()
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function displayFrameworkBanner(version?: string, buildDate?: string): void {
  const frameworkVersion = version || frameworkConfig.version;
  const date = buildDate || new Date().toISOString().split('T')[0];

  console.log("\n" + "=".repeat(80));
  console.log("\x1b[35m%s\x1b[0m", "✨ DENOGENESIS FRAMEWORK STARTUP ✨");
  console.log("=".repeat(80));
  console.log("\x1b[36m%s\x1b[0m", `🚀 ${frameworkConfig.name} v${frameworkVersion}`);
  console.log("\x1b[33m%s\x1b[0m", `📅 Build Date: ${date}`);
  console.log("\x1b[32m%s\x1b[0m", `🏗️  ${frameworkConfig.description}`);
  console.log("\x1b[37m%s\x1b[0m", `👤 ${frameworkConfig.author}`);
  console.log("\x1b[34m%s\x1b[0m", `⚡ Runtime: ${frameworkConfig.runtime.platform} ${Deno.version.deno}`);
  console.log("=".repeat(80));
}

export function registerSignalHandlers(version?: string, cleanup?: () => Promise<void>): void {
  const handleShutdown = async (signal: string) => {
    console.log("\x1b[33m%s\x1b[0m", `\n🛑 Received ${signal}, shutting down DenoGenesis ${version || frameworkConfig.version} gracefully...`);

    if (cleanup) {
      try {
        await cleanup();
      } catch (error) {
        console.log("\x1b[31m%s\x1b[0m", `❌ Error during cleanup: ${error.message}`);
      }
    }

    console.log("\x1b[32m%s\x1b[0m", `✅ DenoGenesis Framework shutdown complete`);
    Deno.exit(0);
  };

  Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
  Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

  globalThis.addEventListener("unhandledrejection", (event) => {
    console.log("\x1b[31m%s\x1b[0m", `❌ Unhandled promise rejection: ${event.reason}`);
    event.preventDefault();
  });
}

export function registerErrorHandlers(version?: string): void {
  const frameworkVersion = version || frameworkConfig.version;

  globalThis.addEventListener("error", (event) => {
    console.log("\x1b[31m%s\x1b[0m", `❌ Uncaught exception in DenoGenesis ${frameworkVersion}:`);
    console.log("\x1b[31m%s\x1b[0m", `   Error: ${event.error?.message || event.message}`);
    console.log("\x1b[31m%s\x1b[0m", `   Stack: ${event.error?.stack || 'No stack trace available'}`);
  });

  globalThis.addEventListener("unhandledrejection", (event) => {
    console.log("\x1b[31m%s\x1b[0m", `❌ Unhandled promise rejection in DenoGenesis ${frameworkVersion}:`);
    console.log("\x1b[31m%s\x1b[0m", `   Reason: ${event.reason}`);
    event.preventDefault();
  });
}
