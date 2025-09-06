/**
 * =============================================================================
 * DenoGenesis Framework - Core Metadata & Utilities (core/meta.ts)
 * =============================================================================
 * 
 * Comprehensive framework metadata collection, version management, integrity 
 * validation, and multi-site management system.
 * 
 * This module consolidates:
 * - Framework version information and build metadata
 * - Multi-site discovery and health monitoring
 * - Comprehensive integrity validation with detailed reporting
 * - Site-framework version compatibility checking
 * - System health diagnostics and recommendations
 * 
 * @module CoreMeta
 * @version 2.0.0
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @license AGPL-3.0
 */

// =============================================================================
// IMPORTS - REMOVED CIRCULAR DEPENDENCY
// =============================================================================

// Import version utilities from utils/index.ts instead of config/env.ts directly
import { 
  getFrameworkVersion,
  type FrameworkVersionInfo,
  type FrameworkIntegrityResult
} from "./utils/index.ts";

// =============================================================================
// TYPE DEFINITIONS - FRAMEWORK METADATA & HEALTH
// =============================================================================

/**
 * Framework runtime statistics
 */
export interface FrameworkStats {
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  activeSites: number;
  healthySites: number;
}

/**
 * Framework metadata structure
 */
export interface FrameworkMetadata {
  version: string;
  buildDate: string;
  gitHash?: string;
  centralizedAt: string;
  sites: SiteMetadata[];
}

/**
 * Site metadata structure
 */
export interface SiteMetadata {
  name: string;
  port: number;
  siteKey: string;
  domain: string;
  status: 'active' | 'inactive';
  frameworkVersion: string;
}

/**
 * Detailed integrity check result
 */
export interface IntegrityCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: IntegrityCheck[];
}

/**
 * Individual integrity check
 */
export interface IntegrityCheck {
  name: string;
  category: 'critical' | 'warning' | 'info';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
}

/**
 * Comprehensive framework health report
 */
export interface FrameworkHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: FrameworkVersionInfo;
  integrity: IntegrityCheckResult;
  stats: FrameworkStats;
  recommendations?: string[];
}

// =============================================================================
// FRAMEWORK STATS & HEALTH MONITORING
// =============================================================================

/**
 * Get framework runtime statistics
 * 
 * @returns FrameworkStats with current runtime information
 */
export function getFrameworkStats(): FrameworkStats {
  const memoryUsage = Deno.memoryUsage();
  
  return {
    uptime: performance.now(),
    memoryUsage: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    activeSites: 0, // Will be populated by getConnectedSites()
    healthySites: 0, // Will be populated by getConnectedSites()
  };
}

// =============================================================================
// FRAMEWORK METADATA COLLECTION
// =============================================================================

/**
 * Get comprehensive framework metadata including all connected sites
 * 
 * @returns Promise<FrameworkMetadata> with complete framework information
 */
export async function getFrameworkMetadata(): Promise<FrameworkMetadata> {
  const versionPath = "/home/admin/deno-genesis/VERSION";
  const versionContent = await Deno.readTextFile(versionPath);
  const lines = versionContent.split('\n');

  const version = lines[0] || 'unknown';
  const buildDate = lines.find(line => line.startsWith('Build Date:'))?.replace('Build Date: ', '') || 'unknown';
  const centralizedAt = lines.find(line => line.startsWith('Centralized:'))?.replace('Centralized: ', '') || 'unknown';

  const sites = await getConnectedSites();

  return {
    version,
    buildDate,
    centralizedAt,
    sites
  };
}

/**
 * Discover and analyze all connected DenoGenesis sites
 * 
 * @returns Promise<SiteMetadata[]> with information about all framework sites
 */
