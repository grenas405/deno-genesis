// middleware/staticFiles.ts → Advanced Static File System
// ================================================================================
// 🌐 DenoGenesis Framework - Enterprise Static File Middleware
// Optimized caching, compression, security, and performance for static assets
// ================================================================================

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { DEFAULT_MIME_TYPES } from "../utils/mime-types.ts";

// ================================================================================
// 🔧 STATIC FILE CONFIGURATION
// ================================================================================

export interface StaticFileConfig {
  root: string;
  enableCaching: boolean;
  maxAge?: number;
  compressionLevel?: number;
  enableGzip?: boolean;
  enableBrotli?: boolean;
  enableEtag?: boolean;
  indexFiles?: string[];
  fallbackFile?: string;
  serveHidden?: boolean;
  maxFileSize?: number; // in bytes
}

interface CacheConfig {
  maxAge: number;
  public: boolean;
  immutable?: boolean;
}

// ================================================================================
// 🎯 STATIC FILE HANDLER CLASS
// ================================================================================

export class StaticFileHandler {
  // Supported file extensions with security validation
  private static readonly ALLOWED_EXTENSIONS = new Set([
    // Web assets
    '.html', '.htm', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.md',
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff',
    // Fonts
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    // Documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    // Media
    '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.avi', '.mov',
    // Archives (be careful with these)
    '.zip', '.tar', '.gz',
    // Development
    '.map', '.ts' // Source maps and TypeScript files for development
  ]);

  // Cache configuration by file type
  private static readonly CACHE_HEADERS = new Map<string, CacheConfig>([
    // Long-term caching for immutable assets
    ['.css', { maxAge: 31536000, public: true, immutable: true }], // 1 year
    ['.js', { maxAge: 31536000, public: true, immutable: true }],
    ['.mjs', { maxAge: 31536000, public: true, immutable: true }],
    // Medium-term caching for images
    ['.png', { maxAge: 2592000, public: true }], // 30 days
    ['.jpg', { maxAge: 2592000, public: true }],
    ['.jpeg', { maxAge: 2592000, public: true }],
    ['.gif', { maxAge: 2592000, public: true }],
    ['.webp', { maxAge: 2592000, public: true }],
    ['.svg', { maxAge: 2592000, public: true }],
    // Long-term caching for fonts
    ['.ttf', { maxAge: 31536000, public: true, immutable: true }], // 1 year
    ['.otf', { maxAge: 31536000, public: true, immutable: true }],
    ['.woff', { maxAge: 31536000, public: true, immutable: true }],
    ['.woff2', { maxAge: 31536000, public: true, immutable: true }],
    ['.eot', { maxAge: 31536000, public: true, immutable: true }],
    // Short-term caching for HTML (to allow updates)
    ['.html', { maxAge: 3600, public: true }], // 1 hour
    ['.htm', { maxAge: 3600, public: true }],
    // Medium-term for other assets
    ['.ico', { maxAge: 604800, public: true }], // 1 week
    ['.json', { maxAge: 3600, public: true }], // 1 hour
    ['.xml', { maxAge: 3600, public: true }],
    ['.txt', { maxAge: 3600, public: true }],
    ['.md', { maxAge: 3600, public: true }],
    // No caching for source maps in production
    ['.map', { maxAge: 0, public: false }]
  ]);

  // Files that support compression
  private static readonly COMPRESSIBLE_TYPES = new Set([
    '.html', '.htm', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.md', '.svg'
  ]);

