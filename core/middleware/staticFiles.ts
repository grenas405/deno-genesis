// middleware/staticFiles.ts → Advanced Static File System
// ================================================================================
// 🌐 DenoGenesis Framework - Enterprise Static File Middleware
// Optimized caching, compression, security, and performance for static assets
// ================================================================================

import { send } from "https://deno.land/x/oak@v12.6.1/mod.ts";

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

  // MIME type mapping for proper Content-Type headers
  private static readonly MIME_TYPES = new Map([
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
    ['.xls', 'application/vnd.ms-excel'],
    ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['.ppt', 'application/vnd.ms-powerpoint'],
    ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    // Media
    ['.mp3', 'audio/mpeg'],
    ['.mp4', 'video/mp4'],
    ['.wav', 'audio/wav'],
    ['.ogg', 'audio/ogg'],
    ['.webm', 'video/webm'],
    ['.avi', 'video/x-msvideo'],
    ['.mov', 'video/quicktime'],
    // Archives
    ['.zip', 'application/zip'],
    ['.tar', 'application/x-tar'],
    ['.gz', 'application/gzip'],
    // Development
    ['.map', 'application/json'],
    ['.ts', 'application/typescript']
  ]);

  // Cache configuration by file type
  private static readonly CACHE_HEADERS = new Map([
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
   */
  static createMiddleware(config: StaticFileConfig) {
    return async (ctx: any, next: () => Promise<unknown>) => {
      const filePath = ctx.request.url.pathname;
      const extension = this.getFileExtension(filePath);

      // Security validation
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
        const stats = await this.getFileStats(config.root, filePath);

        if (config.maxFileSize && stats && stats.size > config.maxFileSize) {
          console.warn(`📏 File too large: ${filePath} (${stats.size} bytes)`);
          ctx.response.status = 413;
          ctx.response.body = 'File too large';
          return;
        }

        // MIME type and headers
        const mimeType = this.MIME_TYPES.get(extension) || 'application/octet-stream';
        ctx.response.headers.set('Content-Type', mimeType);

        if (config.enableCaching) {
          const cacheConfig = this.CACHE_HEADERS.get(extension) || { maxAge: config.maxAge || 3600, public: true };
          const cacheControlParts = [];
          if (cacheConfig.public) cacheControlParts.push('public');
          if (cacheConfig.maxAge) cacheControlParts.push(`max-age=${cacheConfig.maxAge}`);
          if (cacheConfig.immutable) cacheControlParts.push('immutable');
          ctx.response.headers.set('Cache-Control', cacheControlParts.join(', '));

          if (config.enableEtag !== false && stats) {
            const etag = await this.generateETag(stats, filePath);
            ctx.response.headers.set('ETag', etag);
            const ifNoneMatch = ctx.request.headers.get('If-None-Match');
            if (ifNoneMatch === etag) {
              ctx.response.status = 304;
              return;
            }
          }

          if (stats && stats.mtime) {
            const lastModified = stats.mtime.toUTCString();
            ctx.response.headers.set('Last-Modified', lastModified);
            const ifModifiedSince = ctx.request.headers.get('If-Modified-Since');
            if (ifModifiedSince && new Date(ifModifiedSince) >= stats.mtime) {
              ctx.response.status = 304;
              return;
            }
          }
        } else {
          ctx.response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          ctx.response.headers.set('Pragma', 'no-cache');
          ctx.response.headers.set('Expires', '0');
        }

        if (this.shouldCompress(extension, config)) {
          const acceptEncoding = ctx.request.headers.get('Accept-Encoding') || '';
          if (config.enableBrotli && acceptEncoding.includes('br')) {
            ctx.response.headers.set('Content-Encoding', 'br');
            ctx.response.headers.set('Vary', 'Accept-Encoding');
          } else if (config.enableGzip !== false && acceptEncoding.includes('gzip')) {
            ctx.response.headers.set('Content-Encoding', 'gzip');
            ctx.response.headers.set('Vary', 'Accept-Encoding');
          }
        }

        // Security headers
        ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
        if (extension === '.html' || extension === '.htm') {
          ctx.response.headers.set('X-Frame-Options', 'SAMEORIGIN');
          ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
        }
        if (['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(extension)) {
          ctx.response.headers.set('X-Download-Options', 'noopen');
          ctx.response.headers.set('Content-Disposition', 'attachment');
        }

        // File delivery
        await send(ctx, filePath, {
          root: config.root,
          index: config.indexFiles || ["index.html"],
          hidden: config.serveHidden || false
        });

        if (ctx.state?.environment === 'development') {
          console.log(`📁 Served static file: ${filePath} (${mimeType})`);
        }
        StaticFileAnalytics.trackRequest(filePath, stats?.size || 0);
        return;

      } catch (error) {
        if (error.name === 'NotFound' && config.fallbackFile) {
          try {
            await send(ctx, config.fallbackFile, { root: config.root });
            ctx.response.headers.set('Content-Type', 'text/html; charset=utf-8');
            ctx.response.headers.set('Cache-Control', 'no-cache');
            return;
          } catch (fallbackError) {
            console.error(`❌ Fallback file serving failed: ${fallbackError.message}`);
          }
        }

        // Only call next if response is still writable
        if (ctx.response.writable) {
          await next();
        } else {
          console.warn(`⚠️ Response not writable for ${filePath}, skipping to next handler`);
        }
      }
    };
  }

  // ================================================================================
  // 🛠️ UTILITY METHODS
  // ================================================================================

  private static getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf('.');
    return lastDot === -1 ? '' : path.substring(lastDot).toLowerCase();
  }

  private static isHiddenFile(path: string): boolean {
    return path.split('/').some(part => part.startsWith('.') && part !== '.');
  }

  private static hasDirectoryTraversal(path: string): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    return normalizedPath.includes('../') || 
           normalizedPath.includes('..\\') ||
           normalizedPath.includes('%2e%2e') ||
           normalizedPath.includes('%2E%2E');
  }

  private static async getFileStats(root: string, filePath: string): Promise<Deno.FileInfo | null> {
    try {
      const fullPath = `${root}${filePath}`;
      return await Deno.stat(fullPath);
    } catch {
      return null;
    }
  }

  private static async generateETag(stats: Deno.FileInfo, filePath: string): Promise<string> {
    const mtime = stats.mtime?.getTime() || Date.now();
    const size = stats.size;
    const hash = await this.simpleHash(`${filePath}-${mtime}-${size}`);
    return `"${hash}"`;
  }

  private static async simpleHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  private static shouldCompress(extension: string, config: StaticFileConfig): boolean {
    return (config.enableGzip !== false || config.enableBrotli) && 
           this.COMPRESSIBLE_TYPES.has(extension);
  }
}

