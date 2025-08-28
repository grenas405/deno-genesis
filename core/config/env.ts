// /config/env.ts
// ================================================================================
// 🚀 DenoGenesis Framework - Environment Configuration
// Centralized environment variable management with validation and build tracking
// ================================================================================

import { config as loadEnv } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables from .env file
const env = await loadEnv();

// ================================================================================
// 📦 VERSION FILE READER
// ================================================================================

interface VersionInfo {
  version: string;
  buildDate: string;
  buildHash?: string;
}

/**
 * Read VERSION file from project root
 */
async function getVersionInfo(): Promise<VersionInfo> {
  try {
    const versionContent = await Deno.readTextFile("./VERSION");
    const lines = versionContent.trim().split('\n');

    // Parse VERSION file format
    // Expected format:
    // v1.4.0-enterprise
    // Build Date: 2025-01-24
    // Git Hash: abc123def (optional)

    const version = lines[0]?.trim() || "v1.0.0-development";

    // Extract build date (handle different formats)
    let buildDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const buildDateLine = lines.find(line => line.includes('Build Date:'));
    if (buildDateLine) {
      const extractedDate = buildDateLine.replace('Build Date:', '').trim();
      // Convert to readable format
      try {
        const parsedDate = new Date(extractedDate);
        buildDate = parsedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        // Keep default if parsing fails
      }
    }

    // Extract git hash if present
    const hashLine = lines.find(line => line.includes('Git Hash:'));
    const buildHash = hashLine?.replace('Git Hash:', '').trim() || undefined;

    return { version, buildDate, buildHash };

  } catch (error) {
    console.warn("⚠️ Could not read VERSION file:", error.message);
    console.warn("   Using default version information");

    return {
      version: "v1.0.0-development",
      buildDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }
}

// Load version information
const versionInfo = await getVersionInfo();

// ================================================================================
// 🔧 ENVIRONMENT VALIDATION
// ================================================================================

// ✅ Fail loudly if critical variables are missing
const requiredVars = ['SITE_KEY', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

for (const varName of requiredVars) {
  if (!env[varName]) {
    throw new Error(`❌ ${varName} is not defined in .env file.`);
  }
}

// ================================================================================
// 📊 CORE ENVIRONMENT EXPORTS
// ================================================================================

// Version Information (from VERSION file)
export const VERSION = versionInfo.version;
export const BUILD_DATE = versionInfo.buildDate;
export const BUILD_HASH = versionInfo.buildHash;

// Site Configuration
export const SITE_KEY = env.SITE_KEY;
export const DENO_ENV = env.DENO_ENV || "development";
export const PORT = parseInt(env.PORT || "3000");

// Database Configuration
export const DB_HOST = env.DB_HOST;
export const DB_USER = env.DB_USER;
export const DB_PASSWORD = env.DB_PASSWORD;
export const DB_NAME = env.DB_NAME;
export const DB_PORT = parseInt(env.DB_PORT || "3306");

// Server Configuration
export const SERVER_HOST = env.SERVER_HOST || "localhost";
export const SSL_ENABLED = env.SSL_ENABLED === "true";
export const CORS_ORIGINS = env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || [
  "http://localhost:3000",
  "https://pedromdominguez.com",
  "https://okdevs.xyz",
  "https://domingueztechsolutions.com"
];

// Feature Flags
export const ENABLE_WEBSOCKETS = env.ENABLE_WEBSOCKETS !== "false";
export const ENABLE_REALTIME_SYNC = env.ENABLE_REALTIME_SYNC !== "false";
export const ENABLE_MULTITENANT = env.ENABLE_MULTITENANT !== "false";
export const ENABLE_ANALYTICS = env.ENABLE_ANALYTICS === "true";
export const ENABLE_NOTIFICATIONS = env.ENABLE_NOTIFICATIONS !== "false";

// Deployment Information
export const DEPLOYED_AT = env.DEPLOYED_AT || new Date().toISOString();
export const DEPLOYMENT_ID = env.DEPLOYMENT_ID;
export const GIT_BRANCH = env.GIT_BRANCH || "main";
export const GIT_COMMIT = env.GIT_COMMIT || BUILD_HASH; // Fallback to VERSION file hash

// Security Configuration
export const JWT_SECRET = env.JWT_SECRET;
export const SESSION_SECRET = env.SESSION_SECRET;
export const API_KEY = env.API_KEY;

// External Services (Optional)
export const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
export const STRIPE_PUBLISHABLE_KEY = env.STRIPE_PUBLISHABLE_KEY;
export const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
export const CLOUDINARY_URL = env.CLOUDINARY_URL;

// ================================================================================
// 🗄️ DATABASE CONFIGURATION OBJECT
// ================================================================================

export const dbConfig = {
  hostname: DB_HOST,
  username: DB_USER,
  password: DB_PASSWORD,
  db: DB_NAME,
  port: DB_PORT,
  poolSize: parseInt(env.DB_POOL_SIZE || "10"),
  timeout: parseInt(env.DB_TIMEOUT || "30000"),
  charset: env.DB_CHARSET || "utf8mb4",
};

// ================================================================================
// 🎯 FRAMEWORK CONFIGURATION OBJECT
// ================================================================================

export interface DenoGenesisConfig {
  version: string;
  buildDate: string;
  buildHash?: string;
  environment: string;
  port: number;
  author: string;
  repository: string;
  description: string;
}

export const frameworkConfig: DenoGenesisConfig = {
  version: VERSION,
  buildDate: BUILD_DATE,
  buildHash: BUILD_HASH,
  environment: DENO_ENV,
  port: PORT,
  author: "Pedro M. Dominguez",
  repository: "https://github.com/xtcedro/deno-genesis",
  description: "Local-First Digital Sovereignty Platform"
};

// ================================================================================
// 🌍 ENVIRONMENT INFO HELPER
// ================================================================================

export function getEnvironmentInfo() {
  return {
    // Version Information
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH,

    // Environment
    environment: DENO_ENV,
    port: PORT,
    siteKey: SITE_KEY,

    // Database
    database: {
      host: DB_HOST,
      port: DB_PORT,
      name: DB_NAME,
      user: DB_USER
      // Password intentionally excluded for security
    },

    // Features
    features: {
      websockets: ENABLE_WEBSOCKETS,
      realTimeSync: ENABLE_REALTIME_SYNC,
      multiTenant: ENABLE_MULTITENANT,
      analytics: ENABLE_ANALYTICS,
      notifications: ENABLE_NOTIFICATIONS
    },

    // Deployment
    deployment: {
      deployedAt: DEPLOYED_AT,
      deploymentId: DEPLOYMENT_ID,
      gitBranch: GIT_BRANCH,
      gitCommit: GIT_COMMIT
    },

    // Server
    server: {
      host: SERVER_HOST,
      ssl: SSL_ENABLED,
      cors: CORS_ORIGINS
    }
  };
}

// ================================================================================
// ✅ ENVIRONMENT VALIDATION LOGGER
// ================================================================================

export function logEnvironmentStatus() {
  console.log('🌍 Environment Configuration Loaded:');
  console.log(`   Version: ${VERSION}`);
  console.log(`   Build Date: ${BUILD_DATE}`);
  if (BUILD_HASH) {
    console.log(`   Build Hash: ${BUILD_HASH}`);
  }
  console.log(`   Environment: ${DENO_ENV}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Site Key: ${SITE_KEY}`);
  console.log(`   Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
  console.log(`   SSL Enabled: ${SSL_ENABLED}`);
  console.log(`   WebSockets: ${ENABLE_WEBSOCKETS ? '✅' : '❌'}`);
  console.log(`   Multi-tenant: ${ENABLE_MULTITENANT ? '✅' : '❌'}`);
}

// ================================================================================
// 📝 VERSION FILE UTILITIES
// ================================================================================

/**
 * Update VERSION file with new version information
 */
export async function updateVersionFile(newVersion: string, gitHash?: string): Promise<void> {
  const buildDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  let content = `${newVersion}\nBuild Date: ${buildDate}`;

  if (gitHash) {
    content += `\nGit Hash: ${gitHash}`;
  }

  try {
    await Deno.writeTextFile("./VERSION", content);
    console.log(`✅ VERSION file updated: ${newVersion}`);
  } catch (error) {
    console.error(`❌ Failed to update VERSION file:`, error.message);
    throw error;
  }
}

/**
 * Get version information for API responses
 */
export function getVersionData(): VersionInfo {
  return {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildHash: BUILD_HASH
  };
}

// ================================================================================
// 🎯 EXPORT VERSION INFO FOR BACKWARD COMPATIBILITY
// ================================================================================

// For direct access to version components
export { versionInfo };

// Log version info on module load (development only)
if (DENO_ENV === "development") {
  console.log(`📦 DenoGenesis ${VERSION} (${BUILD_DATE})`);
  if (BUILD_HASH) {
    console.log(`   Git Hash: ${BUILD_HASH}`);
  }
}