  /**
   * Create static file middleware with advanced features
   * Unix Philosophy: Do one thing well - serve static files securely and efficiently
   */
  static createMiddleware(config: StaticFileConfig) {
    return async (ctx: Context, next: () => Promise<unknown>) => {
      const filePath = ctx.request.url.pathname;
      const extension = this.getFileExtension(filePath);

      // Security validation - Unix Philosophy: Fail fast
      if (!this.ALLOWED_EXTENSIONS.has(extension)) {
        await next();
        return;
      }
      
      if (!config.serveHidden && this.isHiddenFile(filePath)) {
        await next();
        return;
      }
      
      if (this.hasDirectoryTraversal(filePath)) {
        console.warn(`🚨 Directory traversal attempt blocked: ${filePath}`);
        ctx.response.status = 403;
        ctx.response.body = 'Forbidden';
        return;
      }

      try {
        // Handle index files if requesting a directory
        const resolvedPath = await this.resolveFilePath(config.root, filePath, config.indexFiles);
        if (!resolvedPath) {
          // Check for fallback file (SPA support)
          if (config.fallbackFile) {
            const fallbackPath = await this.resolveFallbackFile(config.root, config.fallbackFile);
            if (fallbackPath) {
              await this.serveFile(ctx, fallbackPath, config);
              return;
            }
          }
          await next();
          return;
        }

        const stats = await this.getFileStats(resolvedPath);
        if (!stats) {
          await next();
          return;
        }

        // File size validation
        if (config.maxFileSize && stats.size > config.maxFileSize) {
          console.warn(`📏 File too large: ${filePath} (${stats.size} bytes)`);
          ctx.response.status = 413;
          ctx.response.body = 'File too large';
          return;
        }

        // Check conditional requests before reading file
        if (await this.handleConditionalRequest(ctx, stats, resolvedPath, config)) {
          return; // 304 Not Modified response sent
        }

        // Serve the file
        await this.serveFile(ctx, resolvedPath, config, stats);

      } catch (error) {
        console.error(`❌ Static file error for ${filePath}:`, error);
        ctx.response.status = 500;
        ctx.response.body = 'Internal Server Error';
      }
    };
  }

  /**
   * Serve a file with proper headers and optimization
   */
  private static async serveFile(
    ctx: Context, 
    filePath: string, 
    config: StaticFileConfig, 
    stats?: Deno.FileInfo
  ) {
    const extension = this.getFileExtension(filePath);
    
    // Set MIME type using centralized mime-types utility
    const mimeType = DEFAULT_MIME_TYPES[extension] || 'application/octet-stream';
    ctx.response.headers.set('Content-Type', mimeType);

    // Set caching headers
    this.setCacheHeaders(ctx, extension, config);

    // Set ETag if enabled
    if (config.enableEtag !== false && stats) {
      const etag = await this.generateETag(stats, filePath);
      ctx.response.headers.set('ETag', etag);
    }

    // Set Last-Modified header
    if (stats && stats.mtime) {
      ctx.response.headers.set('Last-Modified', stats.mtime.toUTCString());
    }

    // Handle compression
    if (this.shouldCompress(extension, config)) {
      this.setCompressionHeaders(ctx, config);
    }

    // Security headers
    this.setSecurityHeaders(ctx, extension);

    // Read and send file
    const fileContent = await Deno.readFile(filePath);
    
    // Apply compression if needed
    const compressedContent = await this.compressContent(fileContent, ctx, config);
    
    ctx.response.body = compressedContent;
    ctx.response.status = 200;

    // Analytics tracking
    StaticFileAnalytics.recordRequest(filePath, fileContent.length);
  }

  /**
   * Handle conditional requests (304 Not Modified)
   */
  private static async handleConditionalRequest(
    ctx: Context, 
    stats: Deno.FileInfo, 
    filePath: string, 
    config: StaticFileConfig
  ): Promise<boolean> {
    // Check If-None-Match (ETag)
    if (config.enableEtag !== false) {
      const ifNoneMatch = ctx.request.headers.get('If-None-Match');
      if (ifNoneMatch) {
        const etag = await this.generateETag(stats, filePath);
        if (ifNoneMatch === etag) {
          ctx.response.status = 304;
          ctx.response.headers.set('ETag', etag);
          return true;
        }
      }
    }

    // Check If-Modified-Since
    const ifModifiedSince = ctx.request.headers.get('If-Modified-Since');
    if (ifModifiedSince && stats.mtime) {
      const requestTime = new Date(ifModifiedSince);
      if (requestTime >= stats.mtime) {
        ctx.response.status = 304;
        ctx.response.headers.set('Last-Modified', stats.mtime.toUTCString());
        return true;
      }
    }

    return false;
  }

