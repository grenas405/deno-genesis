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
// IMPORTS FROM CONFIG FOR VERSION INFORMATION
// =============================================================================

import { 
  VERSION, 
  BUILD_DATE, 
  BUILD_HASH, 
  DENO_ENV 
} from "../config/env.ts";

// =============================================================================
// TYPE DEFINITIONS - FRAMEWORK VERSION & STATS
// =============================================================================

/**
 * Framework version information structure
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
 * Basic framework integrity check result (legacy compatibility)
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

// =============================================================================
// TYPE DEFINITIONS - DETAILED INTEGRITY VALIDATION
// =============================================================================

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
// FRAMEWORK VERSION MANAGEMENT
// =============================================================================

/**
 * Get comprehensive framework version information
 * 
 * Returns detailed version information including build metadata,
 * environment details, and runtime information.
 * 
 * @returns FrameworkVersionInfo object with complete version details
 * 
 * @example
 * ```typescript
 * const versionInfo = getFrameworkVersion();
 * console.log(`Running DenoGenesis ${versionInfo.version} (${versionInfo.buildHash})`);
 * console.log(`Built on: ${versionInfo.buildDate}`);
 * console.log(`Environment: ${versionInfo.environment}`);
 * ```
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
            frameworkVersion: await getSiteFrameworkVersion(versionFile)
          });
        } catch {
          // Not a framework site, skip
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read sites directory: ${error.message}`);
  }

  return sites;
}

/**
 * Get framework version from a site's version file
 * 
 * @param versionFile Path to the site's FRAMEWORK_VERSION file
 * @returns Promise<string> with the framework version
 */
export async function getSiteFrameworkVersion(versionFile: string): Promise<string> {
  try {
    const content = await Deno.readTextFile(versionFile);
    return content.split('\n')[0];
  } catch {
    return 'unknown';
  }
}

/**
 * Check if a site is running by testing its health endpoint
 * 
 * @param port The port number to check
 * @returns Promise<boolean> indicating if the site is responding
 */
async function checkSiteRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// BASIC FRAMEWORK INTEGRITY VALIDATION (Legacy)
// =============================================================================

/**
 * Basic framework integrity validation for backward compatibility
 * 
 * Performs essential checks on framework components, configuration,
 * file system permissions, and runtime environment.
 * 
 * @returns Promise<FrameworkIntegrityResult> with basic validation results
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
    // Core Module Validation
    const requiredCoreFiles = [
      "./config/env.ts",
      "./core/middleware/index.ts",
      "./core/database/client.ts",
      "./core/meta.ts",
    ];

    for (const filePath of requiredCoreFiles) {
      try {
        const fileInfo = await Deno.stat(filePath);
        if (!fileInfo.isFile) {
          result.details.missingFiles?.push(filePath);
          result.checks.coreModules = false;
        }
      } catch {
        result.details.missingFiles?.push(filePath);
        result.checks.coreModules = false;
      }
    }

    // Configuration Validation
    const requiredEnvVars = [
      'PORT', 'DENO_ENV', 'SITE_KEY', 'SERVER_HOST', 
      'VERSION', 'BUILD_DATE', 'BUILD_HASH'
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        result.details.configErrors?.push(`Missing environment variable: ${envVar}`);
        result.checks.configuration = false;
      }
    }

    // Dependencies Validation
    try {
      const denoVersion = Deno.version.deno;
      if (!denoVersion) {
        result.details.dependencyIssues?.push("Deno runtime not accessible");
        result.checks.dependencies = false;
      }
    } catch {
      result.details.dependencyIssues?.push("Failed to check Deno version");
      result.checks.dependencies = false;
    }

    // File System Permissions
    try {
      await Deno.readDir(".");
      await Deno.stat("./mod.ts");
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

// =============================================================================
// COMPREHENSIVE FRAMEWORK INTEGRITY VALIDATION
// =============================================================================

/**
 * Comprehensive framework integrity validation with detailed reporting
 * 
 * Performs extensive validation including site structure, symbolic links,
 * version compatibility, and shared components.
 * 
 * @returns Promise<IntegrityCheckResult> with detailed validation results
 */
