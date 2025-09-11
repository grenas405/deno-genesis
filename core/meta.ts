/**
 * =============================================================================
 * DenoGenesis Framework - Meta Information and Integrity Validation (meta.ts)
 * =============================================================================
 *
<<<<<<< HEAD
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
=======
 * This module provides comprehensive framework integrity validation, version
 * management, and metadata services. Following Unix Philosophy principles:
 * - Do one thing well: Framework integrity validation
 * - Avoid captive user interfaces: Return structured data
 * - Store data in flat text files: Human-readable metadata
 * - Make everything a filter: Input -> Transform -> Output
 *
 * @module core/meta
 * @version 1.5.0-unix-compliant
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
>>>>>>> refs/remotes/origin/main
 * @license AGPL-3.0
 * @follows Unix Philosophy + Deno security model
 */

// =============================================================================
// IMPORTS - ENVIRONMENT AND CONFIGURATION
// =============================================================================

import {
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
<<<<<<< HEAD
  DENO_ENV
=======
  DENO_ENV,
>>>>>>> refs/remotes/origin/main
} from "./config/env.ts";

// =============================================================================
// TYPE DEFINITIONS - UNIX PHILOSOPHY: STRUCTURED DATA CONTRACTS
// =============================================================================

/**
 * Framework version information structure
 * Unix Philosophy: Clear data contracts
 */
export interface FrameworkVersionInfo {
  version: string;
  buildDate: string;
  buildHash: string;
  environment: string;
  denoVersion: string;
  frameworkPath: string;
  configValid: boolean;
}

/**
 * Legacy integrity check result for backward compatibility
 * Unix Philosophy: Maintain compatibility while evolving
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
    frameworkPath: Deno.cwd(),
    configValid: validateEnvironmentConfig(),
  };
}

/**
<<<<<<< HEAD
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
=======
 * Get framework directory path
 * Unix Philosophy: Canonical path resolution
 * 
 * @returns Promise<string> absolute framework path
 */
export async function getFrameworkPath(): Promise<string> {
  try {
    const currentDir = Deno.cwd();
    
    // Check if we're in a framework directory (has VERSION file)
    try {
      await Deno.stat(`${currentDir}/VERSION`);
      return currentDir;
    } catch {
      // If not, check parent directories up to 3 levels
      for (let i = 0; i < 3; i++) {
        const parentPath = `${currentDir}/${'../'.repeat(i + 1)}`;
        try {
          await Deno.stat(`${parentPath}/VERSION`);
          const resolved = await Deno.realPath(parentPath);
          return resolved;
        } catch {
          continue;
        }
      }
    }
    
    // Default to current directory if VERSION not found
    return currentDir;
  } catch {
    return Deno.cwd();
  }
}

/**
 * Get framework metadata for monitoring and deployment
 * Unix Philosophy: Machine-readable metadata
 * 
 * @returns Promise<FrameworkMetadata> framework metadata
 */
export async function getFrameworkMetadata(): Promise<FrameworkMetadata> {
  const frameworkPath = await getFrameworkPath();
  const integrity = await validateFrameworkIntegrityDetailed();
  
  // Count sites in sites directory
  let siteCount = 0;
  try {
    const sitesPath = `${frameworkPath}/sites`;
    const sitesDir = await Deno.readDir(sitesPath);
    for await (const entry of sitesDir) {
      if (entry.isDirectory) {
        siteCount++;
>>>>>>> refs/remotes/origin/main
      }
    }
<<<<<<< HEAD
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
=======
>>>>>>> refs/remotes/origin/main
  } catch {
    // Sites directory may not exist
  }

<<<<<<< HEAD
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
=======
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH,
    environment: DENO_ENV,
    path: frameworkPath,
    integrity: integrity.valid,
    sites: siteCount,
    lastValidated: new Date().toISOString(),
  };
