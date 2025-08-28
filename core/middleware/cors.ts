// middleware/cors.ts → Dynamic CORS Management System
// ================================================================================
// 🌐 DenoGenesis Framework - Advanced CORS Middleware
// Environment-aware, security-focused, and performance-optimized CORS handling
// ================================================================================

import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// ================================================================================
// 🔧 CORS CONFIGURATION INTERFACE
// ================================================================================

export interface CorsConfig {
  environment: string;
  allowedOrigins: string[];
  developmentOrigins?: string[];
  credentials?: boolean;
  maxAge?: number;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// ================================================================================
// 🌍 CORS MIDDLEWARE FACTORY
// ================================================================================

export function createCorsMiddleware(config: CorsConfig) {
  // Combine allowed origins based on environment
  const allowedOrigins = [...config.allowedOrigins];

  // Add development origins if in development mode
  if (config.environment === 'development' && config.developmentOrigins) {
    allowedOrigins.push(...config.developmentOrigins);
  }

  // Create CORS analytics tracker
  const corsStats = new CorsAnalytics();

  return oakCors({
    origin: (ctx) => {
      const origin = ctx.request.headers.get('origin');
      const userAgent = ctx.request.headers.get('user-agent') || 'unknown';
      const method = ctx.request.method;

      // Track CORS request
      corsStats.trackRequest(origin, method, userAgent);

      // Allow same-origin requests (no origin header)
      if (!origin) {
        corsStats.trackSameOrigin();
        return true;
      }

      // Check against allowed origins
      const isAllowed = CorsValidator.isOriginAllowed(origin, allowedOrigins);

      if (isAllowed) {
        corsStats.trackAllowedOrigin(origin);
      } else {
        corsStats.trackBlockedOrigin(origin);

        // Enhanced logging for blocked origins
        if (config.environment === 'development') {
          console.warn(`⚠️ CORS: Origin not in allowlist: ${origin}`);
          console.warn(`   User-Agent: ${userAgent}`);
          console.warn(`   Method: ${method}`);
          console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
        } else {
          // Production logging (more secure, less verbose)
          console.warn(`🚨 CORS: Blocked origin: ${origin.substring(0, 50)}...`);
        }
      }

      return isAllowed ? origin : false;
    },

    credentials: config.credentials ?? true,

    optionsSuccessStatus: config.optionsSuccessStatus ?? 200,

    maxAge: config.maxAge ?? 86400, // 24 hours default

    methods: config.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
      'PATCH',
      'HEAD'
    ],

    allowedHeaders: config.allowedHeaders ?? [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-API-Key',
      'X-Client-Version',
      'X-Timestamp',
      'Accept',
      'Origin',
      'Cache-Control'
    ],

    exposedHeaders: config.exposedHeaders ?? [
      'X-Total-Count',
      'X-Request-ID',
      'X-Response-Time',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'Content-Range'
    ],

    preflightContinue: config.preflightContinue ?? false
  });
}

// ================================================================================
// 🔍 CORS VALIDATOR
// ================================================================================