  /**
   * Set appropriate cache headers based on file type and configuration
   */
  private static setCacheHeaders(ctx: Context, extension: string, config: StaticFileConfig) {
    if (config.enableCaching) {
      const cacheConfig = this.CACHE_HEADERS.get(extension) || { 
        maxAge: config.maxAge || 3600, 
        public: true 
      };
      
      const cacheControlParts = [];
      if (cacheConfig.public) cacheControlParts.push('public');
      if (cacheConfig.maxAge) cacheControlParts.push(`max-age=${cacheConfig.maxAge}`);
      if (cacheConfig.immutable) cacheControlParts.push('immutable');
      
      ctx.response.headers.set('Cache-Control', cacheControlParts.join(', '));
    } else {
      // Disable caching
      ctx.response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      ctx.response.headers.set('Pragma', 'no-cache');
      ctx.response.headers.set('Expires', '0');
    }
  }

  /**
   * Set compression headers based on client capabilities
   */
  private static setCompressionHeaders(ctx: Context, config: StaticFileConfig) {
    const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';
    
    if (config.enableBrotli && acceptEncoding.includes('br')) {
      ctx.response.headers.set('Content-Encoding', 'br');
      ctx.response.headers.set('Vary', 'Accept-Encoding');
    } else if (config.enableGzip !== false && acceptEncoding.includes('gzip')) {
      ctx.response.headers.set('Content-Encoding', 'gzip');
      ctx.response.headers.set('Vary', 'Accept-Encoding');
    }
  }

  /**
   * Set security headers for static files
   */
  private static setSecurityHeaders(ctx: Context, extension: string) {
    // Prevent content-type sniffing
    ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Specific security for executable content
    if (['.js', '.mjs'].includes(extension)) {
      ctx.response.headers.set('X-Frame-Options', 'DENY');
    }
    
    // SVG security
    if (extension === '.svg') {
      ctx.response.headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    }
  }

  /**
   * Compress content based on configuration and client capabilities
   */
  private static async compressContent(
    content: Uint8Array, 
    ctx: Context, 
    config: StaticFileConfig
  ): Promise<Uint8Array> {
    const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';
    
    // Check if compression is requested and supported
    if (config.enableBrotli && acceptEncoding.includes('br')) {
      // Note: Brotli compression would require additional dependency
      // For now, fall back to gzip
      return this.gzipCompress(content, config.compressionLevel || 6);
    } else if (config.enableGzip !== false && acceptEncoding.includes('gzip')) {
      return this.gzipCompress(content, config.compressionLevel || 6);
    }
    
    return content;
  }

  /**
   * GZIP compression utility
   */
  private static gzipCompress(content: Uint8Array, level: number): Uint8Array {
    // Note: This is a simplified implementation
    // In a production environment, you'd use proper compression libraries
    // For Deno, you could use: https://deno.land/x/compress
    
    // For now, return uncompressed content with a warning
    console.warn('⚠️ GZIP compression not implemented - add compression library');
    return content;
  }

