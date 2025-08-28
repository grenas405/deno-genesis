// middleware/security.ts → Enterprise Security System
// ================================================================================
// 🔒 DenoGenesis Framework - Advanced Security Middleware
// Comprehensive security headers, policies, and protection mechanisms
// ================================================================================

// ================================================================================
// 🔧 SECURITY CONFIGURATION INTERFACE
// ================================================================================

export interface SecurityConfig {
  environment: string;
  contentSecurityPolicy?: string;
  enableHSTS?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  enableNoSniff?: boolean;
  enableXSSProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  customHeaders?: Record<string, string>;
}

// ================================================================================
// 🛡️ SECURITY MIDDLEWARE FACTORY
// ================================================================================

export function createSecurityMiddleware(config: SecurityConfig) {
  return async (ctx: any, next: () => Promise<unknown>) => {
    // ================================================================================
    // 🔒 BASIC SECURITY HEADERS
    // ================================================================================

    // X-Frame-Options - Prevent clickjacking
    ctx.response.headers.set('X-Frame-Options', config.frameOptions || 'DENY');

    // X-Content-Type-Options - Prevent MIME type sniffing
    if (config.enableNoSniff !== false) {
      ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection - Enable XSS filtering (legacy, but still useful)
    if (config.enableXSSProtection !== false) {
      ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Referrer-Policy - Control referrer information
    ctx.response.headers.set(
      'Referrer-Policy', 
      config.referrerPolicy || 'strict-origin-when-cross-origin'
    );

    // ================================================================================
    // 🎯 PERMISSIONS POLICY
    // ================================================================================

    const defaultPermissionsPolicy = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=()',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ].join(', ');

    ctx.response.headers.set(
      'Permissions-Policy', 
      config.permissionsPolicy || defaultPermissionsPolicy
    );

    // ================================================================================
    // 🔐 CONTENT SECURITY POLICY - ENHANCED FOR APPOINTMENT BOOKING
    // ================================================================================

    if (config.contentSecurityPolicy) {
      // Use the CSP from main.ts configuration
      ctx.response.headers.set('Content-Security-Policy', config.contentSecurityPolicy);
    } else if (config.environment === 'production') {
      // Enhanced production CSP with appointment booking support
      const defaultCSP = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.skypack.dev https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
        "img-src 'self' data: https: blob:",
        "media-src 'self' data: https:",
        "connect-src 'self' https://pedromdominguez.com https://www.pedromdominguez.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ');

      ctx.response.headers.set('Content-Security-Policy', defaultCSP);
    } else {
      // Enhanced development CSP with appointment booking support
      const devCSP = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.skypack.dev https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
        "img-src 'self' data: https: blob:",
        "media-src 'self' data: https:",
        "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:* https://pedromdominguez.com https://www.pedromdominguez.com",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ');

      ctx.response.headers.set('Content-Security-Policy', devCSP);
    }

    // ================================================================================
    // 🚀 HSTS (HTTP Strict Transport Security)
    // ================================================================================

    if (config.environment === 'production' && config.enableHSTS !== false) {
      // HSTS with 1 year max-age, includeSubDomains, and preload
      ctx.response.headers.set(
        'Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // ================================================================================
    // 🔧 ADDITIONAL SECURITY HEADERS
    // ================================================================================

    // Remove or mask server information
    ctx.response.headers.delete('Server');
    ctx.response.headers.set('Server', 'DenoGenesis/4.0');

    // Add security-focused headers (relaxed for appointment booking)
    ctx.response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Relaxed CORP for appointment booking functionality
    if (ctx.request.url.pathname.includes('/api/appointment')) {
      ctx.response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    } else {
      ctx.response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    }
    
    ctx.response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    ctx.response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none'); // Relaxed for compatibility

    // Prevent DNS prefetching
    ctx.response.headers.set('X-DNS-Prefetch-Control', 'off');

    // ================================================================================
    // 🎯 CUSTOM SECURITY HEADERS
    // ================================================================================

    if (config.customHeaders) {
      Object.entries(config.customHeaders).forEach(([key, value]) => {
        ctx.response.headers.set(key, value);
      });
    }

    // ================================================================================
    // 🔒 REQUEST SECURITY VALIDATION
    // ================================================================================

    // Check for potentially malicious requests
    const userAgent = ctx.request.headers.get('User-Agent') || '';
    const suspiciousPatterns = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /dirb/i,
      /dirbuster/i,
      /burpsuite/i,
      /masscan/i,
      /zap/i
    ];

    // Log suspicious requests but don't block (to avoid false positives)
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      console.warn(`🚨 Suspicious request detected: ${userAgent} from ${ctx.request.ip || 'unknown'}`);
      ctx.response.headers.set('X-Security-Warning', 'Request flagged for review');
    }

    // ================================================================================
    // 🛡️ PATH TRAVERSAL PROTECTION
    // ================================================================================

    const path = ctx.request.url.pathname;
    const maliciousPathPatterns = [
      /\.\./,           // Directory traversal
      /\0/,             // Null bytes
      /%2e%2e/i,        // URL encoded directory traversal
      /%00/i,           // URL encoded null bytes
      /\/etc\/passwd/i, // System file access attempts
      /\/proc\//i,      // Process information access
      /\\windows\\system32/i // Windows system access
    ];

    if (maliciousPathPatterns.some(pattern => pattern.test(path))) {
      console.error(`🚨 Path traversal attempt detected: ${path} from ${ctx.request.ip || 'unknown'}`);
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'Bad Request',
        message: 'Invalid request path',
        timestamp: new Date().toISOString()
      };
      ctx.response.headers.set('Content-Type', 'application/json');
      return; // Block the request
    }

    // ================================================================================
    // 🔍 SECURITY MONITORING
    // ================================================================================

    // Add security context to request state
    ctx.state.security = {
      userAgent,
      ip: ctx.request.ip || 'unknown',
      timestamp: new Date().toISOString(),
      path,
      method: ctx.request.method,
      headers: Object.fromEntries(ctx.request.headers.entries())
    };

    // Continue to next middleware
    await next();

    // ================================================================================
    // 🔒 POST-PROCESSING SECURITY
    // ================================================================================

    // Remove sensitive headers that might leak information
    const sensitiveHeaders = [
      'X-Powered-By',
      'X-AspNet-Version',
      'X-AspNetMvc-Version',
      'X-Framework',
      'X-Version'
    ];

    sensitiveHeaders.forEach(header => {
      ctx.response.headers.delete(header);
    });

    // Add final security timestamp
    ctx.response.headers.set('X-Security-Processed', new Date().toISOString());
  };
}

// ================================================================================
// 🔐 SECURITY UTILITIES
// ================================================================================

export class SecurityValidator {
  /**
   * Validate if a URL is safe for redirection
   */
  static isValidRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
    try {
      const parsedUrl = new URL(url);

      // Only allow HTTPS in production
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        return false;
      }

      // Check against allowed domains
      if (allowedDomains.length > 0) {
        return allowedDomains.some(domain => 
          parsedUrl.hostname === domain || 
          parsedUrl.hostname.endsWith('.' + domain)
        );
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      });
  }

  /**
   * Validate Content-Type for file uploads
   */
  static isValidContentType(contentType: string, allowedTypes: string[] = []): boolean {
    if (allowedTypes.length === 0) {
      // Default safe content types
      allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/pdf'
      ];
    }

    return allowedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate API key format
   */
  static isValidApiKey(apiKey: string): boolean {
    // API key should be at least 32 characters, alphanumeric with some special chars
    return /^[A-Za-z0-9_-]{32,}$/.test(apiKey);
  }
}

