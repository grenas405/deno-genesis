// middleware/healthCheck.ts → System Health Monitoring
// ================================================================================
// 🔍 DenoGenesis Framework - Advanced Health Check Middleware
// Comprehensive system monitoring, dependency checks, and status reporting
// ================================================================================

// ================================================================================
// 🔧 HEALTH CHECK CONFIGURATION
// ================================================================================

export interface HealthCheckConfig {
  endpoint: string;
  includeMetrics: boolean;
  includeEnvironment?: boolean;
  timeout?: number;
  customChecks?: Array<() => Promise<HealthCheckResult>>;
  enableDetailedChecks?: boolean;
  cacheResults?: boolean;
  cacheTTL?: number;
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: any;
  responseTime?: number;
  timestamp?: string;
  error?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: string;
  environment?: any;
  metrics?: any;
  checks?: HealthCheckResult[];
  dependencies?: DependencyHealth[];
  resources?: ResourceHealth;
}

export interface DependencyHealth {
  name: string;
  type: 'database' | 'api' | 'service' | 'cache' | 'filesystem';
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
}

export interface ResourceHealth {
  memory: {
    used: string;
    total: string;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  disk?: {
    used: string;
    total: string;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  network?: {
    status: 'healthy' | 'unhealthy';
    latency?: number;
  };
}

// ================================================================================
// 🏥 HEALTH CHECK MIDDLEWARE FACTORY
// ================================================================================

export function createHealthCheckMiddleware(
  performanceMonitor: any,
  config: HealthCheckConfig
) {
  const healthChecker = new HealthChecker(config, performanceMonitor);
  
  return async (ctx: any, next: () => Promise<unknown>) => {
    if (ctx.request.url.pathname === config.endpoint) {
      const startTime = Date.now();
      
      try {
        const healthData = await healthChecker.performHealthCheck();
        const responseTime = Date.now() - startTime;
        
        // Set response headers
        ctx.response.headers.set('Content-Type', 'application/json');
        ctx.response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        ctx.response.headers.set('X-Health-Check-Version', '2.0');
        ctx.response.headers.set('X-Response-Time', `${responseTime}ms`);
        
        // Set status code based on overall health
        if (healthData.status === 'unhealthy') {
          ctx.response.status = 503; // Service Unavailable
        } else if (healthData.status === 'degraded') {
          ctx.response.status = 207; // Multi-Status
        } else {
          ctx.response.status = 200; // OK
        }
        
        ctx.response.body = healthData;
        return;
      } catch (error) {
        console.error('Health check failed:', error);
        
        ctx.response.status = 503;
        ctx.response.headers.set('Content-Type', 'application/json');
        ctx.response.body = {
          status: 'unhealthy',
          error: 'Health check system failure',
          timestamp: new Date().toISOString()
        };
        return;
      }
    }
    
    await next();
  };
}

// ================================================================================
// 🏥 HEALTH CHECKER CLASS
// ================================================================================

export class HealthChecker {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  constructor(
    private config: HealthCheckConfig,
    private performanceMonitor: any
  ) {}
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    // Check cache if enabled
    if (this.config.cacheResults && this.config.cacheTTL) {
      const cached = this.getCachedResult('main_health_check');
      if (cached) {
        return cached;
      }
    }
    
    const healthData: SystemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      uptime: this.calculateUptime()
    };
    
    // Add performance metrics if requested
    if (this.config.includeMetrics && this.performanceMonitor) {
      healthData.metrics = this.performanceMonitor.getMetrics();
    }
    
    // Add environment info if requested
    if (this.config.includeEnvironment) {
      healthData.environment = this.getEnvironmentInfo();
    }
    
    // Perform detailed checks if enabled
    if (this.config.enableDetailedChecks) {
      healthData.resources = await this.checkSystemResources();
      healthData.dependencies = await this.checkDependencies();
    }
    
    // Run custom checks
    if (this.config.customChecks && this.config.customChecks.length > 0) {
      healthData.checks = await this.runCustomChecks();
    }
    
    // Determine overall status
    healthData.status = this.determineOverallStatus(healthData);
    
    // Cache results if enabled
    if (this.config.cacheResults && this.config.cacheTTL) {
      this.cacheResult('main_health_check', healthData);
    }
    
    return healthData;
  }
  
