/**
 * =============================================================================
 * DenoGenesis Framework - Core Utilities (core/utils/index.ts)
 * =============================================================================
 * 
 * Central export point for framework utility functions including version 
 * management and integrity validation.
 * 
 * This module provides the core utilities that mod.ts expects:
 * - getFrameworkVersion(): Framework version and build information
 * - validateFrameworkIntegrity(): Framework integrity validation
 * 
 * @module CoreUtils
 * @version 1.0.0
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
// TYPE DEFINITIONS
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
 * Framework integrity check result
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

// =============================================================================
// FRAMEWORK INTEGRITY VALIDATION
// =============================================================================

/**
 * Validate framework integrity and component health
 * 
 * Performs comprehensive checks on framework components, configuration,
 * file system permissions, and runtime environment to ensure the 
 * framework is operating correctly.
 * 
 * @returns Promise<FrameworkIntegrityResult> with detailed validation results
 * 
 * @example
 * ```typescript
 * const integrity = await validateFrameworkIntegrity();
 * if (integrity.overall) {
 *   console.log("✅ Framework integrity validated successfully");
 * } else {
 *   console.error("❌ Framework integrity issues detected:");
 *   console.error(integrity.details);
 * }
 * ```
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
    // ==========================================================================
    // Core Module Validation
    // ==========================================================================
    const requiredCoreFiles = [
      "./config/env.ts",
      "./middleware/index.ts",
      "./core/database/client.ts",
      "./core/utils/index.ts",
    ];

    for (const filePath of requiredCoreFiles) {
      try {
        const fileInfo = await Deno.stat(filePath);
        if (!fileInfo.isFile) {
          result.details.missingFiles?.push(filePath);
          result.checks.coreModules = false;
        }
      } catch (error) {
        result.details.missingFiles?.push(filePath);
        result.checks.coreModules = false;
      }
    }

    // ==========================================================================
    // Configuration Validation
    // ==========================================================================
    try {
      // Validate critical environment variables exist
      const requiredEnvVars = [
        'PORT', 'DENO_ENV', 'SITE_KEY', 'SERVER_HOST', 
        'VERSION', 'BUILD_DATE', 'BUILD_HASH'
      ];

      for (const envVar of requiredEnvVars) {
        const value = Deno.env.get(envVar);
        if (!value && !eval(`typeof ${envVar} !== 'undefined'`)) {
          result.details.configErrors?.push(`Missing environment variable: ${envVar}`);
          result.checks.configuration = false;
        }
      }

      // Validate VERSION format (semantic versioning)
      if (VERSION && !/^\d+\.\d+\.\d+/.test(VERSION)) {
        result.details.configErrors?.push("Invalid VERSION format - should be semantic version");
        result.checks.configuration = false;
      }

      // Validate BUILD_HASH format
      if (BUILD_HASH && !/^[a-f0-9]{7,40}$/i.test(BUILD_HASH)) {
        result.details.warnings?.push("BUILD_HASH format may be invalid (expected git commit hash)");
      }

    } catch (error) {
      result.details.configErrors?.push(`Configuration validation error: ${error.message}`);
      result.checks.configuration = false;
    }

    // ==========================================================================
    // Dependencies Validation
    // ==========================================================================
    try {
      // Check Deno version compatibility
      const denoVersion = Deno.version.deno;
      const minDenoVersion = "1.40.0";
      
      if (compareVersions(denoVersion, minDenoVersion) < 0) {
        result.details.dependencyIssues?.push(
          `Deno version ${denoVersion} is below minimum required ${minDenoVersion}`
        );
        result.checks.dependencies = false;
      }

      // Validate that we can access required Deno APIs
      const requiredPermissions = [
        { api: 'Deno.env', name: 'Environment access' },
        { api: 'Deno.stat', name: 'File system access' },
        { api: 'Deno.readTextFile', name: 'File reading' },
      ];

      for (const permission of requiredPermissions) {
        try {
          // Test API access without actually using it
          eval(`typeof ${permission.api}`);
        } catch (error) {
          result.details.dependencyIssues?.push(
            `Missing permission: ${permission.name} (${permission.api})`
          );
          result.checks.dependencies = false;
        }
      }

    } catch (error) {
      result.details.dependencyIssues?.push(`Dependency validation error: ${error.message}`);
      result.checks.dependencies = false;
    }

    // ==========================================================================
    // File System Permissions Validation
    // ==========================================================================
    try {
      // Check write permissions for critical directories
      const criticalDirs = [
        "./logs",
        "./temp", 
        "./uploads",
        "./cache",
      ];

      for (const dir of criticalDirs) {
        try {
          await Deno.stat(dir);
          // Try to create a test file to verify write permissions
          const testFile = `${dir}/.framework_test_${Date.now()}`;
          try {
            await Deno.writeTextFile(testFile, "test");
            await Deno.remove(testFile);
          } catch (writeError) {
            result.details.permissions?.push(`No write access to ${dir}`);
            result.checks.fileSystem = false;
          }
        } catch (statError) {
          // Directory doesn't exist - this might be expected for some dirs
          result.details.warnings?.push(`Directory does not exist: ${dir}`);
        }
      }

    } catch (error) {
      result.details.permissions?.push(`File system validation error: ${error.message}`);
      result.checks.fileSystem = false;
    }

    // ==========================================================================
    // Runtime Environment Validation
    // ==========================================================================
    try {
      // Validate runtime environment is appropriate for framework
      const runtimeChecks = [
        {
          name: "Deno runtime available",
          test: () => typeof Deno !== 'undefined',
        },
        {
          name: "TypeScript support enabled", 
          test: () => typeof Deno.transpileOnly !== 'undefined',
        },
        {
          name: "Network permissions",
          test: () => {
            try {
              return typeof fetch !== 'undefined';
            } catch {
              return false;
            }
          },
        },
        {
          name: "Environment variables accessible",
          test: () => typeof Deno.env.get !== 'undefined',
        },
      ];

      for (const check of runtimeChecks) {
        if (!check.test()) {
          result.details.configErrors?.push(`Runtime check failed: ${check.name}`);
          result.checks.environment = false;
        }
      }

    } catch (error) {
      result.details.configErrors?.push(`Environment validation error: ${error.message}`);
      result.checks.environment = false;
    }

    // ==========================================================================
    // Overall Result Calculation
    // ==========================================================================
    result.overall = Object.values(result.checks).every(check => check === true);

    return result;

  } catch (globalError) {
    // Catastrophic failure case
    return {
      overall: false,
      checks: {
        coreModules: false,
        configuration: false,
        dependencies: false,
        fileSystem: false,
        environment: false,
      },
      details: {
        configErrors: [`Global validation error: ${globalError.message}`],
      },
      timestamp: Date.now(),
    };
  }
}

// =============================================================================
// UTILITY HELPER FUNCTIONS
// =============================================================================

/**
 * Compare two semantic version strings
 * 
 * @param version1 First version string (e.g., "1.40.0")
 * @param version2 Second version string (e.g., "1.39.0")
 * @returns number: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  
  return 0;
}

/**
 * Get framework uptime since application start
 * 
 * @returns number Uptime in seconds since framework initialization
 */