export async function validateFrameworkIntegrityDetailed(): Promise<IntegrityCheckResult> {
  const result: IntegrityCheckResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: []
  };

  console.log("🔍 Starting Comprehensive Framework Integrity Validation...");

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

    // 6. Validate shared components
    await validateSharedComponents(result);

    // Set overall validity based on critical errors
    result.valid = result.checks.filter(check => 
      check.category === 'critical' && check.status === 'failed'
    ).length === 0;

    // Generate summary
    const passed = result.checks.filter(c => c.status === 'passed').length;
    const failed = result.checks.filter(c => c.status === 'failed').length;
    const warnings = result.checks.filter(c => c.status === 'warning').length;

    console.log(`✅ Comprehensive integrity validation complete: ${passed} passed, ${failed} failed, ${warnings} warnings`);

    return result;

  } catch (error) {
    console.error("❌ Comprehensive framework integrity validation failed:", error);
    result.valid = false;
    result.errors.push(`Validation process failed: ${error.message}`);
    result.checks.push({
      name: 'Validation Process',
      category: 'critical',
      status: 'failed',
      message: `Integrity validation encountered an error: ${error.message}`
    });

    return result;
  }
}

// =============================================================================
// FRAMEWORK HEALTH REPORTING
// =============================================================================

/**
 * Generate comprehensive framework health report
 * 
 * @returns Promise<FrameworkHealthReport> with complete health assessment
 */
export async function getFrameworkHealthReport(): Promise<FrameworkHealthReport> {
  const integrity = await validateFrameworkIntegrityDetailed();
  const stats = getFrameworkStats();
  const version = getFrameworkVersion();
  
  // Update stats with site information
  const sites = await getConnectedSites();
  stats.activeSites = sites.length;
  stats.healthySites = sites.filter(site => site.status === 'active').length;
  
  // Determine overall health status
  let status: "healthy" | "degraded" | "unhealthy";
  const recommendations: string[] = [];
  
  if (integrity.valid && stats.healthySites === stats.activeSites) {
    status = "healthy";
  } else if (integrity.valid || stats.healthySites > 0) {
    status = "degraded";
    recommendations.push("Some systems require attention - monitor performance");
  } else {
    status = "unhealthy";
    recommendations.push("Critical issues detected - immediate attention required");
  }
  
  // Memory usage recommendations
  const memUsageMB = stats.memoryUsage.rss / (1024 * 1024);
  if (memUsageMB > 512) {
    recommendations.push(`Memory usage high (${Math.round(memUsageMB)}MB) - consider optimization`);
  }
  
  // Environment-specific recommendations
  if (version.environment === "production" && integrity.warnings?.length) {
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
    const integrity = await validateFrameworkIntegrity();
    
    if (integrity.overall) {
      console.log("✅ Framework integrity: PASSED");
    } else {
      console.log("⚠️  Framework integrity: ISSUES DETECTED");
      
      if (integrity.details.missingFiles?.length) {
        console.log("📄 Missing files:", integrity.details.missingFiles);
      }
      
      if (integrity.details.configErrors?.length) {
        console.log("⚙️  Config errors:", integrity.details.configErrors);
      }
      
      if (integrity.details.dependencyIssues?.length) {
        console.log("📦 Dependency issues:", integrity.details.dependencyIssues);
      }
      
      if (integrity.details.permissions?.length) {
        console.log("🔐 Permission issues:", integrity.details.permissions);
      }
    }
    
    if (integrity.details.warnings?.length) {
      console.log("⚠️  Warnings:", integrity.details.warnings);
    }
  }
  
  console.log("=".repeat(80) + "\n");
}

// =============================================================================
// DETAILED VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Validate core framework directory structure
 */
async function validateCoreStructure(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = "/home/admin/deno-genesis";
  const requiredDirectories = [
    "core",
    "core/middleware",
    "core/database", 
    "core/config",
    "core/utils",
    "core/types",
    "shared-components",
    "scripts",
    "sites"
  ];

  const requiredFiles = [
    "VERSION",
    "mod.ts",
    "core/meta.ts",
    "core/middleware/index.ts",
    "core/database/client.ts",
    "core/config/env.ts"
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
          message: `Directory exists and is accessible`
        });
      } else {
        result.errors.push(`${dir} exists but is not a directory`);
        result.checks.push({
          name: `Core Directory: ${dir}`,
          category: 'critical',
          status: 'failed',
          message: `Path exists but is not a directory`
        });
      }
    } catch {
      result.errors.push(`Core directory missing: ${dir}`);
      result.checks.push({
        name: `Core Directory: ${dir}`,
        category: 'critical',
        status: 'failed',
        message: `Required directory is missing or inaccessible`
      });
    }
  }

  // Check required files
  for (const file of requiredFiles) {
    const fullPath = `${frameworkPath}/${file}`;
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isFile) {
        result.checks.push({
          name: `Core File: ${file}`,
          category: 'critical',
          status: 'passed',
          message: `File exists and is readable`
        });
      } else {
        result.errors.push(`${file} exists but is not a file`);
        result.checks.push({
          name: `Core File: ${file}`,
          category: 'critical',
          status: 'failed',
          message: `Path exists but is not a file`
        });
      }
    } catch {
      result.errors.push(`Core file missing: ${file}`);
      result.checks.push({
        name: `Core File: ${file}`,
        category: 'critical',
        status: 'failed',
        message: `Required file is missing or inaccessible`
      });
    }
  }
}