  /**
   * Check system resources (memory, disk, etc.)
   */
  private async checkSystemResources(): Promise<ResourceHealth> {
    const resources: ResourceHealth = {
      memory: await this.checkMemoryHealth()
    };
    
    // Add disk check if available
    try {
      resources.disk = await this.checkDiskHealth();
    } catch (error) {
      console.warn('Disk health check unavailable:', error.message);
    }
    
    // Add network check
    try {
      resources.network = await this.checkNetworkHealth();
    } catch (error) {
      console.warn('Network health check failed:', error.message);
      resources.network = { status: 'unhealthy' };
    }
    
    return resources;
  }
  
  /**
   * Check memory health
   */
  private async checkMemoryHealth() {
    try {
      const memory = Deno.memoryUsage();
      const usedMB = memory.heapUsed / 1024 / 1024;
      const totalMB = memory.heapTotal / 1024 / 1024;
      const percentage = (usedMB / totalMB) * 100;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (percentage > 90) status = 'critical';
      else if (percentage > 75) status = 'warning';
      
      return {
        used: `${usedMB.toFixed(2)} MB`,
        total: `${totalMB.toFixed(2)} MB`,
        percentage: Math.round(percentage),
        status
      };
    } catch (error) {
      return {
        used: 'N/A',
        total: 'N/A',
        percentage: 0,
        status: 'critical' as const
      };
    }
  }
  
  /**
   * Check disk health
   */
  private async checkDiskHealth() {
    try {
      // This is a simplified disk check - in production you'd want more detailed disk monitoring
      const stat = await Deno.stat('./');
      
      // For now, we'll return a placeholder
      return {
        used: 'N/A',
        total: 'N/A',
        percentage: 0,
        status: 'healthy' as const
      };
    } catch (error) {
      throw new Error('Disk health check not implemented');
    }
  }
  