  /**
   * Generate ETag for file caching
   */
  private static async generateETag(stats: Deno.FileInfo, filePath: string): Promise<string> {
    const data = `${stats.size}-${stats.mtime?.getTime() || 0}-${filePath}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `"${hashHex.substring(0, 16)}"`;
  }

  /**
   * Resolve file path, handling index files and directories
   */
  private static async resolveFilePath(
    root: string, 
    requestPath: string, 
    indexFiles?: string[]
  ): Promise<string | null> {
    const fullPath = this.joinPaths(root, requestPath);
    
    try {
      const stats = await Deno.stat(fullPath);
      
      if (stats.isFile) {
        return fullPath;
      }
      
      if (stats.isDirectory && indexFiles) {
        for (const indexFile of indexFiles) {
          const indexPath = this.joinPaths(fullPath, indexFile);
          try {
            const indexStats = await Deno.stat(indexPath);
            if (indexStats.isFile) {
              return indexPath;
            }
          } catch {
            // Continue to next index file
          }
        }
      }
    } catch {
      // File doesn't exist
    }
    
    return null;
  }

  /**
   * Resolve fallback file for SPA applications
   */
  private static async resolveFallbackFile(root: string, fallbackFile: string): Promise<string | null> {
    const fallbackPath = this.joinPaths(root, fallbackFile);
    
    try {
      const stats = await Deno.stat(fallbackPath);
      if (stats.isFile) {
        return fallbackPath;
      }
    } catch {
      // Fallback file doesn't exist
    }
    
    return null;
  }

  // ================================================================================
  // 🔧 UTILITY METHODS
  // ================================================================================

  private static getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot > 0 ? filePath.substring(lastDot).toLowerCase() : '';
  }

  private static isHiddenFile(filePath: string): boolean {
    return filePath.split('/').some(part => part.startsWith('.') && part !== '.');
  }

  private static hasDirectoryTraversal(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return normalized.includes('../') || normalized.includes('..\\') || normalized.includes('..%2F');
  }

  private static joinPaths(root: string, path: string): string {
    // Normalize paths and join them safely
    const normalizedRoot = root.replace(/\\/g, '/').replace(/\/+$/, '');
    const normalizedPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${normalizedRoot}/${normalizedPath}`;
  }

  private static async getFileStats(filePath: string): Promise<Deno.FileInfo | null> {
    try {
      return await Deno.stat(filePath);
    } catch {
      return null;
    }
  }

  private static shouldCompress(extension: string, config: StaticFileConfig): boolean {
    return (config.enableGzip !== false || config.enableBrotli) && 
           this.COMPRESSIBLE_TYPES.has(extension);
  }
}

// ================================================================================
// 📊 ANALYTICS AND MONITORING
// ================================================================================

export class StaticFileAnalytics {
  private static requestCounts = new Map<string, number>();
  private static bandwidthUsed = new Map<string, number>();
  private static lastAccess = new Map<string, number>();

  static recordRequest(filePath: string, bytes: number) {
    this.requestCounts.set(filePath, (this.requestCounts.get(filePath) || 0) + 1);
    this.bandwidthUsed.set(filePath, (this.bandwidthUsed.get(filePath) || 0) + bytes);
    this.lastAccess.set(filePath, Date.now());
  }

  static getTotalStats() {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalBandwidth = Array.from(this.bandwidthUsed.values()).reduce((a, b) => a + b, 0);
    return { totalRequests, totalBandwidth };
  }

  static getPopularFiles(limit = 10) {
    return Array.from(this.requestCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([path, count]) => ({ path, requests: count, bandwidth: this.bandwidthUsed.get(path) || 0 }));
  }

  static reset() {
    this.requestCounts.clear();
    this.bandwidthUsed.clear();
    this.lastAccess.clear();
  }
}

// ================================================================================
// 🎯 CONFIGURATION PRESETS
// ================================================================================

export const StaticFilePresets = {
  development: {
    root: "./public",
    enableCaching: false,
    enableEtag: false,
    enableGzip: false,
    enableBrotli: false,
    maxAge: 0,
    serveHidden: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    indexFiles: ['index.html', 'index.htm']
  } as StaticFileConfig,

  production: {
    root: "./public",
    enableCaching: true,
    enableEtag: true,
    enableGzip: true,
    enableBrotli: true,
    maxAge: 31536000, // 1 year
    serveHidden: false,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    indexFiles: ['index.html', 'index.htm']
  } as StaticFileConfig,

  spa: {
    root: "./dist",
    enableCaching: true,
    enableEtag: true,
    enableGzip: true,
    enableBrotli: false,
    maxAge: 3600, // 1 hour for HTML, longer for assets
    serveHidden: false,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    indexFiles: ['index.html'],
    fallbackFile: 'index.html' // SPA fallback
  } as StaticFileConfig
};

// ================================================================================
// 🔧 UTILITY FUNCTIONS
// ================================================================================

export class StaticFileUtils {
  static async generateReport(rootPath: string): Promise<any> {
    const report = {
      timestamp: new Date().toISOString(),
      rootPath,
      analytics: StaticFileAnalytics.getTotalStats(),
      popularFiles: StaticFileAnalytics.getPopularFiles(),
      systemInfo: {
        supportedExtensions: Array.from(StaticFileHandler['ALLOWED_EXTENSIONS']),
        compressibleTypes: Array.from(StaticFileHandler['COMPRESSIBLE_TYPES'])
      }
    };
    return report;
  }

