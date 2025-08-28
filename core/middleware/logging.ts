// middleware/logging.ts → Advanced Logging System
// ================================================================================
// 📝 DenoGenesis Framework - Enterprise Request/Response Logging
// Comprehensive logging with sanitization, performance tracking, and formatting
// ================================================================================

export interface LoggingConfig {
  environment: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRequests: boolean;
  logResponses?: boolean;
}

// ================================================================================
// 🎨 CONSOLE STYLING UTILITIES
// ================================================================================

class LoggerStyler {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };

  static colorize(text: string, color: keyof typeof LoggerStyler.colors): string {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  static getMethodColor(method: string): keyof typeof LoggerStyler.colors {
    switch (method.toUpperCase()) {
      case 'GET': return 'green';
      case 'POST': return 'blue';
      case 'PUT': return 'yellow';
      case 'DELETE': return 'red';
      case 'PATCH': return 'magenta';
      default: return 'cyan';
    }
  }

  static getStatusColor(status: number): keyof typeof LoggerStyler.colors {
    if (status >= 200 && status < 300) return 'green';
    if (status >= 300 && status < 400) return 'yellow';
    if (status >= 400 && status < 500) return 'red';
    if (status >= 500) return 'magenta';
    return 'gray';
  }
}

// ================================================================================
// 🛡️ HEADER SANITIZATION UTILITIES
// ================================================================================

class HeaderSanitizer {
  private static sensitiveHeaders = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'x-refresh-token',
    'proxy-authorization',
    'www-authenticate'
  ]);

  static sanitizeHeaders(headers: Headers | Record<string, string> | undefined): Record<string, string> {
    if (!headers) return {};

    const sanitized: Record<string, string> = {};

    try {
      // Handle Headers object from Oak
      if (headers instanceof Headers) {
        for (const [key, value] of headers.entries()) {
          sanitized[key.toLowerCase()] = this.sanitizeValue(key.toLowerCase(), value);
        }
      }
      // Handle plain object
      else if (typeof headers === 'object') {
        for (const [key, value] of Object.entries(headers)) {
          sanitized[key.toLowerCase()] = this.sanitizeValue(key.toLowerCase(), value);
        }
      }
    } catch (error) {
      console.warn('Header sanitization failed:', error.message);
      return { 'sanitization-error': 'Failed to process headers' };
    }

    return sanitized;
  }

  private static sanitizeValue(key: string, value: string): string {
    if (this.sensitiveHeaders.has(key.toLowerCase())) {
      if (value.length > 10) {
        return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      }
      return '[HIDDEN]';
    }
    return value;
  }
}

// ================================================================================
// 📊 LOGGER CLASS
// ================================================================================

export class Logger {
  private config: LoggingConfig;
  private requestCount = 0;