export class CorsValidator {
  /**
   * Check if an origin is allowed based on the allowlist
   */
  static isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    // Exact match
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // Check for wildcard patterns
    for (const allowedOrigin of allowedOrigins) {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(origin)) {
          return true;
        }
      }

      // Check for subdomain patterns (*.example.com)
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        const originUrl = new URL(origin);
        if (originUrl.hostname.endsWith(domain)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate CORS configuration
   */
  static validateConfig(config: CorsConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check origins
    if (!config.allowedOrigins || config.allowedOrigins.length === 0) {
      errors.push('At least one allowed origin is required');
    }

    // Validate origin formats
    config.allowedOrigins.forEach(origin => {
      if (!this.isValidOriginFormat(origin)) {
        errors.push(`Invalid origin format: ${origin}`);
      }
    });

    // Check max age
    if (config.maxAge && config.maxAge < 0) {
      errors.push('Max age must be positive');
    }

    // Check methods
    if (config.allowedMethods) {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'];
      config.allowedMethods.forEach(method => {
        if (!validMethods.includes(method.toUpperCase())) {
          errors.push(`Invalid HTTP method: ${method}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if origin format is valid
   */
  private static isValidOriginFormat(origin: string): boolean {
    // Allow wildcard patterns
    if (origin.includes('*')) {
      return /^https?:\/\/\*\.[\w.-]+$/.test(origin) || origin === '*';
    }

    // Validate as URL
    try {
      new URL(origin);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if origin is potentially malicious
   */
  static isOriginSuspicious(origin: string): boolean {
    const suspiciousPatterns = [
      /localhost:\d{2,5}$/, // Non-standard localhost ports
      /\.ngrok\.io$/, // Tunneling services
      /\.localtunnel\.me$/,
      /\d+\.\d+\.\d+\.\d+/, // Raw IP addresses
      /[<>'"]/,  // Script injection attempts
      /javascript:/i,
      /data:/i,
      /file:/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(origin));
  }
}

// ================================================================================
// 📊 CORS ANALYTICS
// ================================================================================

export class CorsAnalytics {
  private requestCount = 0;
  private sameOriginCount = 0;
  private allowedOrigins = new Map<string, number>();
  private blockedOrigins = new Map<string, number>();
  private methodStats = new Map<string, number>();
  private userAgentStats = new Map<string, number>();
  private hourlyStats = new Map<string, number>();

  trackRequest(origin: string | null, method: string, userAgent: string): void {
    this.requestCount++;

    // Track method statistics
    const currentMethodCount = this.methodStats.get(method) || 0;
    this.methodStats.set(method, currentMethodCount + 1);

    // Track user agent (simplified)
    const simpleUA = this.simplifyUserAgent(userAgent);
    const currentUACount = this.userAgentStats.get(simpleUA) || 0;
    this.userAgentStats.set(simpleUA, currentUACount + 1);

    // Track hourly statistics
    const hour = new Date().getHours().toString().padStart(2, '0');
    const currentHourCount = this.hourlyStats.get(hour) || 0;
    this.hourlyStats.set(hour, currentHourCount + 1);
  }

  trackSameOrigin(): void {
    this.sameOriginCount++;
  }

  trackAllowedOrigin(origin: string): void {
    const currentCount = this.allowedOrigins.get(origin) || 0;
    this.allowedOrigins.set(origin, currentCount + 1);
  }

  trackBlockedOrigin(origin: string): void {
    const currentCount = this.blockedOrigins.get(origin) || 0;
    this.blockedOrigins.set(origin, currentCount + 1);

    // Check if origin is suspicious
    if (CorsValidator.isOriginSuspicious(origin)) {
      console.warn(`🚨 Suspicious CORS origin blocked: ${origin}`);
    }
  }

  getStats() {
    const allowedCount = Array.from(this.allowedOrigins.values()).reduce((a, b) => a + b, 0);
    const blockedCount = Array.from(this.blockedOrigins.values()).reduce((a, b) => a + b, 0);

    return {
      totalRequests: this.requestCount,
      sameOriginRequests: this.sameOriginCount,
      crossOriginRequests: allowedCount + blockedCount,
      allowedRequests: allowedCount,
      blockedRequests: blockedCount,
      blockRate: this.requestCount > 0 ?
        ((blockedCount / this.requestCount) * 100).toFixed(2) + '%' : '0%',

      topAllowedOrigins: this.getTopEntries(this.allowedOrigins, 5),
      topBlockedOrigins: this.getTopEntries(this.blockedOrigins, 5),
      methodDistribution: Object.fromEntries(this.methodStats),
      topUserAgents: this.getTopEntries(this.userAgentStats, 5),
      hourlyDistribution: Object.fromEntries(this.hourlyStats),

      timestamp: new Date().toISOString()
    };
  }

  getDetailedReport() {
    return {
      ...this.getStats(),
      allAllowedOrigins: Object.fromEntries(this.allowedOrigins),
      allBlockedOrigins: Object.fromEntries(this.blockedOrigins),
      securityInsights: this.generateSecurityInsights()
    };
  }

  private getTopEntries(map: Map<string, number>, limit: number) {
    return Array.from(map.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => ({ origin: key, requests: count }));
  }

  private simplifyUserAgent(userAgent: string): string {
    // Simplified user agent classification
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('bot') || userAgent.includes('crawler')) return 'Bot';
    if (userAgent.includes('curl')) return 'curl';
    if (userAgent.includes('Postman')) return 'Postman';
    return 'Other';
  }

  private generateSecurityInsights() {
    const insights = [];
    const stats = this.getStats();

    // High block rate warning
    const blockRate = parseFloat(stats.blockRate.replace('%', ''));
    if (blockRate > 20) {
      insights.push({
        level: 'warning',
        message: `High CORS block rate: ${blockRate}%`,
        suggestion: 'Review blocked origins for legitimate requests'
      });
    }

    // Suspicious patterns
    const suspiciousBlocked = Array.from(this.blockedOrigins.keys())
      .filter(origin => CorsValidator.isOriginSuspicious(origin));

    if (suspiciousBlocked.length > 0) {
      insights.push({
        level: 'security',
        message: `${suspiciousBlocked.length} suspicious origins blocked`,
        suggestion: 'Monitor for potential security threats'
      });
    }

    // Method distribution analysis
    const methods = Object.entries(stats.methodDistribution);
    const optionsCount = methods.find(([method]) => method === 'OPTIONS')?.[1] || 0;
    const totalNonOptions = this.requestCount - optionsCount;

    if (optionsCount > totalNonOptions * 2) {
      insights.push({
        level: 'performance',
        message: 'High preflight request ratio',
        suggestion: 'Consider optimizing CORS configuration to reduce preflight requests'
      });
    }

    return insights;
  }

  reset(): void {
    this.requestCount = 0;
    this.sameOriginCount = 0;
    this.allowedOrigins.clear();
    this.blockedOrigins.clear();
    this.methodStats.clear();
    this.userAgentStats.clear();
    this.hourlyStats.clear();
  }
}

// ================================================================================
// 🎯 CORS CONFIGURATION PRESETS
// ================================================================================

export const CorsPresets = {
  /**
   * Development preset - permissive for local development
   */
  DEVELOPMENT: {
    allowedOrigins: ['http://localhost:3000'],
    developmentOrigins: [
      'http://localhost:3003',
      'http://localhost:8080',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:8080'
    ],
    credentials: true,
    maxAge: 300, // 5 minutes
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-API-Key'
    ]
  } as Partial<CorsConfig>,

  /**
   * Production preset - secure configuration
   */
  PRODUCTION: {
    allowedOrigins: [], // Must be explicitly configured
    credentials: true,
    maxAge: 86400, // 24 hours
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Request-ID',
      'X-Response-Time'
    ]
  } as Partial<CorsConfig>,

  /**
   * API preset - optimized for API endpoints
   */
  API: {
    credentials: false,
    maxAge: 3600, // 1 hour
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: [
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Request-ID'
    ]
  } as Partial<CorsConfig>,

  /**
   * CDN preset - for static assets served via CDN
   */
  CDN: {
    allowedOrigins: ['*'],
    credentials: false,
    maxAge: 604800, // 1 week
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Cache-Control',
      'If-Modified-Since',
      'If-None-Match'
    ]
  } as Partial<CorsConfig>
};

// ================================================================================
// 🛠️ CORS UTILITIES
// ================================================================================

export class CorsUtils {
  /**
   * Create CORS middleware with analytics
   */
  static createAnalyticsEnabledCors(config: CorsConfig) {
    const analytics = new CorsAnalytics();
    const middleware = createCorsMiddleware(config);

    return {
      middleware,
      analytics,
      getStats: () => analytics.getStats(),
      getReport: () => analytics.getDetailedReport()
    };
  }

  /**
   * Test CORS configuration
   */
  static testConfiguration(config: CorsConfig, testOrigins: string[]) {
    const results = testOrigins.map(origin => ({
      origin,
      allowed: CorsValidator.isOriginAllowed(origin, config.allowedOrigins),
      suspicious: CorsValidator.isOriginSuspicious(origin)
    }));

    return {
      results,
      summary: {
        total: testOrigins.length,
        allowed: results.filter(r => r.allowed).length,
        blocked: results.filter(r => !r.allowed).length,
        suspicious: results.filter(r => r.suspicious).length
      }
    };
  }

  /**
   * Generate CORS configuration from domain list
   */
  static generateConfig(domains: string[], environment: string = 'production'): CorsConfig {
    const allowedOrigins = domains.flatMap(domain => [
      `https://${domain}`,
      `https://www.${domain}`
    ]);

    const baseConfig: CorsConfig = {
      environment,
      allowedOrigins,
      credentials: true,
      maxAge: environment === 'production' ? 86400 : 300
    };

    if (environment === 'development') {
      baseConfig.developmentOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ];
    }

    return baseConfig;
  }
}

// ================================================================================
// 🚀 EXPORT ALL CORS COMPONENTS
// ================================================================================

export default {
  createCorsMiddleware,
  CorsValidator,
  CorsAnalytics,
  CorsPresets,
  CorsUtils
};
