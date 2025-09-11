#!/usr/bin/env -S deno run --allow-read --allow-env --allow-run --allow-net
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
    frameworkName: "DenoGenesis",
    timestamp: Date.now(),
  };
}

/**
 * Get framework metadata for automation tools
 * Unix Philosophy: Structured data for tool composition
 *
 * @returns FrameworkMetadata for external tools
 */
export async function getFrameworkMetadata(): Promise<FrameworkMetadata> {
  const frameworkPath = await getFrameworkPath();
  const sites = await discoverSites();

  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH,
    environment: DENO_ENV,
    path: frameworkPath,
    integrity: true, // Would be calculated from full validation
    sites: sites.length,
    lastValidated: new Date().toISOString(),
  };
}

// =============================================================================
// FRAMEWORK PATH DISCOVERY - UNIX PHILOSOPHY: FILE SYSTEM INTROSPECTION
// =============================================================================

/**
 * Discover framework root path dynamically
 * Unix Philosophy: Work with filesystem as data source
 *
 * @returns Promise<string> absolute path to framework root
 */
export async function getFrameworkPath(): Promise<string> {
  // Start from current working directory
  let currentPath = Deno.cwd();

  // Search upward for framework markers
  while (currentPath !== "/") {
    try {
      // Check for framework markers
      const versionFile = `${currentPath}/VERSION`;
      const modFile = `${currentPath}/mod.ts`;
      const coreDir = `${currentPath}/core`;

      const [versionExists, modExists, coreExists] = await Promise.allSettled([
        Deno.stat(versionFile),
        Deno.stat(modFile),
        Deno.stat(coreDir)
      ]);

      if (versionExists.status === 'fulfilled' &&
          modExists.status === 'fulfilled' &&
          coreExists.status === 'fulfilled') {
        return currentPath;
      }
    } catch {
      // Continue searching
    }

    // Move up one directory
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parentPath === currentPath) break; // Reached root
    currentPath = parentPath;
  }

  // Fallback to current working directory
  return Deno.cwd();
}

// =============================================================================
// SITE DISCOVERY - UNIX PHILOSOPHY: FILESYSTEM AS DATABASE
// =============================================================================

/**
 * Discover all sites in the framework
 * Unix Philosophy: Filesystem introspection for site management
 *
 * @returns Promise<SiteInfo[]> array of discovered sites
 */
