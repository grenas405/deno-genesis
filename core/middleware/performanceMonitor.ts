// middleware/performanceMonitor.ts → Performance Monitoring System
// ================================================================================
// 📊 DenoGenesis Framework - Advanced Performance Monitoring
// Real-time metrics, memory tracking, and request analysis for optimization
// ================================================================================

// ================================================================================
// 🔧 PERFORMANCE MONITOR CLASS
// ================================================================================

export class PerformanceMonitor {
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private totalResponseTime: number = 0;
  private slowRequests: number = 0;
  private endpoints: Map<string, { count: number; totalTime: number; errors: number }> = new Map();
  private recentRequests: Array<{ timestamp: number; path: string; method: string; duration: number; status: number }> = [];

  constructor() {
    this.startTime = Date.now();
    this.startPeriodicCleanup();
  }

  incrementRequest(): void {
    this.requestCount++;
  }

  incrementError(): void {
    this.errorCount++;
  }

  recordRequest(path: string, method: string, duration: number, status: number): void {
    this.totalResponseTime += duration;

    // Track slow requests (>1000ms)
    if (duration > 1000) {
      this.slowRequests++;
    }

    // Track per-endpoint metrics
    const endpointKey = `${method} ${path}`;
    const existing = this.endpoints.get(endpointKey) || { count: 0, totalTime: 0, errors: 0 };
    existing.count++;
    existing.totalTime += duration;
    if (status >= 400) {
      existing.errors++;
    }
    this.endpoints.set(endpointKey, existing);

    // Store recent request (keep last 100)
    this.recentRequests.push({
      timestamp: Date.now(),
      path,
      method,
      duration,
      status
    });

    if (this.recentRequests.length > 100) {
      this.recentRequests.shift();
    }
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;

    return {
      // Basic metrics
      uptime: this.formatUptime(uptime),
      uptimeMs: uptime,
      requests: this.requestCount,
      errors: this.errorCount,
      successRate: this.requestCount > 0 
        ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2) + '%'
        : '100%',

      // Performance metrics
      averageResponseTime: Math.round(avgResponseTime) + 'ms',
      slowRequests: this.slowRequests,
      slowRequestRate: this.requestCount > 0 
        ? ((this.slowRequests / this.requestCount) * 100).toFixed(2) + '%'
        : '0%',

      // System metrics
      memory: this.getMemoryUsage(),
      timestamp: new Date().toISOString(),

      // Endpoint analytics
      topEndpoints: this.getTopEndpoints(),
      recentActivity: this.getRecentActivity()
    };
  }

  getDetailedMetrics() {
    return {
      ...this.getMetrics(),
      endpoints: Array.from(this.endpoints.entries()).map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count) + 'ms',
        errorRate: ((stats.errors / stats.count) * 100).toFixed(2) + '%',
        totalTime: stats.totalTime
      })),
      systemInfo: this.getSystemInfo()
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private getMemoryUsage() {
    try {
      const memory = Deno.memoryUsage();
      return {
        heapUsed: this.formatBytes(memory.heapUsed),
        heapTotal: this.formatBytes(memory.heapTotal),
        external: this.formatBytes(memory.external),
        heapUsedBytes: memory.heapUsed,
        heapTotalBytes: memory.heapTotal,
        utilization: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1) + '%'
      };
    } catch {
      return { 
        heapUsed: 'N/A', 
        heapTotal: 'N/A', 
        external: 'N/A',
        heapUsedBytes: 0,
        heapTotalBytes: 0,
        utilization: 'N/A'
      };
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private getTopEndpoints(limit: number = 5) {
    return Array.from(this.endpoints.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, limit)
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.count,
        avgResponseTime: Math.round(stats.totalTime / stats.count),
        errorRate: ((stats.errors / stats.count) * 100).toFixed(1)
      }));
  }

  private getRecentActivity(limit: number = 10) {
    return this.recentRequests
      .slice(-limit)
      .map(req => ({
        timestamp: new Date(req.timestamp).toISOString(),
        request: `${req.method} ${req.path}`,
        duration: req.duration + 'ms',
        status: req.status,
        statusClass: req.status >= 400 ? 'error' : req.status >= 300 ? 'warning' : 'success'
      }));
  }

  private getSystemInfo() {
    return {
      deno: {
        version: Deno.version.deno,
        v8: Deno.version.v8,
        typescript: Deno.version.typescript
      },
      system: {
        os: Deno.build.os,
        arch: Deno.build.arch,
        pid: Deno.pid
      },
      runtime: {
        startTime: new Date(this.startTime).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  private startPeriodicCleanup(): void {
    // Clean up old data every 5 minutes
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      this.recentRequests = this.recentRequests.filter(req => req.timestamp > fiveMinutesAgo);
    }, 5 * 60 * 1000);
  }

  // Performance analysis methods
  getPerformanceInsights() {
    const metrics = this.getMetrics();
    const insights = [];

    // Analyze response time
    const avgTime = parseInt(metrics.averageResponseTime);
    if (avgTime > 500) {
      insights.push({
        type: 'warning',
        message: `Average response time is ${avgTime}ms. Consider optimization.`,
        suggestion: 'Review slow endpoints and implement caching'
      });
    }

    // Analyze error rate
    const errorRate = parseFloat(metrics.successRate.replace('%', ''));
    if (errorRate < 95) {
      insights.push({
        type: 'error',
        message: `Success rate is ${errorRate}%. High error rate detected.`,
        suggestion: 'Review error logs and improve error handling'
      });
    }

    // Analyze memory usage
    const memoryUtil = parseFloat(metrics.memory.utilization?.replace('%', '') || '0');
    if (memoryUtil > 80) {
      insights.push({
        type: 'warning',
        message: `Memory utilization is ${memoryUtil}%. Consider optimization.`,
        suggestion: 'Review memory usage and implement cleanup routines'
      });
    }

    // Analyze slow requests
    const slowRate = parseFloat(metrics.slowRequestRate.replace('%', ''));
    if (slowRate > 5) {
      insights.push({
        type: 'warning',
        message: `${slowRate}% of requests are slow (>1s). Performance optimization needed.`,
        suggestion: 'Identify and optimize slow endpoints'
      });
    }

    return {
      insights,
      overallHealth: insights.length === 0 ? 'excellent' : 
                    insights.some(i => i.type === 'error') ? 'poor' : 'good'
    };
  }
}

