#!/usr/bin/env -S deno run --allow-read --allow-env --allow-run
/**
 * =============================================================================
 * DenoGenesis Framework - Core Metadata & Integrity System (core/meta.ts)
 * =============================================================================
 * 
 * Unix Philosophy Implementation:
 * - Do one thing well: Framework metadata and integrity validation
 * - Work with other tools: Structured data output for automation
 * - Clear interfaces: Composable functions with predictable outputs
 * 
 * Deno Benefits:
 * - Type safety for all metadata structures
 * - Modern APIs for file system operations
 * - Security through explicit permissions
 * - Direct execution without build steps
 * 
 * Core Responsibilities:
 * - Framework version information and build metadata
 * - Multi-site discovery and health monitoring
 * - Comprehensive integrity validation with detailed reporting
 * - Site-framework version compatibility checking
 * - System health diagnostics and recommendations
 * 
 * @module CoreMeta
 * @version 2.1.0
 * @author Pedro M. Dominguez - DenoGenesis Framework Team
 * @license AGPL-3.0
 */

// =============================================================================
// IMPORTS - UNIX PHILOSOPHY: MINIMAL DEPENDENCIES
// =============================================================================

import { 
  VERSION, 
  BUILD_DATE, 
  BUILD_HASH, 
  DENO_ENV 
} from "../config/env.ts";

// =============================================================================
// TYPE DEFINITIONS - UNIX PHILOSOPHY: CLEAR INTERFACES
// =============================================================================

/**
 * Framework version information structure
 * Unix Philosophy: Simple, composable data structure
 */
export interface FrameworkVersionInfo {
  version: string;
  buildDate: string;
  buildHash: string;
  environment: string;
  denoVersion: string;
  frameworkName: string;
  timestamp: number;
}

/**
 * Framework integrity check result (legacy compatibility)
 * Unix Philosophy: Backward compatibility with existing tools
 */
export interface FrameworkIntegrityResult {
  overall: boolean;
  checks: {
    coreModules: boolean;
    configuration: boolean;
    dependencies: boolean;
    fileSystem: boolean;
    environment: boolean;
  };
  details: {
    missingFiles?: string[];
    configErrors?: string[];
    dependencyIssues?: string[];
    permissions?: string[];
    warnings?: string[];
  };
  timestamp: number;
}

/**
 * Detailed integrity check result
 * Unix Philosophy: Structured output for automation
 */
export interface IntegrityCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: IntegrityCheck[];
  timestamp: string;
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    total: number;
  };
}

/**
 * Individual integrity check
 * Unix Philosophy: Atomic, testable units
 */
export interface IntegrityCheck {
  name: string;
  category: 'critical' | 'warning' | 'info';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Site information structure
 * Unix Philosophy: Clear data contracts
 */
export interface SiteInfo {
  name: string;
  path: string;
  port?: number;
  status: 'active' | 'inactive' | 'error';
  frameworkVersion: string;
  versionMatch: boolean;
  lastChecked: string;
  responseTime?: number;
}

/**
 * Framework metadata structure
 * Unix Philosophy: Authoritative information source
 */
export interface FrameworkMetadata {
  version: string;
  buildDate: string;
  buildHash: string;
  environment: string;
  path: string;
  integrity: boolean;
  sites: number;
  lastValidated: string;
}

/**
 * Framework runtime statistics
 * Unix Philosophy: Observable system metrics
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
  lastUpdated: string;
}

/**
 * Comprehensive health report
 * Unix Philosophy: Complete system state
 */
export interface FrameworkHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: FrameworkVersionInfo;
  integrity: IntegrityCheckResult;
  stats: FrameworkStats;
  sites: SiteInfo[];
  recommendations: string[];
  timestamp: string;
}

// =============================================================================
// CORE VERSION MANAGEMENT - SINGLE RESPONSIBILITY
// =============================================================================

/**
 * Get comprehensive framework version information
 * Unix Philosophy: Single source of truth for version data
 * 
 * @returns FrameworkVersionInfo with complete version details
 */
export function getFrameworkVersion(): FrameworkVersionInfo {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH,
    environment: DENO_ENV,
    denoVersion: Deno.version.deno,
    frameworkName: 'DenoGenesis',
    timestamp: Date.now()
  };
}

/**
 * Get framework metadata from authoritative sources
 * Unix Philosophy: Read from filesystem for truth
 * 
 * @returns Promise<FrameworkMetadata> with current metadata
 */