export async function discoverSites(): Promise<SiteInfo[]> {
  const frameworkPath = await getFrameworkPath();
  const sitesPath = `${frameworkPath}/sites`;
  const sites: SiteInfo[] = [];

  try {
    const sitesDir = await Deno.readDir(sitesPath);

    for await (const entry of sitesDir) {
      if (entry.isDirectory) {
        const siteInfo = await analyzeSite(entry.name, `${sitesPath}/${entry.name}`);
        sites.push(siteInfo);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not read sites directory: ${error.message}`);
  }

  return sites;
}

/**
 * Analyze individual site for health and compatibility
 * Unix Philosophy: Composable site analysis function
 *
 * @param siteName string name of the site
 * @param sitePath string path to site directory
 * @returns Promise<SiteInfo> site analysis results
 */
export async function analyzeSite(siteName: string, sitePath: string): Promise<SiteInfo> {
  const siteInfo: SiteInfo = {
    name: siteName,
    path: sitePath,
    status: 'inactive',
    frameworkVersion: 'unknown',
    versionMatch: false,
    lastChecked: new Date().toISOString(),
  };

  try {
    // Check for main.ts or other entry points
    const entryPoints = ['main.ts', 'app.ts', 'server.ts'];
    let hasEntryPoint = false;

    for (const entry of entryPoints) {
      try {
        await Deno.stat(`${sitePath}/${entry}`);
        hasEntryPoint = true;
        break;
      } catch {
        // Continue checking
      }
    }

    if (!hasEntryPoint) {
      siteInfo.status = 'error';
      return siteInfo;
    }

    // Try to determine site's framework version
    try {
      const packageInfo = await readSiteVersion(sitePath);
      siteInfo.frameworkVersion = packageInfo.version;
      siteInfo.versionMatch = packageInfo.version === VERSION;
    } catch {
      // Site might not have version info
    }

    // Try to check if site is running (basic port check)
    const port = await detectSitePort(sitePath);
    if (port) {
      siteInfo.port = port;
      const healthCheck = await checkSiteHealth(port);
      siteInfo.status = healthCheck.status;
      siteInfo.responseTime = healthCheck.responseTime;
    }

  } catch (error) {
    siteInfo.status = 'error';
    console.warn(`⚠️ Error analyzing site ${siteName}: ${error.message}`);
  }

  return siteInfo;
}

/**
 * Read site version information
 * Unix Philosophy: Parse configuration files as data
 */
async function readSiteVersion(sitePath: string): Promise<{ version: string }> {
  // Try multiple version sources
  const versionSources = [
    `${sitePath}/VERSION`,
    `${sitePath}/package.json`,
    `${sitePath}/deno.json`,
  ];

  for (const source of versionSources) {
    try {
      const content = await Deno.readTextFile(source);

      if (source.endsWith('VERSION')) {
        return { version: content.trim() };
      } else if (source.endsWith('.json')) {
        const parsed = JSON.parse(content);
        if (parsed.version) {
          return { version: parsed.version };
        }
      }
    } catch {
      // Continue to next source
    }
  }

  throw new Error('No version information found');
}

/**
 * Detect site port from configuration
 * Unix Philosophy: Extract data from configuration files
 */
async function detectSitePort(sitePath: string): Promise<number | undefined> {
  const configFiles = [
    `${sitePath}/.env`,
    `${sitePath}/config.json`,
    `${sitePath}/site-config.ts`,
  ];

  for (const configFile of configFiles) {
    try {
      const content = await Deno.readTextFile(configFile);

      // Look for port configuration patterns
      const portMatch = content.match(/PORT\s*[=:]\s*(\d+)/i);
      if (portMatch) {
        return parseInt(portMatch[1], 10);
      }
    } catch {
      // Continue to next file
    }
  }

  return undefined;
}

/**
 * Perform basic health check on a site
 * Unix Philosophy: Simple, composable health checking
 */
async function checkSiteHealth(port: number): Promise<{ status: 'active' | 'inactive' | 'error', responseTime?: number }> {
  try {
    const startTime = Date.now();
    const response = await fetch(`http://localhost:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    const responseTime = Date.now() - startTime;

    return {
      status: response.ok ? 'active' : 'error',
      responseTime: responseTime
    };
  } catch {
    return {
      status: 'inactive'
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
        result.errors.push(`${dir} exists but is not a directory`);
        result.checks.push({
          name: `Core Directory: ${dir}`,
          category: 'critical',
          status: 'failed',
          message: 'Path exists but is not a directory'
        });
      }
    } catch {
      result.errors.push(`Missing required directory: ${dir}`);
      result.checks.push({
        name: `Core Directory: ${dir}`,
        category: 'critical',
        status: 'failed',
        message: 'Required directory does not exist'
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
      result.errors.push(`Missing required file: ${file}`);
      result.checks.push({
        name: `Core File: ${file}`,
        category: 'critical',
        status: 'failed',
        message: 'Required file does not exist'
      });
    }
  }
}

/**
 * Validate VERSION file content
 * Unix Philosophy: Validate configuration data
 */
async function validateVersionFile(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = await getFrameworkPath();
  const versionFile = `${frameworkPath}/VERSION`;

  try {
    const versionContent = await Deno.readTextFile(versionFile);
    const fileVersion = versionContent.trim();

    if (fileVersion === VERSION) {
      result.checks.push({
        name: 'VERSION File Consistency',
        category: 'critical',
        status: 'passed',
        message: `Version ${VERSION} matches environment configuration`
      });
    } else {
      result.errors.push(`VERSION file (${fileVersion}) does not match environment (${VERSION})`);
      result.checks.push({
        name: 'VERSION File Consistency',
        category: 'critical',
        status: 'failed',
        message: `Version mismatch: file=${fileVersion}, env=${VERSION}`
      });
    }

    // Validate version format (semantic versioning)
    const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9\-]+)?$/;
    if (semverPattern.test(fileVersion)) {
      result.checks.push({
        name: 'VERSION Format Validation',
        category: 'info',
        status: 'passed',
        message: 'Version follows semantic versioning format'
      });
    } else {
      result.warnings.push(`VERSION format does not follow semantic versioning: ${fileVersion}`);
      result.checks.push({
        name: 'VERSION Format Validation',
        category: 'warning',
        status: 'warning',
        message: 'Version should follow semantic versioning (x.y.z)'
      });
    }

  } catch (error) {
    result.errors.push(`Cannot read VERSION file: ${error.message}`);
    result.checks.push({
      name: 'VERSION File Access',
      category: 'critical',
      status: 'failed',
      message: `Unable to read VERSION file: ${error.message}`
    });
  }
}

/**
 * Validate site structure and symbolic links
 * Unix Philosophy: Validate filesystem relationships
 */
async function validateSiteStructure(result: IntegrityCheckResult): Promise<void> {
  const sites = await discoverSites();

  if (sites.length === 0) {
    result.warnings.push('No sites discovered in framework');
    result.checks.push({
      name: 'Site Discovery',
      category: 'warning',
      status: 'warning',
      message: 'No sites found in sites/ directory'
    });
    return;
  }

  result.checks.push({
    name: 'Site Discovery',
    category: 'info',
    status: 'passed',
    message: `Discovered ${sites.length} site(s)`
  });

  for (const site of sites) {
    result.checks.push({
      name: `Site: ${site.name}`,
      category: 'info',
      status: site.status === 'error' ? 'warning' : 'passed',
      message: `Site status: ${site.status}, version: ${site.frameworkVersion}`
    });

    if (!site.versionMatch && site.frameworkVersion !== 'unknown') {
      result.warnings.push(`Site ${site.name} version mismatch: ${site.frameworkVersion} vs ${VERSION}`);
      result.checks.push({
        name: `Version Match: ${site.name}`,
        category: 'warning',
        status: 'warning',
        message: `Site uses different framework version`
      });
    }
  }
}

/**
 * Validate framework-site version compatibility
 * Unix Philosophy: Data validation and compatibility checking
 */
async function validateVersionCompatibility(result: IntegrityCheckResult): Promise<void> {
  const sites = await discoverSites();
  let compatibilityIssues = 0;

  for (const site of sites) {
    if (site.frameworkVersion !== 'unknown' && !site.versionMatch) {
      compatibilityIssues++;
    }
  }

  if (compatibilityIssues === 0) {
    result.checks.push({
      name: 'Framework-Site Compatibility',
      category: 'info',
      status: 'passed',
      message: 'All sites use compatible framework versions'
    });
  } else {
    result.warnings.push(`${compatibilityIssues} site(s) have version compatibility issues`);
    result.checks.push({
      name: 'Framework-Site Compatibility',
      category: 'warning',
      status: 'warning',
      message: `${compatibilityIssues} sites may have compatibility issues`
    });
  }
}

/**
 * Validate critical dependencies
 * Unix Philosophy: Verify external dependencies
 */
async function validateDependencies(result: IntegrityCheckResult): Promise<void> {
  // Check Deno version compatibility
  const denoVersion = Deno.version.deno;
  const minDenoVersion = "1.35.0"; // Minimum required version

  if (compareVersions(denoVersion, minDenoVersion) >= 0) {
    result.checks.push({
      name: 'Deno Version Compatibility',
      category: 'critical',
      status: 'passed',
      message: `Deno ${denoVersion} meets minimum requirement (${minDenoVersion})`
    });
  } else {
    result.errors.push(`Deno version ${denoVersion} is below minimum requirement ${minDenoVersion}`);
    result.checks.push({
      name: 'Deno Version Compatibility',
      category: 'critical',
      status: 'failed',
      message: `Deno version too old: ${denoVersion} < ${minDenoVersion}`
    });
  }

  // Validate environment configuration
  const requiredEnvVars = ['VERSION', 'BUILD_DATE', 'BUILD_HASH', 'DENO_ENV'];
  let missingEnvVars = 0;

  for (const envVar of requiredEnvVars) {
    const value = Deno.env.get(envVar);
    if (!value || value === 'undefined') {
      missingEnvVars++;
      result.warnings.push(`Environment variable ${envVar} is not set or invalid`);
    }
  }

  if (missingEnvVars === 0) {
    result.checks.push({
      name: 'Environment Variables',
      category: 'info',
      status: 'passed',
      message: 'All required environment variables are set'
    });
  } else {
    result.checks.push({
      name: 'Environment Variables',
      category: 'warning',
      status: 'warning',
      message: `${missingEnvVars} environment variables are missing or invalid`
    });
  }
}

/**
 * Compare semantic versions
 * Unix Philosophy: Pure function for version comparison
 */
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}