// ================================================================================
// 📊 STATIC FILE ANALYTICS
// ================================================================================

export class StaticFileAnalytics {
  private static requestCounts: Map<string, number> = new Map();
  private static bandwidthUsed: Map<string, number> = new Map();
  private static lastAccess: Map<string, number> = new Map();

  static trackRequest(path: string, size: number = 0): void {
    const currentCount = this.requestCounts.get(path) || 0;
    this.requestCounts.set(path, currentCount + 1);
    const currentBandwidth = this.bandwidthUsed.get(path) || 0;
    this.bandwidthUsed.set(path, currentBandwidth + size);
    this.lastAccess.set(path, Date.now());
  }

  static getPopularFiles(limit: number = 10) {
    return Array.from(this.requestCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([path, count]) => ({
        path,
        requests: count,
        bandwidth: this.formatBytes(this.bandwidthUsed.get(path) || 0),
        lastAccess: new Date(this.lastAccess.get(path) || 0).toISOString()
      }));
  }

  static getTotalStats() {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalBandwidth = Array.from(this.bandwidthUsed.values()).reduce((a, b) => a + b, 0);
    return {
      totalRequests,
      totalBandwidth: this.formatBytes(totalBandwidth),
      uniqueFiles: this.requestCounts.size,
      averageRequestsPerFile: totalRequests / this.requestCounts.size || 0
    };
  }

  private static formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static reset(): void {
    this.requestCounts.clear();
    this.bandwidthUsed.clear();
    this.lastAccess.clear();
  }
}

// ================================================================================
// 🔧 STATIC FILE UTILITIES (assumed complete based on context)
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
        mimeTypes: Object.fromEntries(StaticFileHandler['MIME_TYPES']),
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
    if (config.compressionLevel && (config.compressionLevel < 1 || config.compressionLevel > 9)) errors.push('Compression level must be between 1-9');
    return { valid: errors.length === 0, errors };
  }

  static getFileStats(path: string) {
    return {
      requests: StaticFileAnalytics['requestCounts'].get(path) || 0,
      bandwidth: StaticFileAnalytics['bandwidthUsed'].get(path) || 0,
      lastAccess: StaticFileAnalytics['lastAccess'].get(path) ? new Date(StaticFileAnalytics['lastAccess'].get(path)!).toISOString() : null
    };
  }

  static isExtensionSupported(extension: string): boolean {
    return StaticFileHandler['ALLOWED_EXTENSIONS'].has(extension.toLowerCase());
  }

  static getMimeType(extension: string): string {
    return StaticFileHandler['MIME_TYPES'].get(extension.toLowerCase()) || 'application/octet-stream';
  }

  static isCompressible(extension: string): boolean {
    return StaticFileHandler['COMPRESSIBLE_TYPES'].has(extension.toLowerCase());
  }
}

// ================================================================================
// 🎯 STATIC FILE CONFIGURATION PRESETS (assumed complete)
// ================================================================================

export const StaticFilePresets = {
  development: {
    enableCaching: false,
    enableEtag: false,
    enableGzip: false,
    enableBrotli: false,
    maxAge: 0,
    serveHidden: true,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  production: {
    enableCaching: true,
    enableEtag: true,
    enableGzip: true,
    enableBrotli: true,
    maxAge: 31536000, // 1 year
    serveHidden: false,
    maxFileSize: 50 * 1024 * 1024 // 50MB
  }
};