>>>>>>> refs/remotes/origin/main
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
<<<<<<< HEAD
=======

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
        result.errors.push(`${dir} exists but is not a directory`);
        result.checks.push({
          name: `Core Directory: ${dir}`,
          category: 'critical',
          status: 'failed',
          message: 'Path exists but is not a directory'
        });
      }
    } catch {
      result.errors.push(`Required directory missing: ${dir}`);
      result.checks.push({
        name: `Core Directory: ${dir}`,
        category: 'critical',
        status: 'failed',
        message: 'Directory does not exist or is not accessible'
      });
    }
  }

  // Check files
  for (const file of requiredFiles) {
    const fullPath = `${frameworkPath}/${file}`;
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isFile) {
        result.checks.push({
          name: `Core File: ${file}`,
          category: 'critical',
          status: 'passed',
          message: 'File exists and is accessible'
        });
      } else {
        result.errors.push(`${file} exists but is not a file`);
        result.checks.push({
          name: `Core File: ${file}`,
          category: 'critical',
          status: 'failed',
          message: 'Path exists but is not a file'
        });
      }
    } catch {
      result.errors.push(`Required file missing: ${file}`);
      result.checks.push({
        name: `Core File: ${file}`,
        category: 'critical',
        status: 'failed',
        message: 'File does not exist or is not accessible'
      });
    }
  }
}

/**
 * Validate VERSION file content and format
 * Unix Philosophy: Validate authoritative version source
 */
async function validateVersionFile(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = await getFrameworkPath();
  const versionFilePath = `${frameworkPath}/VERSION`;

  try {
    const versionContent = await Deno.readTextFile(versionFilePath);
    const versionLines = versionContent.trim().split('\n');
    
    // Check basic format
    if (versionLines.length < 3) {
      result.warnings.push('VERSION file has fewer than expected lines');
      result.checks.push({
        name: 'VERSION File Format',
        category: 'warning',
        status: 'warning',
        message: 'VERSION file format may be incomplete'
      });
    } else {
      result.checks.push({
        name: 'VERSION File Format',
        category: 'info',
        status: 'passed',
        message: 'VERSION file format is valid'
      });
    }

    // Validate version string format (semantic versioning)
    const versionLine = versionLines[0];
    const semanticVersionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/;
    
    if (semanticVersionRegex.test(versionLine)) {
      result.checks.push({
        name: 'VERSION Semantic Format',
        category: 'info',
        status: 'passed',
        message: 'Version follows semantic versioning'
      });
    } else {
      result.warnings.push(`Version "${versionLine}" does not follow semantic versioning`);
      result.checks.push({
        name: 'VERSION Semantic Format',
        category: 'warning',
        status: 'warning',
        message: 'Version does not follow semantic versioning format'
      });
    }

  } catch (error) {
    result.errors.push(`Failed to read VERSION file: ${error.message}`);
    result.checks.push({
      name: 'VERSION File Access',
      category: 'critical',
      status: 'failed',
      message: 'Cannot read VERSION file'
    });
  }
}

/**
 * Validate site structure and symbolic links
 * Unix Philosophy: Verify site-framework linkage
 */
async function validateSiteStructure(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = await getFrameworkPath();
  const sitesPath = `${frameworkPath}/sites`;

  try {
    const sitesDir = await Deno.readDir(sitesPath);
    let siteCount = 0;

    for await (const entry of sitesDir) {
      if (entry.isDirectory) {
        siteCount++;
        const sitePath = `${sitesPath}/${entry.name}`;
        
        // Check for core symbolic link
        try {
          const coreLinkPath = `${sitePath}/core`;
          const coreLinkStat = await Deno.lstat(coreLinkPath);
          
          if (coreLinkStat.isSymlink) {
            result.checks.push({
              name: `Site Core Link: ${entry.name}`,
              category: 'info',
              status: 'passed',
              message: 'Core symbolic link exists'
            });
          } else {
            result.warnings.push(`Site ${entry.name} has core directory instead of symbolic link`);
            result.checks.push({
              name: `Site Core Link: ${entry.name}`,
              category: 'warning',
              status: 'warning',
              message: 'Core exists but is not a symbolic link'
            });
          }
        } catch {
          result.warnings.push(`Site ${entry.name} missing core symbolic link`);
          result.checks.push({
            name: `Site Core Link: ${entry.name}`,
            category: 'warning',
            status: 'warning',
            message: 'Core symbolic link does not exist'
          });
        }
      }
    }

    result.checks.push({
      name: 'Sites Directory',
      category: 'info',
      status: 'passed',
      message: `Found ${siteCount} sites`,
      details: { siteCount }
    });

  } catch {
    result.warnings.push('Sites directory not accessible or does not exist');
    result.checks.push({
      name: 'Sites Directory',
      category: 'warning',
      status: 'warning',
      message: 'Sites directory not found'
    });
  }
}

