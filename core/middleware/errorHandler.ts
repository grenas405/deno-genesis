
// middleware/errorHandler.ts → Enterprise Error Management System
// ================================================================================
// 🛡️ DenoGenesis Framework - Advanced Error Handling Middleware
// Global error catching, structured responses, and intelligent error recovery
// ================================================================================

// ================================================================================
// 🔧 ERROR HANDLER CONFIGURATION
// ================================================================================

export interface ErrorConfig {
  environment: string;
  logErrors: boolean;
  logToFile: boolean;
  showStackTrace: boolean;
  includeRequestInfo?: boolean;
  customErrorMessages?: Record<string, string>;
  enableErrorReporting?: boolean;
  sanitizeErrors?: boolean;
}

// ================================================================================
// 🚨 ENHANCED ERROR CLASSES
// ================================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    requestId?: string
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field: string;
  public readonly value: any;

  constructor(message: string, field: string, value: any, requestId?: string) {
    super(message, 400, true, requestId);
    this.field = field;
    this.value = value;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', requestId?: string) {
    super(message, 401, true, requestId);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', requestId?: string) {
    super(message, 403, true, requestId);
  }
}

export class NotFoundError extends AppError {
  public readonly resource: string;

  constructor(resource: string, requestId?: string) {
    super(`${resource} not found`, 404, true, requestId);
    this.resource = resource;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, requestId?: string) {
    super('Rate limit exceeded', 429, true, requestId);
    this.retryAfter = retryAfter;
  }
}

export class DatabaseError extends AppError {
  public readonly query?: string;
  public readonly operation: string;

  constructor(message: string, operation: string, query?: string, requestId?: string) {
    super(message, 500, true, requestId);
    this.operation = operation;
    this.query = query;
  }
}

// ================================================================================
// 🛡️ MAIN ERROR HANDLER CLASS
// ================================================================================

export class ErrorHandler {
  private static errorCounts = new Map<string, number>();
  private static recentErrors: Array<{
    error: string;
    timestamp: number;
    requestId?: string;
    ip?: string;
  }> = [];

  /**
   * Handle uncaught exceptions (global error handler)
   */
  static async handleUncaughtError(error: Error, environment: string): Promise<void> {
    console.error(`💥 Uncaught Exception: ${error.message}`);
    console.error(error.stack);

    // Track error for analytics
    this.trackError(error);

    // Log to file in production
    if (environment === 'production') {
      try {
        await this.logErrorToFile(error, 'UNCAUGHT_EXCEPTION');
      } catch (logError) {
        console.error('Failed to log uncaught exception:', logError.message);
      }
    }

    // Send error to monitoring service if configured
    await this.reportError(error, { type: 'uncaught_exception', environment });

    console.log('🔄 Initiating graceful shutdown due to uncaught exception...');
    Deno.exit(1);
  }

  /**
   * Handle unhandled promise rejections
   */
  static async handleUnhandledRejection(reason: any): Promise<void> {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    console.error(`💥 Unhandled Promise Rejection: ${error.message}`);

    // Track error for analytics
    this.trackError(error);

    // Log to file but don't exit (rejections are less critical)
    try {
      await this.logErrorToFile(error, 'UNHANDLED_REJECTION');
    } catch (logError) {
      console.error('Failed to log unhandled rejection:', logError.message);
    }

    // Report to monitoring
    await this.reportError(error, { type: 'unhandled_rejection' });
  }

  /**
   * Track error for analytics
   */
  private static trackError(error: Error): void {
    const errorType = error.constructor.name;
    const current = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, current + 1);