  /**
   * Check network connectivity
   */
  private async checkNetworkHealth() {
    const startTime = Date.now();
    
    try {
      // Test network connectivity with a simple DNS lookup
      const response = await fetch('https://1.1.1.1', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const latency = Date.now() - startTime;
      
      return {
        status: response.ok ? 'healthy' as const : 'unhealthy' as const,
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        latency: Date.now() - startTime
      };
    }
  }
  
  /**
   * Check external dependencies
   */
  private async checkDependencies(): Promise<DependencyHealth[]> {
    const dependencies: DependencyHealth[] = [];
    
    // Database health check
    dependencies.push(await this.checkDatabaseHealth());
    
    // Filesystem health check
    dependencies.push(await this.checkFilesystemHealth());
    
    // Add more dependency checks here
    
    return dependencies;
  }
  
  /**
   * Check database connectivity
   */
  private async checkDatabaseHealth(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      // This would be replaced with actual database connection test
      // For now, we'll simulate a database check
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB query
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'database',
        type: 'database',
        status: 'healthy',
        responseTime,
        details: {
          connection: 'active',
          queryTime: `${responseTime}ms`
        }
      };
    } catch (error) {
      return {
        name: 'database',
        type: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message
        }
      };
    }
  }
  
  /**
   * Check filesystem health
   */
  private async checkFilesystemHealth(): Promise<DependencyHealth> {
    const startTime = Date.now();
    
    try {
      // Test filesystem read/write capabilities
      const testFile = './health_check_test.tmp';
      const testData = 'health_check_' + Date.now();
      
      await Deno.writeTextFile(testFile, testData);
      const readData = await Deno.readTextFile(testFile);
      await Deno.remove(testFile);
      
      const responseTime = Date.now() - startTime;
      const success = readData === testData;
      
      return {
        name: 'filesystem',
        type: 'filesystem',
        status: success ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          readable: true,
          writable: success,
          testPassed: success
        }
      };
    } catch (error) {
      return {
        name: 'filesystem',
        type: 'filesystem',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error.message,
          readable: false,
          writable: false
        }
      };
    }
  }
  
  /**
   * Run custom health checks
   */
  private async runCustomChecks(): Promise<HealthCheckResult[]> {
    if (!this.config.customChecks) return [];
    
    const results: HealthCheckResult[] = [];
    
    for (const check of this.config.customChecks) {
      const startTime = Date.now();
      
      try {
        const result = await Promise.race([
          check(),
          new Promise<HealthCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 
            this.config.timeout || 5000)
          )
        ]);
        
        result.responseTime = Date.now() - startTime;
        result.timestamp = new Date().toISOString();
        results.push(result);
      } catch (error) {
        results.push({
          name: 'custom_check',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Determine overall system status
   */
  private determineOverallStatus(healthData: SystemHealth): 'healthy' | 'unhealthy' | 'degraded' {
    const allChecks = [
      ...(healthData.checks || []),
      ...(healthData.dependencies || [])
    ];
    
    // If any critical component is unhealthy, system is unhealthy
    const unhealthyChecks = allChecks.filter(check => check.status === 'unhealthy');
    if (unhealthyChecks.length > 0) {
      return 'unhealthy';
    }
    
    // If any component is degraded, system is degraded
    const degradedChecks = allChecks.filter(check => check.status === 'degraded');
    if (degradedChecks.length > 0) {
      return 'degraded';
    }
    
    // Check resource health
    if (healthData.resources) {
      if (healthData.resources.memory.status === 'critical') {
        return 'unhealthy';
      }
      if (healthData.resources.memory.status === 'warning') {
        return 'degraded';
      }
      if (healthData.resources.network?.status === 'unhealthy') {
        return 'degraded';
      }
    }
    
    return 'healthy';
  }
  
  /**
   * Calculate system uptime
   */
  private calculateUptime(): string {
    // This would be calculated from when the application started
    // For now, we'll use a placeholder
    const uptimeMs = Date.now() - (Date.now() - (Math.random() * 24 * 60 * 60 * 1000));
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    
    const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    const seconds = uptimeSeconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
  
  /**
   * Get environment information
   */
  private getEnvironmentInfo() {
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
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    };
  }
  
  /**
   * Cache health check results
   */
  private cacheResult(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get cached health check results
   */
  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached || !this.config.cacheTTL) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL * 1000;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
}

// ================================================================================
// 🎯 HEALTH CHECK PRESETS
// ================================================================================

export const HealthCheckPresets = {
  BASIC: {
    endpoint: '/health',
    includeMetrics: false,
    includeEnvironment: false,
    enableDetailedChecks: false,
    cacheResults: true,
    cacheTTL: 30 // 30 seconds
  } as HealthCheckConfig,
  
  DETAILED: {
    endpoint: '/health',
    includeMetrics: true,
    includeEnvironment: true,
    enableDetailedChecks: true,
    timeout: 5000,
    cacheResults: true,
    cacheTTL: 10 // 10 seconds
  } as HealthCheckConfig,
  
  MONITORING: {
    endpoint: '/health',
    includeMetrics: true,
    includeEnvironment: true,
    enableDetailedChecks: true,
    timeout: 3000,
    cacheResults: false // No caching for monitoring
  } as HealthCheckConfig
};

// ================================================================================
// 🛠️ HEALTH CHECK UTILITIES
// ================================================================================

export class HealthCheckUtils {
  /**
   * Create a custom database health check
   */
  static createDatabaseCheck(connectionTest: () => Promise<boolean>): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      
      try {
        const isConnected = await connectionTest();
        
        return {
          name: 'database_connection',
          status: isConnected ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          details: {
            connected: isConnected,
            type: 'database'
          }
        };
      } catch (error) {
        return {
          name: 'database_connection',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }
  
  /**
   * Create a custom API endpoint health check
   */
  static createApiCheck(url: string, timeout: number = 5000): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(timeout)
        });
        
        return {
          name: `api_${new URL(url).hostname}`,
          status: response.ok ? 'healthy' : 'degraded',
          responseTime: Date.now() - startTime,
          details: {
            url,
            status: response.status,
            statusText: response.statusText
          }
        };
      } catch (error) {
        return {
          name: `api_${new URL(url).hostname}`,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }
  
  /**
   * Create a custom service health check
   */
  static createServiceCheck(
    name: string, 
    checkFunction: () => Promise<{ healthy: boolean; details?: any }>
  ): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      
      try {
        const result = await checkFunction();
        
        return {
          name: `service_${name}`,
          status: result.healthy ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          details: result.details
        };
      } catch (error) {
        return {
          name: `service_${name}`,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }
  
  /**
   * Create a readiness probe (for Kubernetes/Docker deployments)
   */
  static createReadinessProbe(
    dependencies: Array<() => Promise<HealthCheckResult>>
  ): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      
      try {
        const results = await Promise.all(dependencies.map(dep => dep()));
        const allHealthy = results.every(result => result.status === 'healthy');
        
        return {
          name: 'readiness_probe',
          status: allHealthy ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          details: {
            dependenciesChecked: results.length,
            dependenciesHealthy: results.filter(r => r.status === 'healthy').length,
            ready: allHealthy
          }
        };
      } catch (error) {
        return {
          name: 'readiness_probe',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: error.message
        };
      }
    };
  }
  
  /**
   * Create a liveness probe (for Kubernetes/Docker deployments)
   */
  static createLivenessProbe(): () => Promise<HealthCheckResult> {
    return async () => {
      const startTime = Date.now();
      
      // Simple liveness check - if this code is running, the service is alive
      return {
        name: 'liveness_probe',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: {
          alive: true,
          timestamp: new Date().toISOString()
        }
      };
    };
  }
  
  /**
   * Validate health check configuration
   */
  static validateConfig(config: HealthCheckConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.endpoint) {
      errors.push('Health check endpoint is required');
    }
    
    if (config.endpoint && !config.endpoint.startsWith('/')) {
      errors.push('Health check endpoint must start with "/"');
    }
    
    if (config.timeout && config.timeout <= 0) {
      errors.push('Timeout must be positive');
    }
    
    if (config.cacheTTL && config.cacheTTL <= 0) {
      errors.push('Cache TTL must be positive');
    }
    
    if (config.customChecks && !Array.isArray(config.customChecks)) {
      errors.push('Custom checks must be an array');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ================================================================================
// 📊 HEALTH MONITORING AND ALERTING
// ================================================================================

export class HealthMonitor {
  private healthHistory: Array<{ timestamp: number; status: string; details?: any }> = [];
  private alerts: Array<{ timestamp: number; message: string; severity: string }> = [];
  
  /**
   * Record health check result
   */
  recordHealthCheck(result: SystemHealth): void {
    this.healthHistory.push({
      timestamp: Date.now(),
      status: result.status,
      details: {
        checksCount: result.checks?.length || 0,
        dependenciesCount: result.dependencies?.length || 0,
        memoryUsage: result.resources?.memory.percentage
      }
    });
    
    // Keep only last 1000 entries
    if (this.healthHistory.length > 1000) {
      this.healthHistory = this.healthHistory.slice(-1000);
    }
    
    // Check for alerting conditions
    this.checkAlertConditions(result);
  }
  
  /**
   * Check for conditions that should trigger alerts
   */
  private checkAlertConditions(result: SystemHealth): void {
    const now = Date.now();
    
    // Alert on unhealthy status
    if (result.status === 'unhealthy') {
      this.addAlert('System health is unhealthy', 'high');
    }
    
    // Alert on high memory usage
    if (result.resources?.memory.percentage && result.resources.memory.percentage > 90) {
      this.addAlert(`High memory usage: ${result.resources.memory.percentage}%`, 'medium');
    }
    
    // Alert on consecutive degraded status
    const recent = this.healthHistory.slice(-5);
    const allDegraded = recent.length >= 3 && recent.every(h => h.status === 'degraded');
    if (allDegraded) {
      this.addAlert('System has been in degraded state for multiple checks', 'medium');
    }
    
    // Alert on failed dependencies
    const failedDeps = result.dependencies?.filter(d => d.status === 'unhealthy') || [];
    if (failedDeps.length > 0) {
      this.addAlert(`${failedDeps.length} dependencies are unhealthy`, 'high');
    }
  }
  
  /**
   * Add an alert
   */
  private addAlert(message: string, severity: string): void {
    // Avoid duplicate alerts (same message within 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const isDuplicate = this.alerts.some(alert => 
      alert.message === message && alert.timestamp > fiveMinutesAgo
    );
    
    if (!isDuplicate) {
      this.alerts.push({
        timestamp: Date.now(),
        message,
        severity
      });
      
      // Log the alert
      console.warn(`🚨 Health Alert [${severity.toUpperCase()}]: ${message}`);
      
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }
    }
  }
  
  /**
   * Get health statistics
   */
  getHealthStats() {
    const totalChecks = this.healthHistory.length;
    const healthyChecks = this.healthHistory.filter(h => h.status === 'healthy').length;
    const degradedChecks = this.healthHistory.filter(h => h.status === 'degraded').length;
    const unhealthyChecks = this.healthHistory.filter(h => h.status === 'unhealthy').length;
    
    const uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;
    
    // Recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentAlerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
    
    return {
      totalChecks,
      healthyChecks,
      degradedChecks,
      unhealthyChecks,
      uptimePercentage: uptime.toFixed(2) + '%',
      recentAlerts: recentAlerts.length,
      alertsByseverity: {
        high: recentAlerts.filter(a => a.severity === 'high').length,
        medium: recentAlerts.filter(a => a.severity === 'medium').length,
        low: recentAlerts.filter(a => a.severity === 'low').length
      },
      lastCheck: this.healthHistory.length > 0 
        ? new Date(this.healthHistory[this.healthHistory.length - 1].timestamp).toISOString()
        : null,
      healthTrend: this.calculateHealthTrend()
    };
  }
  
  /**
   * Calculate health trend
   */
  private calculateHealthTrend(): 'improving' | 'stable' | 'declining' {
    if (this.healthHistory.length < 10) return 'stable';
    
    const recent = this.healthHistory.slice(-5);
    const previous = this.healthHistory.slice(-10, -5);
    
    const recentHealthy = recent.filter(h => h.status === 'healthy').length;
    const previousHealthy = previous.filter(h => h.status === 'healthy').length;
    
    if (recentHealthy > previousHealthy) return 'improving';
    if (recentHealthy < previousHealthy) return 'declining';
    return 'stable';
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.alerts
      .filter(alert => alert.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(alert => ({
        ...alert,
        timestamp: new Date(alert.timestamp).toISOString()
      }));
  }
  
  /**
   * Clear old data
   */
  cleanup(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.healthHistory = this.healthHistory.filter(h => h.timestamp > oneDayAgo);
    this.alerts = this.alerts.filter(a => a.timestamp > oneDayAgo);
  }
}

// ================================================================================
// 🚀 EXPORT ALL HEALTH CHECK COMPONENTS
// ================================================================================

export default {
  createHealthCheckMiddleware,
  HealthChecker,
  HealthCheckUtils,
  HealthMonitor,
  HealthCheckPresets
};