// =============================================================================
// COMPREHENSIVE HEALTH REPORTING - UNIX PHILOSOPHY: STRUCTURED OUTPUT
// =============================================================================

/**
 * Generate comprehensive framework health report
 * Unix Philosophy: Aggregate all health data into structured output
 *
 * @returns Promise<FrameworkHealthReport> complete system health report
 */
export async function generateHealthReport(): Promise<FrameworkHealthReport> {
  console.log("🏥 Generating comprehensive framework health report...");

  const version = getFrameworkVersion();
  const integrity = await validateFrameworkIntegrityDetailed();
  const sites = await discoverSites();
  const stats = getFrameworkStats();

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (!integrity.valid) {
    status = 'unhealthy';
  } else if (integrity.summary.warnings > 0 || sites.some(s => s.status === 'error')) {
    status = 'degraded';
  }

  // Generate recommendations based on findings
  const recommendations: string[] = [];

  if (integrity.summary.failed > 0) {
    recommendations.push("Address critical integrity failures immediately");
  }

  if (integrity.summary.warnings > 0) {
    recommendations.push("Review and resolve integrity warnings");
  }

  const inactiveSites = sites.filter(s => s.status === 'inactive').length;
  if (inactiveSites > 0) {
    recommendations.push(`Consider starting ${inactiveSites} inactive site(s)`);
  }

  const incompatibleSites = sites.filter(s => !s.versionMatch && s.frameworkVersion !== 'unknown').length;
  if (incompatibleSites > 0) {
    recommendations.push(`Update ${incompatibleSites} site(s) to use framework version ${VERSION}`);
  }

  if (recommendations.