export async function getConnectedSites(): Promise<SiteMetadata[]> {
  const sites: SiteMetadata[] = [];
  const sitesPath = "/home/admin/deno-genesis/sites";

  try {
    for await (const dirEntry of Deno.readDir(sitesPath)) {
      if (dirEntry.isDirectory) {
        const sitePath = `${sitesPath}/${dirEntry.name}`;
        const versionFile = `${sitePath}/FRAMEWORK_VERSION`;

        try {
          await Deno.stat(versionFile);
          const siteConfig = await readSiteConfig(`${sitePath}/site-config.ts`);

          sites.push({
            name: siteConfig.name || dirEntry.name,
            port: siteConfig.port || 3000,
            siteKey: siteConfig.siteKey || dirEntry.name,
            domain: siteConfig.domain || 'localhost',
            status: await checkSiteRunning(siteConfig.port) ? 'active' : 'inactive',
            frameworkVersion: await Deno.readTextFile(versionFile),
          });
        } catch {
          // Skip sites without proper framework configuration
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Could not scan sites directory:", error.message);
  }

  return sites;
}

/**
 * Read and parse site configuration file
 */
async function readSiteConfig(configPath: string): Promise<any> {
  try {
    const configContent = await Deno.readTextFile(configPath);
    // Basic parsing of site-config.ts export
    const config: any = {};
    
    const nameMatch = configContent.match(/name:\s*["']([^"']+)["']/);
    if (nameMatch) config.name = nameMatch[1];
    
    const portMatch = configContent.match(/port:\s*(\d+)/);
    if (portMatch) config.port = parseInt(portMatch[1]);
    
    const keyMatch = configContent.match(/siteKey:\s*["']([^"']+)["']/);
    if (keyMatch) config.siteKey = keyMatch[1];
    
    const domainMatch = configContent.match(/domain:\s*["']([^"']+)["']/);
    if (domainMatch) config.domain = domainMatch[1];
    
    return config;
  } catch {
    return {};
  }
}

/**
 * Check if a site is currently running on the specified port
 */
async function checkSiteRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// COMPREHENSIVE FRAMEWORK HEALTH REPORTING
// =============================================================================

/**
 * Generate comprehensive framework health report
 * 
 * @returns Promise<FrameworkHealthReport> with complete system analysis
 */
export async function getFrameworkHealthReport(): Promise<FrameworkHealthReport> {
  const version = getFrameworkVersion();
  const stats = getFrameworkStats();
  const sites = await getConnectedSites();
  
  // Update stats with site information
  stats.activeSites = sites.length;
  stats.healthySites = sites.filter(site => site.status === 'active').length;
  
  // Perform detailed integrity checks
  const integrity = await performDetailedIntegrityChecks();
  
  // Determine overall health status
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  
  if (!integrity.valid) {
    const criticalErrors = integrity.errors.filter(error => 
      error.includes('critical') || error.includes('database') || error.includes('security')
    );
    status = criticalErrors.length > 0 ? "unhealthy" : "degraded";
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (stats.activeSites === 0) {
    recommendations.push("No active sites detected - framework may need attention");
  }
  
  if (stats.activeSites !== stats.healthySites) {
    recommendations.push("Some sites are inactive - health checks may require attention");
  }
  
  // Memory usage recommendations
  const memUsageMB = stats.memoryUsage.rss / (1024 * 1024);
  if (memUsageMB > 512) {
    recommendations.push(`Memory usage high (${Math.round(memUsageMB)}MB) - consider optimization`);
  }
  
  // Environment-specific recommendations
  if (version.environment === "production" && integrity.warnings.length > 0) {
    recommendations.push("Production environment has warnings - review before scaling");
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    version,
    integrity,
    stats,
    ...(recommendations.length > 0 && { recommendations }),
  };
}

/**
 * Perform detailed integrity checks with comprehensive validation
 * 
 * @returns Promise<IntegrityCheckResult> with detailed check results
 */
async function performDetailedIntegrityChecks(): Promise<IntegrityCheckResult> {
  const checks: IntegrityCheck[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Core module checks
  const coreModules = [
    'core/meta.ts',
    'core/utils/index.ts',
    'core/config/env.ts',
    'mod.ts',
    'main.ts'
  ];
  
  for (const module of coreModules) {
    try {
      await Deno.stat(module);
      checks.push({
        name: `Core Module: ${module}`,
        category: 'critical',
        status: 'passed',
        message: 'Module file exists and is accessible'
      });
    } catch {
      errors.push(`Missing core module: ${module}`);
      checks.push({
        name: `Core Module: ${module}`,
        category: 'critical',
        status: 'failed',
        message: 'Module file not found or not accessible'
      });
    }
  }
  
  // Environment variable checks
  const requiredEnvVars = ['SITE_KEY', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  
  for (const envVar of requiredEnvVars) {
    const value = Deno.env.get(envVar);
    if (!value) {
      errors.push(`Missing required environment variable: ${envVar}`);
      checks.push({
        name: `Environment Variable: ${envVar}`,
        category: 'critical',
        status: 'failed',
        message: 'Required environment variable not set'
      });
    } else {
      checks.push({
        name: `Environment Variable: ${envVar}`,
        category: 'critical',
        status: 'passed',
        message: 'Environment variable is set'
      });
    }
  }
  
  // Permission checks
  const requiredPermissions = [
    { name: 'read', path: '.' },
    { name: 'write', path: './logs' },
    { name: 'net', path: null }
  ];
  
  for (const permission of requiredPermissions) {
    try {
      // Basic permission validation
      if (permission.name === 'read' && permission.path) {
        await Deno.readDir(permission.path);
      } else if (permission.name === 'write' && permission.path) {
        await Deno.mkdir(permission.path, { recursive: true });
      }
      
      checks.push({
        name: `Permission: ${permission.name}${permission.path ? ` (${permission.path})` : ''}`,
        category: 'warning',
        status: 'passed',
        message: 'Permission check passed'
      });
    } catch (error) {
      warnings.push(`Permission issue: ${permission.name}${permission.path ? ` for ${permission.path}` : ''}`);
      checks.push({
        name: `Permission: ${permission.name}${permission.path ? ` (${permission.path})` : ''}`,
        category: 'warning',
        status: 'warning',
        message: `Permission check failed: ${error.message}`
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks
  };
}

/**
 * Log framework startup information with proper formatting
 * 
 * @param includeIntegrityCheck Whether to run full integrity validation on startup
 */
export async function logFrameworkStartup(includeIntegrityCheck = true): Promise<void> {
  const version = getFrameworkVersion();
  
  console.log("\n" + "=".repeat(80));
  console.log("🚀 DENOGENESIS FRAMEWORK STARTUP");
  console.log("=".repeat(80));
  console.log(`📦 Version: ${version.version}`);
  console.log(`🏗️  Build: ${version.buildHash} (${version.buildDate})`);
  console.log(`🌍 Environment: ${version.environment}`);
  console.log(`⚡ Deno: ${version.denoVersion}`);
  console.log(`🕒 Startup Time: ${new Date().toISOString()}`);
  
  if (includeIntegrityCheck) {
    console.log("\n🔍 Running integrity validation...");
    const integrity = await performDetailedIntegrityChecks();
    
    if (integrity.valid) {
      console.log("✅ Framework integrity: PASSED");
    } else {
      console.log("⚠️  Framework integrity: ISSUES DETECTED");
      
      if (integrity.errors.length > 0) {
        console.log("❌ Errors:", integrity.errors);
      }
    }
    
    if (integrity.warnings.length > 0) {
      console.log("⚠️  Warnings:", integrity.warnings);
    }
  }
  
  console.log("=".repeat(80) + "\n");
}