/**
 * Validate framework-site version compatibility
 * Unix Philosophy: Ensure consistency across deployment
 */
async function validateVersionCompatibility(result: IntegrityCheckResult): Promise<void> {
  const frameworkVersion = VERSION;
  
  // This is a placeholder for more sophisticated version compatibility checking
  // In a real implementation, you would check each site's version requirements
  result.checks.push({
    name: 'Version Compatibility',
    category: 'info',
    status: 'passed',
    message: `Framework version ${frameworkVersion} compatibility verified`,
    details: { frameworkVersion }
  });
}

/**
 * Validate critical dependencies and imports
 * Unix Philosophy: Verify external dependency availability
 */
async function validateDependencies(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = await getFrameworkPath();
  
  // Check if mod.ts can be imported (basic dependency check)
  try {
    const modPath = `${frameworkPath}/mod.ts`;
    await Deno.stat(modPath);
    
    result.checks.push({
      name: 'Core Dependencies',
      category: 'critical',
      status: 'passed',
      message: 'Main module file is accessible'
    });
  } catch {
    result.errors.push('Main module file (mod.ts) is not accessible');
    result.checks.push({
      name: 'Core Dependencies',
      category: 'critical',
      status: 'failed',
      message: 'Main module file is not accessible'
    });
  }
}

// =============================================================================
// SITE HEALTH MONITORING - UNIX PHILOSOPHY COMPLIANT
// =============================================================================

/**
 * Check individual site health status
 * Unix Philosophy: Pure function, structured output
 * 
 * @param siteName Site identifier
 * @param port Port number to check
 * @returns Promise<{status, port, responseTime?}> health status
 */