export async function getFrameworkMetadata(): Promise<FrameworkMetadata> {
  const frameworkPath = await getFrameworkPath();
  const version = getFrameworkVersion();
  
  try {
    // Read VERSION file for authoritative version info
    const versionPath = `${frameworkPath}/VERSION`;
    const versionContent = await Deno.readTextFile(versionPath);
    const [fileVersion, fileBuildDate, fileBuildHash] = versionContent.trim().split('|');
    
    // Get basic integrity status
    const basicIntegrity = await validateFrameworkIntegrity();
    
    // Count sites
    const sites = await getConnectedSites();
    
    return {
      version: fileVersion || version.version,
      buildDate: fileBuildDate || version.buildDate,
      buildHash: fileBuildHash || version.buildHash,
      environment: version.environment,
      path: frameworkPath,
      integrity: basicIntegrity.overall,
      sites: sites.length,
      lastValidated: new Date().toISOString()
    };
  } catch (error) {
    // Graceful degradation - return best available info
    console.warn(`⚠️ Could not read VERSION file: ${error.message}`);
    
    return {
      version: version.version,
      buildDate: version.buildDate,
      buildHash: version.buildHash,
      environment: version.environment,
      path: frameworkPath,
      integrity: false,
      sites: 0,
      lastValidated: new Date().toISOString()
    };
  }
}

/**
 * Get current framework runtime statistics
 * Unix Philosophy: Observable system metrics
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
      external: memoryUsage.external
    },
    activeSites: 0, // Will be updated by callers
    healthySites: 0, // Will be updated by callers
    lastUpdated: new Date().toISOString()
  };
}

// =============================================================================
// FRAMEWORK PATH DETECTION - ENVIRONMENT AWARE
// =============================================================================

/**
 * Detect framework root path
 * Unix Philosophy: Auto-discovery with fallbacks
 * 
 * @returns Promise<string> framework root path
 */
async function getFrameworkPath(): Promise<string> {
  // Try environment variable first
  const envPath = Deno.env.get('DENOGENESIS_ROOT');
  if (envPath) {
    try {
      const stat = await Deno.stat(envPath);
      if (stat.isDirectory) {
        return envPath;
      }
    } catch {
      console.warn(`⚠️ DENOGENESIS_ROOT path not accessible: ${envPath}`);
    }
  }
  
  // Try standard locations
  const standardPaths = [
    '/home/admin/deno-genesis',
    '/opt/deno-genesis',
    './deno-genesis',
    '.'
  ];
  
  for (const path of standardPaths) {
    try {
      const stat = await Deno.stat(path);
      if (stat.isDirectory) {
        // Verify it's actually a DenoGenesis framework directory
        const versionFile = `${path}/VERSION`;
        const modFile = `${path}/mod.ts`;
        
        try {
          await Deno.stat(versionFile);
          await Deno.stat(modFile);
          return path;
        } catch {
          // Not a DenoGenesis directory, continue searching
        }
      }
    } catch {
      // Path doesn't exist, continue
    }
  }
  
  // Fallback to current directory
  console.warn('⚠️ Could not detect DenoGenesis framework path, using current directory');
  return Deno.cwd();
}

// =============================================================================
// SITE DISCOVERY AND MONITORING - COMPOSABLE FUNCTIONS
// =============================================================================

/**
 * Discover all connected sites
 * Unix Philosophy: Filesystem as source of truth
 * 
 * @returns Promise<SiteInfo[]> array of discovered sites
 */