export function getFrameworkUptime(): number {
  // Note: In a real implementation, you'd track the actual start time
  // This is a simplified version that assumes the process start time
  return Math.floor((Date.now() - (performance.timeOrigin || Date.now())) / 1000);
}

/**
 * Get framework runtime statistics
 * 
 * @returns object with runtime metrics and health information
 */
export function getFrameworkStats(): {
  uptime: number;
  memoryUsage: Deno.MemoryUsage;
  version: FrameworkVersionInfo;
  environment: string;
  pid: number;
} {
  return {
    uptime: getFrameworkUptime(),
    memoryUsage: Deno.memoryUsage(),
    version: getFrameworkVersion(),
    environment: DENO_ENV,
    pid: Deno.pid,
  };
}

// =============================================================================
// DEVELOPMENT AND DEBUGGING UTILITIES
// =============================================================================

/**
 * Generate a framework health report for monitoring and debugging
 * 
 * @returns Promise<object> comprehensive health report including all checks
 */
export async function generateHealthReport(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: FrameworkVersionInfo;
  integrity: FrameworkIntegrityResult;
  stats: ReturnType<typeof getFrameworkStats>;
  recommendations?: string[];
}> {
  const integrity = await validateFrameworkIntegrity();
  const stats = getFrameworkStats();
  const version = getFrameworkVersion();
  
  // Determine overall health status
  let status: "healthy" | "degraded" | "unhealthy";
  const recommendations: string[] = [];
  
  if (integrity.overall) {
    status = "healthy";
  } else if (integrity.checks.coreModules && integrity.checks.environment) {
    status = "degraded";
    recommendations.push("Some non-critical checks failed - monitor performance");
  } else {
    status = "unhealthy";
    recommendations.push("Critical integrity issues detected - immediate attention required");
  }
  
  // Memory usage recommendations
  const memUsageMB = stats.memoryUsage.rss / (1024 * 1024);
  if (memUsageMB > 512) {
    recommendations.push(`Memory usage high (${Math.round(memUsageMB)}MB) - consider optimization`);
  }
  
  // Environment-specific recommendations
  if (version.environment === "production" && integrity.details.warnings?.length) {
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
  
  console.log("\n=".repeat(80));
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
  
  console.log("=".repeat(80));
  console.log("");
}

// =============================================================================
// DEVELOPMENT MODE UTILITIES
// =============================================================================

/**
 * Development mode framework monitoring
 * Only runs additional checks when DENO_ENV === "development"
 */
export function enableDevelopmentMode(): void {
  if (DENO_ENV !== "development") {
    return;
  }
  
  console.log("🔧 Development mode enabled");
  
  // Set up periodic health checks in development
  setInterval(async () => {
    const health = await generateHealthReport();
    if (health.status !== "healthy") {
      console.warn(`⚠️  Framework health: ${health.status.toUpperCase()}`);
      if (health.recommendations) {
        health.recommendations.forEach(rec => console.warn(`   💡 ${rec}`));
      }
    }
  }, 60000); // Check every minute in development
}

/**
 * Framework performance monitoring for development and debugging
 */
export function getPerformanceMetrics(): {
  memoryUsage: Deno.MemoryUsage;
  uptime: number;
  buildInfo: {
    version: string;
    hash: string;
    date: string;
  };
  environment: string;
} {
  return {
    memoryUsage: Deno.memoryUsage(),
    uptime: getFrameworkUptime(),
    buildInfo: {
      version: VERSION,
      hash: BUILD_HASH,
      date: BUILD_DATE,
    },
    environment: DENO_ENV,
  };
}