  static validateConfig(config: StaticFileConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.root) errors.push('Root path is required');
    if (config.maxFileSize && config.maxFileSize < 0) errors.push('Max file size must be positive');
    if (config.indexFiles && config.indexFiles.length === 0) errors.push('Index files array cannot be empty');
    if (config.compressionLevel && (config.compressionLevel < 1 || config.compressionLevel > 9)) {
      errors.push('Compression level must be between 1-9');
    }
    
    return { valid: errors.length === 0, errors };
  }

  static getFileStats(path: string) {
    return {
      requests: StaticFileAnalytics['requestCounts'].get(path) || 0,
      bandwidth: StaticFileAnalytics['bandwidthUsed'].get(path) || 0,
      lastAccess: StaticFileAnalytics['lastAccess'].get(path) 
        ? new Date(StaticFileAnalytics['lastAccess'].get(path)!).toISOString() 
        : null
    };
  }

  static isExtensionSupported(extension: string): boolean {
    return StaticFileHandler['ALLOWED_EXTENSIONS'].has(extension.toLowerCase());
  }

  static getMimeType(extension: string): string {
    return DEFAULT_MIME_TYPES[extension.toLowerCase()] || 'application/octet-stream';
  }

  static isCompressible(extension: string): boolean {
    return StaticFileHandler['COMPRESSIBLE_TYPES'].has(extension.toLowerCase());
  }
}

// ================================================================================
// 🌟 EXPORTS
// ================================================================================

export default StaticFileHandler;

// ================================================================================
// 🔧 MIDDLEWARE INDEX INTEGRATION
// ================================================================================

/**
 * Integration instructions for middleware/index.ts:
 * 
 * 1. Uncomment the StaticFileHandler import:
 *    import { StaticFileHandler, type StaticFileConfig } from "./staticFiles.ts";
 * 
 * 2. Add StaticFileConfig to the MiddlewareConfig interface (already present)
 * 
 * 3. Uncomment the static file middleware in createMiddlewareStack:
 *    // Add after health check middleware (position 7)
 *    StaticFileHandler.createMiddleware({
 *      root: config.staticFiles.root,
 *      enableCaching: config.staticFiles.enableCaching,
 *      maxAge: config.staticFiles.maxAge,
 *      enableGzip: config.staticFiles.enableGzip,
 *      enableBrotli: config.staticFiles.enableBrotli,
 *      serveHidden: false, // Security: never serve hidden files in production
 *      maxFileSize: 50 * 1024 * 1024, // 50MB limit
 *      indexFiles: ['index.html', 'index.htm']
 *    })
 * 
 * 4. Update the middleware stack logging:
 *    '7. Static File Serving' // UNCOMMENTED
 * 
 * 5. Export the StaticFileHandler and type:
 *    export { StaticFileHandler, type StaticFileConfig };
 * 
 * Example complete integration:
 */

/*
// In middleware/index.ts - Complete integration example:

import { StaticFileHandler, type StaticFileConfig } from "./staticFiles.ts";

export { StaticFileHandler, type StaticFileConfig };

// In createMiddlewareStack function, add after health check:
StaticFileHandler.createMiddleware({
  root: config.staticFiles.root,
  enableCaching: config.staticFiles.enableCaching,
  maxAge: config.staticFiles.maxAge,
  enableGzip: true,
  enableBrotli: false, // Can be enabled when compression library is added
  serveHidden: false,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  indexFiles: ['index.html', 'index.htm'],
  fallbackFile: config.staticFiles.fallbackFile // For SPA support
})

// Update middleware names array:
const middlewareNames = [
  '1. Performance Monitoring',
  '2. Error Handling', 
  '3. Request Logging',
  '4. Security Headers',
  '5. CORS Configuration (Simple)',
  '6. Health Check',
  '7. Static File Serving' // ENABLED
];
*/