export async function getConnectedSites(): Promise<SiteInfo[]> {
  const frameworkPath = await getFrameworkPath();
  const sites: SiteInfo[] = [];
  
  try {
    const sitesPath = `${frameworkPath}/sites`;
    const siteDirs = await readDirectory(sitesPath);
    
    for (const siteDir of siteDirs) {
      const sitePath = `${sitesPath}/${siteDir}`;
      const siteInfo = await analyzeSite(siteDir, sitePath);
      sites.push(siteInfo);
    }
    
    console.log(`📍 Discovered ${sites.length} sites`);
  } catch (error) {
    console.warn(`⚠️ Could not scan sites directory: ${error.message}`);
  }
  
  return sites.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Analyze individual site
 * Unix Philosophy: Pure function with clear inputs/outputs
 * 
 * @param siteName Site directory name
 * @param sitePath Full path to site
 * @returns Promise<SiteInfo> site analysis result
 */
async function analyzeSite(siteName: string, sitePath: string): Promise<SiteInfo> {
  const currentTime = new Date().toISOString();
  
  try {
    // Check if site has framework links
    const hasFrameworkLinks = await checkFrameworkLinks(sitePath);
    
    if (!hasFrameworkLinks) {
      return {
        name: siteName,
        path: sitePath,
        status: 'inactive',
        frameworkVersion: 'not-linked',
        versionMatch: false,
        lastChecked: currentTime
      };
    }
    
    // Determine framework version
    const frameworkVersion = await getSiteFrameworkVersion(sitePath);
    const currentFrameworkVersion = getFrameworkVersion().version;
    const versionMatch = frameworkVersion === currentFrameworkVersion;
    
    // Check site status
    const { status, port, responseTime } = await getSiteStatus(siteName);
    
    return {
      name: siteName,
      path: sitePath,
      port,
      status,
      frameworkVersion,
      versionMatch,
      lastChecked: currentTime,
      responseTime
    };
  } catch (error) {
    console.warn(`⚠️ Error analyzing site ${siteName}: ${error.message}`);
    
    return {
      name: siteName,
      path: sitePath,
      status: 'error',
      frameworkVersion: 'error',
      versionMatch: false,
      lastChecked: currentTime
    };
  }
}

/**
 * Check if site has framework symbolic links
 * Unix Philosophy: Filesystem inspection for truth
 * 
 * @param sitePath Path to site directory
 * @returns Promise<boolean> true if framework links exist
 */
async function checkFrameworkLinks(sitePath: string): Promise<boolean> {
  const frameworkDirs = ['middleware', 'database', 'config', 'utils', 'types'];
  
  for (const dir of frameworkDirs) {
    try {
      const stat = await Deno.lstat(`${sitePath}/${dir}`);
      if (stat.isSymlink) {
        return true; // Found at least one framework symlink
      }
    } catch {
      // Directory doesn't exist or not accessible
    }
  }
  
  return false;
}

/**
 * Get site's framework version
 * Unix Philosophy: Read from authoritative source
 * 
 * @param sitePath Path to site directory
 * @returns Promise<string> framework version or 'unknown'
 */
async function getSiteFrameworkVersion(sitePath: string): Promise<string> {
  try {
    // Try to read version from linked VERSION file
    const versionPath = `${sitePath}/VERSION`;
    const versionContent = await Deno.readTextFile(versionPath);
    return versionContent.trim().split('|')[0] || 'unknown';
  } catch {
    // Fallback: Check if middleware link points to current framework
    try {
      const middlewarePath = await Deno.readLink(`${sitePath}/middleware`);
      if (middlewarePath.includes('deno-genesis/core/middleware')) {
        return getFrameworkVersion().version;
      }
    } catch {
      // Could not determine version
    }
    return 'unknown';
  }
}

/**
 * Get site operational status
 * Unix Philosophy: Network check for live status
 * 
 * @param siteName Site identifier
 * @returns Promise<{status, port?, responseTime?}> site status
 */
async function getSiteStatus(siteName: string): Promise<{
  status: 'active' | 'inactive' | 'error';
  port?: number;
  responseTime?: number;
}> {
  // Map site names to expected ports
  const sitePortMap: Record<string, number> = {
    'domingueztechsolutions-com': 3000,
    'heavenlyroofingok-com': 3001,
    'okdevs-xyz': 3002,
    'pedromdominguez-com': 3003,
    'efficientmoversllc-com': 3004,
    // Add common variations
    'domtech': 3000,
    'heavenlyroofing': 3001,
    'okdevs': 3002,
    'pedromdominguez': 3003,
    'efficientmovers': 3004
  };
  
  const port = sitePortMap[siteName];
  if (!port) {
    return { status: 'inactive' };
  }
  
  try {
    const startTime = performance.now();
    
    // Quick health check
    const response = await fetch(`http://localhost:${port}/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    
    const responseTime = performance.now() - startTime;
    
    return {
      status: response.ok ? 'active' : 'error',
      port,
      responseTime: Math.round(responseTime)
    };
  } catch {
    return { 
      status: 'inactive', 
      port 
    };
  }
}

// =============================================================================
// FRAMEWORK INTEGRITY VALIDATION - COMPREHENSIVE CHECKS
// =============================================================================

/**
 * Basic framework integrity validation (legacy compatibility)
 * Unix Philosophy: Maintain backward compatibility
 * 
 * @returns Promise<FrameworkIntegrityResult> basic integrity result
 */
export async function validateFrameworkIntegrity(): Promise<FrameworkIntegrityResult> {
  const result: FrameworkIntegrityResult = {
    overall: true,
    checks: {
      coreModules: true,
      configuration: true,
      dependencies: true,
      fileSystem: true,
      environment: true,
    },
    details: {
      missingFiles: [],
      configErrors: [],
      dependencyIssues: [],
      permissions: [],
      warnings: [],
    },
    timestamp: Date.now(),
  };

  try {
    const frameworkPath = await getFrameworkPath();
    
    // Core Module Validation
    const requiredCoreFiles = [
      'mod.ts',
      'VERSION',
      'core/meta.ts',
      'core/middleware/index.ts',
      'core/config/env.ts'
    ];

    for (const filePath of requiredCoreFiles) {
      const fullPath = `${frameworkPath}/${filePath}`;
      try {
        const fileInfo = await Deno.stat(fullPath);
        if (!fileInfo.isFile) {
          result.details.missingFiles?.push(filePath);
          result.checks.coreModules = false;
        }
      } catch {
        result.details.missingFiles?.push(filePath);
        result.checks.coreModules = false;
      }
    }

    // File System Permissions
    try {
      await Deno.stat(frameworkPath);
      await Deno.readTextFile(`${frameworkPath}/VERSION`);
    } catch {
      result.details.permissions?.push("Insufficient file system permissions");
      result.checks.fileSystem = false;
    }

    // Environment Validation
    if (DENO_ENV === 'production' && BUILD_HASH === 'dev') {
      result.details.warnings?.push("Production environment with development build");
      result.checks.environment = false;
    }

    // Set overall result
    result.overall = Object.values(result.checks).every(check => check);

  } catch (error) {
    result.overall = false;
    result.details.configErrors?.push(`Validation error: ${error.message}`);
  }

  return result;
}

/**
 * Comprehensive framework integrity validation
 * Unix Philosophy: Thorough, composable validation
 * 
 * @returns Promise<IntegrityCheckResult> detailed validation results
 */
export async function validateFrameworkIntegrityDetailed(): Promise<IntegrityCheckResult> {
  const result: IntegrityCheckResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: [],
    timestamp: new Date().toISOString(),
    summary: { passed: 0, failed: 0, warnings: 0, total: 0 }
  };

  console.log("🔍 Starting comprehensive framework integrity validation...");

  try {
    // 1. Validate core framework structure
    await validateCoreStructure(result);

    // 2. Validate VERSION file
    await validateVersionFile(result);

    // 3. Validate site structure and links
    await validateSiteStructure(result);

    // 4. Validate framework-site version compatibility
    await validateVersionCompatibility(result);

    // 5. Validate critical dependencies
    await validateDependencies(result);

    // Calculate summary
    result.summary.passed = result.checks.filter(c => c.status === 'passed').length;
    result.summary.failed = result.checks.filter(c => c.status === 'failed').length;
    result.summary.warnings = result.checks.filter(c => c.status === 'warning').length;
    result.summary.total = result.checks.length;

    // Set overall validity (no critical failures)
    result.valid = result.checks.filter(check => 
      check.category === 'critical' && check.status === 'failed'
    ).length === 0;

    console.log(`✅ Integrity validation complete: ${result.summary.passed} passed, ${result.summary.failed} failed, ${result.summary.warnings} warnings`);

  } catch (error) {
    console.error(`❌ Integrity validation failed: ${error.message}`);
    result.valid = false;
    result.errors.push(`Validation process failed: ${error.message}`);
    
    result.checks.push({
      name: 'Validation Process',
      category: 'critical',
      status: 'failed',
      message: `Integrity validation encountered an error: ${error.message}`
    });
  }

  return result;
}

// =============================================================================
// DETAILED VALIDATION FUNCTIONS - COMPOSABLE UNITS
// =============================================================================

/**
 * Validate core framework directory structure
 * Unix Philosophy: Check filesystem for required components
 */
async function validateCoreStructure(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = await getFrameworkPath();
  
  const requiredDirectories = [
    'core',
    'core/middleware',
    'core/database',
    'core/config',
    'core/utils',
    'core/types',
    'sites'
  ];

  const requiredFiles = [
    'VERSION',
    'mod.ts',
    'core/meta.ts',
    'core/middleware/index.ts',
    'core/config/env.ts'
  ];

  // Check directories
  for (const dir of requiredDirectories) {
    const fullPath = `${frameworkPath}/${dir}`;
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isDirectory) {
        result.checks.push({
          name: `Core Directory: ${dir}`,
          category: 'critical',
          status: 'passed',
          message: 'Directory exists and is accessible'
        });
      } else {
        result.errors.push(`${dir} 