    // Add to recent errors (keep last 100)
    this.recentErrors.push({
      error: error.message,
      timestamp: Date.now(),
      requestId: (error as any).requestId,
      ip: 'global' // Global errors don't have IP context
    });

    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }
  }

  /**
   * Log error to file with structured format
   */
  private static async logErrorToFile(error: Error, type: string): Promise<void> {
    try {
      // Ensure logs directory exists
      await Deno.mkdir('./logs', { recursive: true });

      const errorLog = {
        timestamp: new Date().toISOString(),
        type,
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof AppError && {
          statusCode: error.statusCode,
          isOperational: error.isOperational,
          requestId: error.requestId
        })
      };

      const logEntry = JSON.stringify(errorLog) + '\n';
      await Deno.writeTextFile('./logs/errors.log', logEntry, { append: true });
    } catch (fileError) {
      console.error('Failed to write error log:', fileError.message);
    }
  }

  /**
   * Report error to external monitoring service
   */
  private static async reportError(error: Error, context: any): Promise<void> {
    try {
      // This would integrate with services like Sentry, DataDog, etc.
      // For now, we'll just log the attempt
      if (Deno.env.get('ERROR_REPORTING_URL')) {
        console.log('📊 Error reported to monitoring service');
        // Implementation would go here
      }
    } catch (reportError) {
      console.error('Failed to report error to monitoring service:', reportError.message);
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats() {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
    const recentErrorsCount = this.recentErrors.filter(
      e => e.timestamp > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    ).length;

    return {
      totalErrors,
      recentErrors: recentErrorsCount,
      errorTypes: Object.fromEntries(this.errorCounts),
      topErrors: Array.from(this.errorCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      recentErrorSample: this.recentErrors.slice(-10),
      timestamp: new Date().toISOString()
    };
  }
}

// ================================================================================
// 🔄 ERROR MIDDLEWARE FACTORY
// ================================================================================

export function createErrorMiddleware(config: ErrorConfig) {
  return async (ctx: any, next: () => Promise<unknown>) => {
    try {
      await next();
    } catch (error) {
      await handleRequestError(ctx, error, config);
    }
  };
}

/**
 * Handle errors that occur during request processing
 */
async function handleRequestError(ctx: any, error: any, config: ErrorConfig): Promise<void> {
  const requestId = ctx.state.requestId || 'unknown';
  const ip = ctx.request.ip || 'unknown';

  // Ensure error is an Error instance
  const err = error instanceof Error ? error : new Error(String(error));

  // Log the error if configured
  if (config.logErrors) {
    console.error(`💥 Request Error [${requestId}]:`, err.message);

    if (config.showStackTrace && config.environment === 'development') {
      console.error(err.stack);
    }
  }

  // Log to file if configured
  if (config.logToFile) {
    try {
      await logRequestErrorToFile(err, ctx, requestId);
    } catch (logError) {
      console.error('Failed to log request error:', logError.message);
    }
  }

  // Track error analytics
  ErrorHandler['trackError'](err);
  ErrorHandler['recentErrors'].push({
    error: err.message,
    timestamp: Date.now(),
    requestId,
    ip
  });

  // Determine response status and message
  const { status, message, details } = determineErrorResponse(err, config);

  // Set response
  ctx.response.status = status;
  ctx.response.headers.set('Content-Type', 'application/json');

  // Build error response
  const errorResponse: any = {
    error: {
      message,
      type: err.name,
      timestamp: new Date().toISOString(),
      requestId
    }
  };

  // Add additional details based on configuration
  if (config.includeRequestInfo) {
    errorResponse.request = {
      method: ctx.request.method,
      path: ctx.request.url.pathname,
      userAgent: ctx.request.headers.get('User-Agent')?.slice(0, 100)
    };
  }

  // Add stack trace in development
  if (config.showStackTrace && config.environment === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Add specific error details
  if (details) {
    errorResponse.error.details = details;
  }

  // Add retry information for rate limiting
  if (err instanceof RateLimitError) {
    ctx.response.headers.set('Retry-After', String(err.retryAfter));
    errorResponse.retryAfter = err.retryAfter;
  }

  // Add validation details
  if (err instanceof ValidationError) {
    errorResponse.validation = {
      field: err.field,
      value: config.sanitizeErrors ? '[REDACTED]' : err.value
    };
  }

  ctx.response.body = errorResponse;

  // Report critical errors
  if (status >= 500) {
    await ErrorHandler['reportError'](err, {
      type: 'request_error',
      requestId,
      ip,
      method: ctx.request.method,
      path: ctx.request.url.pathname
    });
  }
}

/**
 * Log request error to file with full context
 */
async function logRequestErrorToFile(error: Error, ctx: any, requestId: string): Promise<void> {
  try {
    await Deno.mkdir('./logs', { recursive: true });

    const errorLog = {
      timestamp: new Date().toISOString(),
      type: 'REQUEST_ERROR',
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      request: {
        method: ctx.request.method,
        url: ctx.request.url.pathname,
        userAgent: ctx.request.headers.get('User-Agent'),
        ip: ctx.request.ip,
        headers: sanitizeHeaders(ctx.request.headers)
      },
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        isOperational: error.isOperational
      })
    };

    const logEntry = JSON.stringify(errorLog) + '\n';
    await Deno.writeTextFile('./logs/requests.log', logEntry, { append: true });
  } catch (fileError) {
    console.error('Failed to write request error log:', fileError.message);
  }
}

/**
 * Determine appropriate error response based on error type
 */
function determineErrorResponse(error: Error, config: ErrorConfig): {
  status: number;
  message: string;
  details?: any;
} {
  // Custom error messages from config
  if (config.customErrorMessages && config.customErrorMessages[error.name]) {
    return {
      status: error instanceof AppError ? error.statusCode : 500,
      message: config.customErrorMessages[error.name]
    };
  }

  // Handle specific error types
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      message: config.sanitizeErrors && error.statusCode >= 500
        ? 'Internal server error'
        : error.message,
      details: error instanceof ValidationError ? {
        field: error.field,
        value: config.sanitizeErrors ? '[REDACTED]' : error.value
      } : undefined
    };
  }

  // Handle common Deno/system errors
  if (error.name === 'NotFound') {
    return { status: 404, message: 'Resource not found' };
  }

  if (error.name === 'PermissionDenied') {
    return { status: 403, message: 'Permission denied' };
  }

  if (error.name === 'ConnectionRefused') {
    return { status: 503, message: 'Service temporarily unavailable' };
  }

  if (error.name === 'TimedOut') {
    return { status: 408, message: 'Request timeout' };
  }

  // Database connection errors
  if (error.message.includes('database') || error.message.includes('connection')) {
    return {
      status: 503,
      message: config.sanitizeErrors
        ? 'Service temporarily unavailable'
        : 'Database connection error'
    };
  }

  // Default server error
  return {
    status: 500,
    message: config.sanitizeErrors || config.environment === 'production'
      ? 'Internal server error'
      : error.message
  };
}