/**
 * Validate VERSION file format and content
 */
async function validateVersionFile(result: IntegrityCheckResult): Promise<void> {
  const versionPath = "/home/admin/deno-genesis/VERSION";

  try {
    const versionContent = await Deno.readTextFile(versionPath);
    const lines = versionContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      result.errors.push("VERSION file is empty");
      result.checks.push({
        name: 'VERSION File Content',
        category: 'critical',
        status: 'failed',
        message: 'VERSION file contains no content'
      });
      return;
    }

    // Validate version format (should be semantic versioning)
    const version = lines[0];
    const versionPattern = /^\d+\.\d+\.\d+/;

    if (!versionPattern.test(version)) {
      result.warnings.push(`VERSION format may be invalid: ${version}`);
      result.checks.push({
        name: 'VERSION Format',
        category: 'warning',
        status: 'warning',
        message: `Version "${version}" doesn't follow semantic versioning`
      });
    } else {
      result.checks.push({
        name: 'VERSION Format',
        category: 'info',
        status: 'passed',
        message: `Version format is valid: ${version}`
      });
    }

    // Check for build date
    const buildDateLine = lines.find(line => line.startsWith('Build Date:'));
    if (!buildDateLine) {
      result.warnings.push("Build Date not found in VERSION file");
      result.checks.push({
        name: 'Build Date',
        category: 'warning',
        status: 'warning',
        message: 'Build Date information is missing from VERSION file'
      });
    } else {
      result.checks.push({
        name: 'Build Date',
        category: 'info',
        status: 'passed',
        message: 'Build Date information is present'
      });
    }

    // Check for centralized timestamp
    const centralizedLine = lines.find(line => line.startsWith('Centralized:'));
    if (!centralizedLine) {
      result.warnings.push("Centralized timestamp not found in VERSION file");
      result.checks.push({
        name: 'Centralized Timestamp',
        category: 'warning',
        status: 'warning',
        message: 'Centralized timestamp is missing from VERSION file'
      });
    } else {
      result.checks.push({
        name: 'Centralized Timestamp',
        category: 'info',
        status: 'passed',
        message: 'Centralized timestamp is present'
      });
    }

  } catch (error) {
    result.errors.push(`Failed to read VERSION file: ${error.message}`);
    result.checks.push({
      name: 'VERSION File Access',
      category: 'critical',
      status: 'failed',
      message: `Cannot read VERSION file: ${error.message}`
    });
  }
}

/**
 * Validate site structure and symbolic links
 */