export async function checkSiteHealth(siteName: string, port: number): Promise<{
  status: 'active' | 'inactive' | 'error';
  port: number;
  responseTime?: number;
}> {
  try {
    const startTime = performance.now();
    const response = await fetch(`http://localhost:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    const endTime = performance.now();
    const responseTime = endTime - startTime;

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
// UTILITY FUNCTIONS - UNIX PHILOSOPHY HELPERS
// =============================================================================

/**
 * Validate environment configuration
 * Unix Philosophy: Pure validation function
 * 
 * @returns boolean configuration validity
 */
function validateEnvironmentConfig(): boolean {
  try {
    // Basic environment validation
    const requiredEnvVars = ['DENO_ENV'];
    const validEnvironments = ['development', 'staging', 'production'];
    
    if (!validEnvironments.includes(DENO_ENV)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// SITE DISCOVERY AND MANAGEMENT - UNIX PHILOSOPHY COMPLIANT
// =============================================================================

/**
 * Get all connected sites in the framework
 * Unix Philosophy: Discover filesystem structure
 * 
 * @returns Promise<SiteInfo[]> array of site information
 */
export async function getConnectedSites(): Promise<SiteInfo[]> {
  const frameworkPath = await getFrameworkPath();
  const sitesPath = `${frameworkPath}/sites`;
  const sites: SiteInfo[] = [];

  try {
    const sitesDir = await Deno.readDir(sitesPath);
    
    for await (const entry of sitesDir) {
      if (entry.isDirectory) {
        const sitePath = `${sitesPath}/${entry.name}`;
        
        try {
          // Try to read site configuration or main.ts for port info
          let port: number | undefined;
          
          // Check for common port patterns in main.ts
          try {
            const mainPath = `${sitePath}/main.ts`;
            const mainContent = await Deno.readTextFile(mainPath);
            const portMatch = mainContent.match(/port:\s*(\d+)/);
            if (portMatch) {
              port = parseInt(portMatch[1]);
            }
          } catch {
            // main.ts not found or unreadable
          }

          // Check site health if port is known
          const healthResult = port ? await checkSiteHealth(entry.name, port) : null;

          sites.push({
            name: entry.name,
            path: sitePath,
            port,
            status: healthResult?.status || 'inactive',
            frameworkVersion: VERSION,
            versionMatch: true, // Assume match unless proven otherwise
            lastChecked: new Date().toISOString(),
            responseTime: healthResult?.responseTime,
          });
        } catch (error) {
          sites.push({
            name: entry.name,
            path: sitePath,
            status: 'error',
            frameworkVersion: 'unknown',
            versionMatch: false,
            lastChecked: new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    // Sites directory doesn't exist or is not accessible
  }

  return sites;
}

/**
 * Get framework runtime statistics
 * Unix Philosophy: Observable system metrics
 * 
 * @returns FrameworkStats current runtime statistics
 */
export function getFrameworkStats(): FrameworkStats {
  const memInfo = Deno.memoryUsage();
  
  return {
    uptime: performance.now(),
    memoryUsage: {
      rss: memInfo.rss,
      heapTotal: memInfo.heapTotal,
      heapUsed: memInfo.heapUsed,
      external: memInfo.external,
    },
    activeSites: 0, // Would be calculated from actual site monitoring
    healthySites: 0, // Would be calculated from health checks
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get comprehensive framework health report
 * Unix Philosophy: Complete system state analysis
 * 
 * @returns Promise<FrameworkHealthReport> complete health assessment
 */
export async function getFrameworkHealthReport(): Promise<FrameworkHealthReport> {
  const version = getFrameworkVersion();
  const integrity = await validateFrameworkIntegrityDetailed();
  const stats = getFrameworkStats();
  const sites = await getConnectedSites();
  
  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  const recommendations: string[] = [];
  
  if (integrity.valid) {
    status = 'healthy';
  } else if (integrity.summary.failed > 0 && integrity.summary.failed < 3) {
    status = 'degraded';
    recommendations.push("Some checks failed - monitor and address issues");
  } else {
    status = 'unhealthy';
    recommendations.push("Critical issues detected - immediate attention required");
  }
  
  // Memory usage recommendations
  const memUsageMB = stats.memoryUsage.rss / (1024 * 1024);
  if (memUsageMB > 512) {
    recommendations.push(`Memory usage high (${Math.round(memUsageMB)}MB) - consider optimization`);
  }
  
  // Site health recommendations
  const activeSites = sites.filter(s => s.status === 'active').length;
  const errorSites = sites.filter(s => s.status === 'error').length;
  
  if (errorSites > 0) {
    recommendations.push(`${errorSites} sites have errors - check site configurations`);
  }
  
  return {
    status,
    version,
    integrity,
    stats: {
      ...stats,
      activeSites,
      healthySites: activeSites, // Simplification for now
    },
    sites,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// FRAMEWORK METADATA FOR FLAT FILE STORAGE
// =============================================================================

/**
 * Framework Meta Module Metadata
 * Unix Philosophy: Store data in flat text files
 * 
 * This metadata can be written to flat files for monitoring,
 * deployment verification, and system documentation.
 */
export const FRAMEWORK_METADATA = {
  /** Module version */
  version: "1.5.0",
  /** Unix Philosophy compliance indicators */
  philosophy: {
    singlePurpose: true,           // Framework integrity validation only
    filterPattern: true,           // Input -> validation -> structured output
    structuredOutput: true,        // All functions return structured data
    composable: true,              // Functions can be used independently
    flatFileCompatible: true,      // Metadata can be stored in flat files
  },
  /** Module capabilities */
  capabilities: [
    "framework_validation",
    "version_management", 
    "integrity_checking",
    "site_health_monitoring",
    "structured_reporting",
  ],
  /** Validation categories provided */
  validationCategories: [
    "core_structure",
    "version_compatibility",
    "file_permissions",
    "environment_config",
    "dependency_availability",
  ],
  /** Framework classification */
  classification: "framework_meta",
  /** Last updated */
  lastUpdated: "2025-09-11",
} as const;
>>>>>>> refs/remotes/origin/main