/**
 * Sanitize request headers for logging
 */
function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sensitiveHeaders = new Set([
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token'
  ]);

  const result: Record<string, string> = {};

  for (const [key, value] of headers.entries()) {
    if (sensitiveHeaders.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value.length > 200 ? value.substring(0, 200) + '...' : value;
    }
  }

  return result;
}

// ================================================================================
// 🔍 ERROR ANALYTICS
// ================================================================================

export class ErrorAnalytics {
  /**
   * Analyze error patterns and generate insights
   */
  static analyzeErrorPatterns() {
    const stats = ErrorHandler.getErrorStats();
    const insights = [];

    // Check for high error rates
    if (stats.recentErrors > 50) {
      insights.push({
        type: 'high_error_rate',
        severity: 'high',
        message: `High error rate: ${stats.recentErrors} errors in the last 24 hours`,
        recommendation: 'Investigate error patterns and implement fixes'
      });
    }

    // Check for specific error type patterns
    const authErrors = stats.errorTypes['AuthenticationError'] || 0;
    const validationErrors = stats.errorTypes['ValidationError'] || 0;
    const dbErrors = stats.errorTypes['DatabaseError'] || 0;

    if (authErrors > stats.totalErrors * 0.3) {
      insights.push({
        type: 'auth_issues',
        severity: 'medium',
        message: 'High rate of authentication errors',
        recommendation: 'Review authentication flow and user guidance'
      });
    }

    if (validationErrors > stats.totalErrors * 0.4) {
      insights.push({
        type: 'validation_issues',
        severity: 'medium',
        message: 'High rate of validation errors',
        recommendation: 'Improve input validation and user feedback'
      });
    }

    if (dbErrors > 0) {
      insights.push({
        type: 'database_issues',
        severity: 'high',
        message: 'Database errors detected',
        recommendation: 'Check database connectivity and performance'
      });
    }

    return {
      stats,
      insights,
      recommendations: this.generateRecommendations(stats)
    };
  }

