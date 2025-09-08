/**
 * =============================================================================
 * DenoGenesis Framework - MIME Type Definitions (utils/mime-types.ts)
 * =============================================================================
 * 
 * Unix Philosophy Implementation:
 * 1. Do One Thing Well: MIME type mappings ONLY
 * 2. Store Data in Flat Text Files: Simple, parseable configuration
 * 3. Make Everything a Filter: Pure data structure for transformation
 * 4. Avoid Captive User Interfaces: Returns structured data
 * 5. Leverage Software Leverage: Composable with static file servers
 * 
 * This module provides centralized MIME type mappings for static file serving.
 * It contains no behavior - only configuration data that other modules consume.
 * 
 * @module MimeTypes
 * @follows Unix Philosophy: Single responsibility (file type mappings)
 * @permissions None required (pure data)
 * @version 1.0.0
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

// =============================================================================
// UNIX PRINCIPLE: DO ONE THING WELL
// =============================================================================

/**
 * MIME Type Configuration - Pure Data Structure
 * 
 * Unix Philosophy: Store data in flat, parseable formats
 * This is configuration data, not behavior - keeps concerns separated
 * 
 * Used by:
 * - Static file middleware for Content-Type headers
 * - File upload validation systems
 * - Content negotiation in APIs
 * - Development servers for proper file serving
 * 
 * @readonly Immutable configuration object
 * @coverage Complete web asset coverage for static file serving
 * 
 * @example
 * ```typescript
 * import { DEFAULT_MIME_TYPES } from "./utils/mime-types.ts";
 * 
 * const extension = ".js";
 * const contentType = DEFAULT_MIME_TYPES[extension];
 * // contentType = "application/javascript"
 * 
 * // Usage in middleware:
 * ctx.response.headers.set('Content-Type', DEFAULT_MIME_TYPES[fileExtension]);
 * ```
 */
export const DEFAULT_MIME_TYPES = {
  // Core Web Technologies
  ".html": "text/html",
  ".htm": "text/html", 
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".ts": "application/typescript",
  ".jsx": "text/jsx",
  ".tsx": "text/tsx",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  
  // Image Formats
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  
  // Modern Font Formats
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
  
  // Document Types
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".rtf": "application/rtf",
  
  // Archive Formats
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  
  // Media Files
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  
  // Configuration Formats
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".toml": "application/toml",
  ".wasm": "application/wasm",
  ".map": "application/json",
} as const;

// =============================================================================
// UNIX PRINCIPLE: MAKE EVERYTHING A FILTER
// =============================================================================

/**
 * Get MIME type for file extension
 * 
 * Pure function that transforms file extension to MIME type.
 * Returns undefined for unknown extensions instead of throwing.
 * 
 * @param extension File extension (with or without leading dot)
 * @returns MIME type string or undefined if not found
 * 
 * @example
 * ```typescript
 * getMimeType('.js')     // 'application/javascript'
 * getMimeType('js')      // 'application/javascript'  
 * getMimeType('.unknown') // undefined
 * ```
 */
export function getMimeType(extension: string): string | undefined {
  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return DEFAULT_MIME_TYPES[normalizedExtension as keyof typeof DEFAULT_MIME_TYPES];
}

/**
 * Get all supported file extensions
 * 
 * Returns array of supported extensions for validation or UI purposes.
 * 
 * @returns Array of file extensions (with leading dots)
 * 
 * @example
 * ```typescript
 * const extensions = getSupportedExtensions();
 * // ['.html', '.css', '.js', ...]
 * 
 * const isSupported = extensions.includes('.js'); // true
 * ```
 */
export function getSupportedExtensions(): readonly string[] {
  return Object.keys(DEFAULT_MIME_TYPES);
}

/**
 * Check if file extension is supported
 * 
 * Pure predicate function for file extension validation.
 * 
 * @param extension File extension (with or without leading dot)
 * @returns True if extension has a defined MIME type
 * 
 * @example
 * ```typescript
 * isExtensionSupported('.js')      // true
 * isExtensionSupported('css')      // true
 * isExtensionSupported('.unknown') // false
 * ```
 */
export function isExtensionSupported(extension: string): boolean {
  return getMimeType(extension) !== undefined;
}

// =============================================================================
// UNIX PRINCIPLE: STORE DATA IN FLAT TEXT FILES (METADATA)
// =============================================================================

/**
 * MIME Type Module Metadata
 * 
 * Information about this module that can be written to flat files
 * for version tracking, monitoring, and deployment verification.
 */
export const MIME_TYPES_METADATA = {
  /** Semantic version of MIME type definitions */
  version: "1.0.0",
  /** Number of supported file types */
  supportedTypes: Object.keys(DEFAULT_MIME_TYPES).length,
  /** Module classification */
  classification: "configuration",
  /** Unix Philosophy compliance */
  philosophy: {
    singlePurpose: true,
    pureData: true,
    filterFunctions: true,
    composable: true,
  },
  /** Categories of supported files */
  categories: [
    "web_technologies",
    "images", 
    "fonts",
    "documents",
    "archives",
    "media",
    "configuration"
  ],
  /** Last updated timestamp */
  lastUpdated: "2025-09-08",
} as const;

// =============================================================================
// UNIX PRINCIPLE: LEVERAGE SOFTWARE LEVERAGE
// =============================================================================

/**
 * This module can be imported and used by:
 * - Static file servers (Oak send middleware)
 * - File upload validation systems
 * - Content negotiation APIs
 * - Development tools and testing frameworks
 * - Deployment scripts for asset verification
 * - Monitoring systems for file type analytics
 * 
 * Pure data + pure functions = maximum composability
 */