  constructor(config: LoggingConfig) {
    this.config = config;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  private formatTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.log(
        LoggerStyler.colorize(`[${this.formatTimestamp()}]`, 'gray'),
        LoggerStyler.colorize('DEBUG', 'cyan'),
        message,
        meta ? LoggerStyler.colorize(JSON.stringify(meta, null, 2), 'dim') : ''
      );
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.log(
        LoggerStyler.colorize(`[${this.formatTimestamp()}]`, 'gray'),
        LoggerStyler.colorize('INFO', 'blue'),
        message,
        meta ? LoggerStyler.colorize(JSON.stringify(meta, null, 2), 'dim') : ''
      );
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(
        LoggerStyler.colorize(`[${this.formatTimestamp()}]`, 'gray'),
        LoggerStyler.colorize('WARN', 'yellow'),
        message,
        meta ? LoggerStyler.colorize(JSON.stringify(meta, null, 2), 'dim') : ''
      );
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(
        LoggerStyler.colorize(`[${this.formatTimestamp()}]`, 'gray'),
        LoggerStyler.colorize('ERROR', 'red'),
        message,
        meta ? LoggerStyler.colorize(JSON.stringify(meta, null, 2), 'dim') : ''
      );
    }
  }

  logRequest(ctx: any, responseTime?: number): void {
    if (!this.config.logRequests) return;

    this.requestCount++;
    const method = ctx.request.method;
    const url = ctx.request.url.pathname + (ctx.request.url.search || '');
    const status = ctx.response.status || 0;
    const requestId = ctx.state?.requestId || 'unknown';

    // Format the log message
    const methodColored = LoggerStyler.colorize(method.padEnd(6), LoggerStyler.getMethodColor(method));
    const statusColored = LoggerStyler.colorize(status.toString(), LoggerStyler.getStatusColor(status));
    const timeInfo = responseTime ? LoggerStyler.colorize(`${responseTime}ms`, 'gray') : '';
    const requestIdInfo = LoggerStyler.colorize(`[${requestId}]`, 'dim');

    console.log(
      LoggerStyler.colorize(`[${this.formatTimestamp()}]`, 'gray'),
      LoggerStyler.colorize('REQ', 'cyan'),
      methodColored,
      url,
      statusColored,
      timeInfo,
      requestIdInfo
    );

    // Log request details in debug mode
    if (this.config.logLevel === 'debug') {
      const headers = HeaderSanitizer.sanitizeHeaders(ctx.request.headers);
      const userAgent = headers['user-agent'] || 'Unknown';
      const ip = ctx.request.ip || headers['x-forwarded-for'] || headers['x-real-ip'] || 'Unknown';

      this.debug('Request Details', {
        requestId,
        ip,
        userAgent,
        headers: Object.keys(headers).length > 0 ? headers : 'None',
        query: ctx.request.url.searchParams ? Object.fromEntries(ctx.request.url.searchParams) : {}
      });
    }
  }

  logResponse(ctx: any, responseTime?: number): void {
    if (!this.config.logResponses) return;

    const method = ctx.request.method;
    const url = ctx.request.url.pathname;
    const status = ctx.response.status || 0;
    const requestId = ctx.state?.requestId || 'unknown';

    // Log response details
    const statusColored = LoggerStyler.colorize(status.toString(), LoggerStyler.getStatusColor(status));
    const timeInfo = responseTime ? LoggerStyler.colorize(`${responseTime}ms`, 'gray') : '';

    console.log(
      LoggerStyler.colorize(`[${this.formatTimestamp()}]`, 'gray'),
      LoggerStyler.colorize('RES', 'magenta'),
      LoggerStyler.colorize(method.padEnd(6), LoggerStyler.getMethodColor(method)),
      url,
      statusColored,
      timeInfo,
      LoggerStyler.colorize(`[${requestId}]`, 'dim')
    );

    // Log response headers in debug mode
    if (this.config.logLevel === 'debug') {
      const responseHeaders = HeaderSanitizer.sanitizeHeaders(ctx.response.headers);
      
      this.debug('Response Details', {
        requestId,
        status,
        headers: Object.keys(responseHeaders).length > 0 ? responseHeaders : 'None',
        contentType: responseHeaders['content-type'] || 'Not set',
        contentLength: responseHeaders['content-length'] || 'Unknown'
      });
    }
  }

  getStats() {
    return {
      totalRequests: this.requestCount,
      logLevel: this.config.logLevel,
      requestLogging: this.config.logRequests,
      responseLogging: this.config.logResponses || false
    };
  }
}

// ================================================================================
// 🔄 LOGGING MIDDLEWARE FACTORY
// ================================================================================

export function createLoggingMiddleware(config: LoggingConfig) {
  const logger = new Logger(config);

  // Log middleware initialization
  if (config.environment === 'development') {
    logger.info('🔍 Request/Response logging initialized', {
      logLevel: config.logLevel,
      requestLogging: config.logRequests,
      responseLogging: config.logResponses || false
    });
  }

  return async (ctx: any, next: () => Promise<unknown>) => {
    const start = Date.now();

    // Log incoming request
    if (config.logRequests) {
      logger.logRequest(ctx);
    }

    try {
      await next();

      const responseTime = Date.now() - start;

      // Log outgoing response
      if (config.logResponses) {
        logger.logResponse(ctx, responseTime);
      }

      // Log slow requests as warnings
      if (responseTime > 1000) {
        logger.warn(`Slow request detected: ${ctx.request.method} ${ctx.request.url.pathname}`, {
          responseTime: `${responseTime}ms`,
          requestId: ctx.state?.requestId
        });
      }

    } catch (error) {
      const responseTime = Date.now() - start;

      // Log error
      logger.error(`Request failed: ${ctx.request.method} ${ctx.request.url.pathname}`, {
        error: error.message,
        responseTime: `${responseTime}ms`,
        requestId: ctx.state?.requestId,
        stack: config.environment === 'development' ? error.stack : undefined
      });

      // Re-throw the error to be handled by error middleware
      throw error;
    }
  };
}

// ================================================================================
// 🛠️ LOGGING UTILITIES
// ================================================================================

export class LoggingUtils {
  static createRequestLogger(config: LoggingConfig) {
    return new Logger(config);
  }

  static sanitizeObject(obj: any, maxDepth = 3, currentDepth = 0): any {
    if (currentDepth >= maxDepth || obj === null || obj === undefined) {
      return '[Max Depth]';
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth, currentDepth + 1));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys
      if (['password', 'token', 'secret', 'key', 'auth'].some(sensitive => 
        key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[HIDDEN]';
      } else {
        sanitized[key] = this.sanitizeObject(value, maxDepth, currentDepth + 1);
      }
    }

    return sanitized;
  }

  static formatLogMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` ${JSON.stringify(LoggingUtils.sanitizeObject(meta))}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  }
}

// ================================================================================
// 🚀 EXPORT UTILITIES
// ================================================================================

export default {
  Logger,
  createLoggingMiddleware,
  HeaderSanitizer,
  LoggingUtils
};