  /**
   * Generate actionable recommendations based on error patterns
   */
  private static generateRecommendations(stats: any) {
    const recommendations = [];

    // Error monitoring recommendations
    if (stats.totalErrors > 100) {
      recommendations.push({
        category: 'monitoring',
        priority: 'medium',
        action: 'Implement error rate alerting',
        description: 'Set up alerts when error rates exceed normal thresholds'
      });
    }

    // Performance recommendations
    const timeoutErrors = stats.errorTypes['TimedOut'] || 0;
    if (timeoutErrors > 5) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        action: 'Optimize request timeouts',
        description: 'Review and optimize slow operations causing timeouts'
      });
    }

    // Security recommendations
    const authErrors = (stats.errorTypes['AuthenticationError'] || 0) +
                      (stats.errorTypes['AuthorizationError'] || 0);
    if (authErrors > 20) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        action: 'Review authentication security',
        description: 'High auth error rates may indicate security issues'
      });
    }

    return recommendations;
  }
}

// ================================================================================
// 🎯 ERROR HANDLER PRESETS
// ================================================================================

export const ErrorHandlerPresets = {
  DEVELOPMENT: {
    logErrors: true,
    logToFile: false,
    showStackTrace: true,
    includeRequestInfo: true,
    sanitizeErrors: false,
    enableErrorReporting: false,
    customErrorMessages: {}
  } as ErrorConfig,

  PRODUCTION: {
    logErrors: true,
    logToFile: true,
    showStackTrace: false,
    includeRequestInfo: false,
    sanitizeErrors: true,
    enableErrorReporting: true,
    customErrorMessages: {
      'DatabaseError': 'Service temporarily unavailable',
      'ValidationError': 'Invalid request data',
      'AuthenticationError': 'Authentication required',
      'AuthorizationError': 'Access denied'
    }
  } as ErrorConfig,

  MINIMAL: {
    logErrors: false,
    logToFile: true,
    showStackTrace: false,
    includeRequestInfo: false,
    sanitizeErrors: true,
    enableErrorReporting: false,
    customErrorMessages: {}
  } as ErrorConfig
};

// ================================================================================
// 🛠️ ERROR UTILITIES
// ================================================================================

export class ErrorUtils {
  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    return {
      error: {
        message,
        type: 'ApplicationError',
        timestamp: new Date().toISOString(),
        ...(details && { details })
      }
    };
  }

  /**
   * Check if an error is operational (expected) vs programming error
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }

    // Common operational errors
    const operationalErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'NotFoundError',
      'RateLimitError'
    ];

    return operationalErrors.includes(error.name);
  }
<<<<<<< HEAD

  /**
=======

    /**
>>>>>>> refs/remotes/origin/main
   * Extract useful error information for logging
   */
  static extractErrorInfo(error: Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...(error instanceof AppError && {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        requestId: error.requestId
      })
    };
  }

  /**
   * Create error from HTTP status code
   */
  static fromHttpStatus(statusCode: number, message?: string, requestId?: string): AppError {
    const defaultMessages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    const errorMessage = message || defaultMessages[statusCode] || 'Unknown Error';

    switch (statusCode) {
      case 401:
        return new AuthenticationError(errorMessage, requestId);
      case 403:
        return new AuthorizationError(errorMessage, requestId);
      case 404:
        return new NotFoundError(errorMessage.replace(' not found', ''), requestId);
      case 429:
        return new RateLimitError(60, requestId); // Default 60 second retry
      default:
        return new AppError(errorMessage, statusCode, true, requestId);
    }
  }

  /**
   * Validate error handler configuration
   */
  static validateConfig(config: ErrorConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.environment) {
      errors.push('Environment is required');
    }

    if (config.logToFile && !config.logErrors) {
      errors.push('logErrors must be true when logToFile is enabled');
    }

    if (config.customErrorMessages) {
      for (const [errorType, message] of Object.entries(config.customErrorMessages)) {
        if (typeof message !== 'string' || message.trim().length === 0) {
          errors.push(`Custom error message for ${errorType} must be a non-empty string`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ================================================================================
// 🚀 EXPORT ALL ERROR HANDLING COMPONENTS
// ================================================================================

export default {
  ErrorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  DatabaseError,
  createErrorMiddleware,
  ErrorAnalytics,
  ErrorHandlerPresets,
  ErrorUtils
};