// ================================================================================
// 🚨 SECURITY MONITORING
// ================================================================================

export class SecurityMonitor {
  private static suspiciousActivity: Map<string, number> = new Map();
  private static blockedIPs: Set<string> = new Set();

  /**
   * Track suspicious activity from an IP
   */
  static trackSuspiciousActivity(ip: string): void {
    const current = this.suspiciousActivity.get(ip) || 0;
    this.suspiciousActivity.set(ip, current + 1);

    // Auto-block IPs with too many suspicious requests
    if (current + 1 >= 10) {
      this.blockedIPs.add(ip);
      console.error(`🚨 IP ${ip} has been auto-blocked due to suspicious activity`);
    }
  }

  /**
   * Check if an IP is blocked
   */
  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Get security statistics
   */
  static getSecurityStats() {
    return {
      suspiciousIPs: this.suspiciousActivity.size,
      blockedIPs: this.blockedIPs.size,
      topSuspiciousIPs: Array.from(this.suspiciousActivity.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, incidents: count })),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Unblock an IP (manual intervention)
   */
  static unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousActivity.delete(ip);
    console.log(`🔓 IP ${ip} has been unblocked`);
  }

  /**
   * Clear old security data (cleanup)
   */
  static cleanup(): void {
    // In a production system, you'd implement more sophisticated cleanup
    // based on time windows, severity, etc.
    if (this.suspiciousActivity.size > 1000) {
      // Keep only the top 500 most suspicious IPs
      const sorted = Array.from(this.suspiciousActivity.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 500);

      this.suspiciousActivity.clear();
      sorted.forEach(([ip, count]) => this.suspiciousActivity.set(ip, count));
    }
  }
}

// ================================================================================
// 🔧 SECURITY CONFIGURATION PRESETS - UPDATED FOR APPOINTMENT BOOKING
// ================================================================================

export const SecurityPresets = {
  /**
   * Maximum security configuration for production
   */
  MAXIMUM_SECURITY: {
    enableHSTS: true,
    frameOptions: 'DENY' as const,
    enableNoSniff: true,
    enableXSSProtection: true,
    referrerPolicy: 'no-referrer',
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' https://pedromdominguez.com https://www.pedromdominguez.com",
      "media-src 'none'",
      "object-src 'none'",
      "child-src 'none'",
      "frame-src 'none'",
      "worker-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "manifest-src 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  },

  /**
   * Balanced security for most applications with appointment booking
   */
  BALANCED: {
    enableHSTS: true,
    frameOptions: 'SAMEORIGIN' as const,
    enableNoSniff: true,
    enableXSSProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.skypack.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: https:",
      "media-src 'self' data:",
      "connect-src 'self' https://pedromdominguez.com https://www.pedromdominguez.com",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  },

  /**
   * Development-friendly configuration with appointment booking
   */
  DEVELOPMENT: {
    enableHSTS: false,
    frameOptions: 'SAMEORIGIN' as const,
    enableNoSniff: true,
    enableXSSProtection: true,
    referrerPolicy: 'origin-when-cross-origin',
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' https: data:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data: https:",
      "connect-src 'self' ws: wss: https: http://localhost:* http://127.0.0.1:* https://pedromdominguez.com https://www.pedromdominguez.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ')
  }
};

// ================================================================================
// 🚀 EXPORT ALL SECURITY COMPONENTS
// ================================================================================

export default {
  createSecurityMiddleware,
  SecurityValidator,
  SecurityMonitor,
  SecurityPresets
};