// ================================================================================
// 🔄 PERFORMANCE MIDDLEWARE FACTORY
// ================================================================================

// Simple UUID generator for Deno
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
}

export function createPerformanceMiddleware(
  monitor: PerformanceMonitor, 
  isDevelopment: boolean = false
) {
  return async (ctx: any, next: () => Promise<unknown>) => {
    const start = Date.now();
    monitor.incrementRequest();

    // Generate unique request ID for tracking
    const requestId = generateRequestId();
    ctx.state.requestId = requestId;
    ctx.state.startTime = start;

    try {
      await next();

      const responseTime = Date.now() - start;
      const method = ctx.request.method;
      const path = ctx.request.url.pathname;
      const status = ctx.response.status;

      // Record request metrics
      monitor.recordRequest(path, method, responseTime, status);

      // Add performance headers
      ctx.response.headers.set('X-Response-Time', `${responseTime}ms`);
      ctx.response.headers.set('X-Request-ID', requestId);
      ctx.response.headers.set('X-Server-Timing', `total;dur=${responseTime}`);

      // Development logging
      if (isDevelopment) {
        const statusColor = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
        const resetColor = '\x1b[0m';
        console.log(
          `🔍 ${statusColor}${method} ${path} - ${status} (${responseTime}ms) [${requestId}]${resetColor}`
        );

        // Warn about slow requests
        if (responseTime > 1000) {
          console.log(`⚠️  Slow request detected: ${responseTime}ms for ${method} ${path}`);
        }
      }

    } catch (error) {
      monitor.incrementError();
      const responseTime = Date.now() - start;

      // Record failed request
      monitor.recordRequest(
        ctx.request.url.pathname, 
        ctx.request.method, 
        responseTime, 
        500
      );

      console.error(`❌ Request failed [${requestId}] after ${responseTime}ms: ${error.message}`);
      throw error;
    }
  };
}

// ================================================================================
// 🎯 PERFORMANCE UTILITIES
// ================================================================================

export class PerformanceAnalyzer {
  static analyzeEndpointPerformance(monitor: PerformanceMonitor) {
    const metrics = monitor.getDetailedMetrics();

    return {
      slowestEndpoints: metrics.endpoints
        .sort((a, b) => parseInt(b.avgResponseTime) - parseInt(a.avgResponseTime))
        .slice(0, 5),

      errorProneEndpoints: metrics.endpoints
        .filter(e => parseFloat(e.errorRate) > 0)
        .sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate))
        .slice(0, 5),

      popularEndpoints: metrics.endpoints
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5),

      recommendations: this.generateRecommendations(metrics)
    };
  }

  private static generateRecommendations(metrics: any) {
    const recommendations = [];

    // Check for endpoints that could benefit from caching
    const highTrafficEndpoints = metrics.endpoints
      .filter((e: any) => e.requests > 100 && e.endpoint.startsWith('GET'))
      .sort((a: any, b: any) => b.requests - a.requests);

    if (highTrafficEndpoints.length > 0) {
      recommendations.push({
        type: 'caching',
        message: 'Consider implementing caching for high-traffic GET endpoints',
        endpoints: highTrafficEndpoints.slice(0, 3).map((e: any) => e.endpoint)
      });
    }

    // Check for endpoints with high error rates
    const errorProneEndpoints = metrics.endpoints
      .filter((e: any) => parseFloat(e.errorRate) > 5);

    if (errorProneEndpoints.length > 0) {
      recommendations.push({
        type: 'error-handling',
        message: 'Review error handling for endpoints with high error rates',
        endpoints: errorProneEndpoints.map((e: any) => e.endpoint)
      });
    }

    return recommendations;
  }
}

// ================================================================================
// 🚀 EXPORT UTILITIES
// ================================================================================

export default {
  PerformanceMonitor,
  createPerformanceMiddleware,
  PerformanceAnalyzer
};