async function validateSiteStructure(result: IntegrityCheckResult): Promise<void> {
  const sitesPath = "/home/admin/deno-genesis/sites";
  const frameworkPath = "/home/admin/deno-genesis";
  const requiredLinks = [
    'middleware',
    'database', 
    'config',
    'utils',
    'types'
  ];

  try {
    for await (const dirEntry of Deno.readDir(sitesPath)) {
      if (dirEntry.isDirectory) {
        const sitePath = `${sitesPath}/${dirEntry.name}`;

        // Check if this is a framework site (has FRAMEWORK_VERSION file)
        const versionFile = `${sitePath}/FRAMEWORK_VERSION`;
        try {
          await Deno.stat(versionFile);

          // Validate symbolic links for this site
          for (const linkName of requiredLinks) {
            const linkPath = `${sitePath}/${linkName}`;
            const expectedTarget = `${frameworkPath}/core/${linkName}`;

            try {
              const stat = await Deno.lstat(linkPath);
              if (stat.isSymlink) {
                const target = await Deno.readLink(linkPath);
                if (target === expectedTarget) {
                  result.checks.push({
                    name: `Site Link: ${dirEntry.name}/${linkName}`,
                    category: 'critical',
                    status: 'passed',
                    message: `Symbolic link is correctly configured`
                  });
                } else {
                  result.errors.push(`Site ${dirEntry.name}: ${linkName} points to wrong target: ${target}`);
                  result.checks.push({
                    name: `Site Link: ${dirEntry.name}/${linkName}`,
                    category: 'critical',
                    status: 'failed',
                    message: `Symbolic link points to wrong target: ${target}`
                  });
                }
              } else {
                result.errors.push(`Site ${dirEntry.name}: ${linkName} is not a symbolic link`);
                result.checks.push({
                  name: `Site Link: ${dirEntry.name}/${linkName}`,
                  category: 'critical',
                  status: 'failed',
                  message: `Path exists but is not a symbolic link`
                });
              }
            } catch {
              result.errors.push(`Site ${dirEntry.name}: missing symbolic link for ${linkName}`);
              result.checks.push({
                name: `Site Link: ${dirEntry.name}/${linkName}`,
                category: 'critical',
                status: 'failed',
                message: `Required symbolic link is missing`
              });
            }
          }

          // Check for site-config.ts
          const siteConfigPath = `${sitePath}/site-config.ts`;
          try {
            await Deno.stat(siteConfigPath);
            result.checks.push({
              name: `Site Config: ${dirEntry.name}`,
              category: 'critical',
              status: 'passed',
              message: `Site configuration file exists`
            });
          } catch {
            result.warnings.push(`Site ${dirEntry.name}: missing site-config.ts`);
            result.checks.push({
              name: `Site Config: ${dirEntry.name}`,
              category: 'warning',
              status: 'warning',
              message: `Site configuration file is missing`
            });
          }

        } catch {
          // Not a framework site, skip validation
          continue;
        }
      }
    }
  } catch (error) {
    result.errors.push(`Failed to validate site structure: ${error.message}`);
    result.checks.push({
      name: 'Sites Directory Access',
      category: 'critical',
      status: 'failed',
      message: `Cannot access sites directory: ${error.message}`
    });
  }
}

/**
 * Validate version compatibility between framework and sites
 */
async function validateVersionCompatibility(result: IntegrityCheckResult): Promise<void> {
  try {
    // Get framework version
    const frameworkMetadata = await getFrameworkMetadata();
    const frameworkVersion = frameworkMetadata.version;

    // Get all connected sites
    const sites = await getConnectedSites();

    let compatibilityIssues = 0;

    for (const site of sites) {
      if (site.frameworkVersion === 'unknown') {
        result.warnings.push(`Site ${site.name}: framework version is unknown`);
        result.checks.push({
          name: `Version Compatibility: ${site.name}`,
          category: 'warning',
          status: 'warning',
          message: `Site framework version is unknown`
        });
      } else if (site.frameworkVersion !== frameworkVersion) {
        compatibilityIssues++;
        result.warnings.push(`Site ${site.name}: version mismatch (site: ${site.frameworkVersion}, framework: ${frameworkVersion})`);
        result.checks.push({
          name: `Version Compatibility: ${site.name}`,
          category: 'warning',
          status: 'warning',
          message: `Version mismatch - Site: ${site.frameworkVersion}, Framework: ${frameworkVersion}`
        });
      } else {
        result.checks.push({
          name: `Version Compatibility: ${site.name}`,
          category: 'info',
          status: 'passed',
          message: `Versions are compatible: ${site.frameworkVersion}`
        });
      }
    }

    if (compatibilityIssues === 0) {
      result.checks.push({
        name: 'Overall Version Compatibility',
        category: 'info',
        status: 'passed',
        message: `All ${sites.length} sites have compatible framework versions`
      });
    } else {
      result.warnings.push(`${compatibilityIssues} sites have version compatibility issues`);
    }

  } catch (error) {
    result.errors.push(`Failed to validate version compatibility: ${error.message}`);
    result.checks.push({
      name: 'Version Compatibility Check',
      category: 'critical',
      status: 'failed',
      message: `Version compatibility validation failed: ${error.message}`
    });
  }
}

/**
 * Validate critical dependencies and permissions
 */
async function validateDependencies(result: IntegrityCheckResult): Promise<void> {