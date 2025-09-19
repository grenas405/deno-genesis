// /core/meta.ts
// ================================================================================
// 🚀 DenoGenesis Framework - Core Metadata Management (Clean Version)
// Framework version and build information without legacy compatibility
// ================================================================================

import { VERSION, BUILD_DATE, BUILD_HASH } from "./config/env.ts";

// ================================================================================
// 🎯 FRAMEWORK METADATA
// ================================================================================

export interface FrameworkMetadata {
  version: string;
  buildDate: string;
  buildHash?: string;
  timestamp: number;
  environment: string;
}

export interface FrameworkIntegrity {
  isValid: boolean;
  version: string;
  errors: string[];
  warnings: string[];
}

// ================================================================================
// 🔧 VERSION MANAGEMENT
// ================================================================================

/**
 * Get current framework version information
 */
export function getFrameworkVersion(): string {
  return VERSION;
}

/**
 * Get complete framework metadata
 */
export function getFrameworkMetadata(): FrameworkMetadata {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH,
    timestamp: Date.now(),
    environment: Deno.env.get("DENO_ENV") || "development"
  };
}

/**
 * Get framework build information
 */
export function getBuildInfo(): { version: string; buildDate: string; buildHash?: string } {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH
  };
}

// ================================================================================
// 🛡️ FRAMEWORK INTEGRITY VALIDATION
// ================================================================================

/**
 * Validate framework integrity and configuration
 */
export async function validateFrameworkIntegrity(): Promise<FrameworkIntegrity> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate core framework components
    await validateCoreComponents(errors, warnings);
    
    // Validate environment configuration
    validateEnvironmentConfig(errors, warnings);
    
    // Validate version consistency
    validateVersionConsistency(errors, warnings);

    return {
      isValid: errors.length === 0,
      version: VERSION,
      errors,
      warnings
    };

  } catch (error) {
    errors.push(`Framework integrity check failed: ${error.message}`);
    
    return {
      isValid: false,
      version: VERSION,
      errors,
      warnings
    };
  }
}

/**
 * Validate that core framework components are present
 */
async function validateCoreComponents(errors: string[], warnings: string[]): Promise<void> {
  const requiredFiles = [
    "./middleware/index.ts",
    "./database/client.ts", 
    "./config/env.ts"
  ];

  for (const file of requiredFiles) {
    try {
      await Deno.stat(file);
    } catch {
      errors.push(`Missing required framework file: ${file}`);
    }
  }

  // Check for VERSION file in framework root
  try {
    await Deno.stat("../VERSION");
  } catch {
    warnings.push("VERSION file not found in framework root - using environment default");
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig(errors: string[], warnings: string[]): void {
  const requiredEnvVars = ['SITE_KEY', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  
  for (const envVar of requiredEnvVars) {
    if (!Deno.env.get(envVar)) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check optional but recommended variables
  const recommendedEnvVars = ['PORT', 'SERVER_HOST', 'DENO_ENV'];
  
  for (const envVar of recommendedEnvVars) {
    if (!Deno.env.get(envVar)) {
      warnings.push(`Recommended environment variable not set: ${envVar}`);
    }
  }
}

/**
 * Validate version consistency
 */
function validateVersionConsistency(errors: string[], warnings: string[]): void {
  // Validate version format (semantic versioning)
  const versionPattern = /^v?\d+\.\d+\.\d+/;
  
  if (!versionPattern.test(VERSION)) {
    warnings.push(`Version format may not follow semantic versioning: ${VERSION}`);
  }

  // Validate build date format
  if (BUILD_DATE) {
    const datePattern = /\w+ \d{1,2}, \d{4}/; // e.g., "January 24, 2025"
    
    if (!datePattern.test(BUILD_DATE)) {
      warnings.push(`Build date format unexpected: ${BUILD_DATE}`);
    }
  }

  // Validate build hash if present
  if (BUILD_HASH) {
    const hashPattern = /^[a-f0-9]{7,40}$/i; // Git hash pattern
    
    if (!hashPattern.test(BUILD_HASH)) {
      warnings.push(`Build hash format unexpected: ${BUILD_HASH}`);
    }
  }
}

// ================================================================================
// 🎯 FRAMEWORK UTILITIES
// ================================================================================

/**
 * Check if framework version meets minimum requirement
 */
export function checkMinimumVersion(required: string): boolean {
  const current = parseVersion(VERSION);
  const minimum = parseVersion(required);
  
  // Compare major.minor.patch
  if (current.major !== minimum.major) {
    return current.major > minimum.major;
  }
  
  if (current.minor !== minimum.minor) {
    return current.minor > minimum.minor;
  }
  
  return current.patch >= minimum.patch;
}

/**
 * Parse version string into components
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const cleaned = version.replace(/^v/, ''); // Remove 'v' prefix if present
  const parts = cleaned.split('.').map(p => parseInt(p.split('-')[0], 10)); // Handle pre-release versions
  
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

/**
 * Get human-readable framework status
 */
export function getFrameworkStatus(): string {
  const env = Deno.env.get("DENO_ENV") || "development";
  const status = env === "production" ? "Production Ready" : "Development Mode";
  
  return `DenoGenesis ${VERSION} - ${status}`;
}

/**
 * Log framework information to console
 */
export function logFrameworkInfo(): void {
  const metadata = getFrameworkMetadata();
  
  console.log("\x1b[36m%s\x1b[0m", "📊 DenoGenesis Framework Information:");
  console.log(`   Version: ${metadata.version}`);
  console.log(`   Build Date: ${metadata.buildDate}`);
  
  if (metadata.buildHash) {
    console.log(`   Build Hash: ${metadata.buildHash}`);
  }
  
  console.log(`   Environment: ${metadata.environment}`);
  console.log(`   Status: ${getFrameworkStatus()}`);
}

// ================================================================================
// 🔄 FRAMEWORK HEALTH CHECK
// ================================================================================

/**
 * Perform comprehensive framework health check
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean;
  metadata: FrameworkMetadata;
  integrity: FrameworkIntegrity;
  timestamp: string;
}> {
  const metadata = getFrameworkMetadata();
  const integrity = await validateFrameworkIntegrity();
  
  return {
    healthy: integrity.isValid,
    metadata,
    integrity,
    timestamp: new Date().toISOString()
  };
}

// ================================================================================
// 🎯 EXPORT FRAMEWORK INFORMATION
// ================================================================================

// Main framework exports for external use
export const FRAMEWORK_INFO = {
  name: "DenoGenesis",
  version: VERSION,
  buildDate: BUILD_DATE,
  buildHash: BUILD_HASH,
  author: "Pedro M. Dominguez",
  repository: "https://github.com/xtcedro/deno-genesis",
  description: "Local-First Digital Sovereignty Platform",
  location: "core"
} as const;

// Development utilities (only available in development)
if (Deno.env.get("DENO_ENV") === "development") {
  // @ts-ignore - Development only
  globalThis.DenoGenesisFramework = {
    version: getFrameworkVersion,
    metadata: getFrameworkMetadata,
    validate: validateFrameworkIntegrity,
    health: performHealthCheck,
    info: () => FRAMEWORK_INFO
  };
  
  console.log("\x1b[33m%s\x1b[0m", "🔧 Development mode: Framework utilities available at globalThis.DenoGenesisFramework");
}