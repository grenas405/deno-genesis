/**
 * DenoGenesis Universal Database Client
 * Enhanced database connection with environment variable integration
 */

import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
import {
  dbConfig,
  getEnvironmentInfo,
  DENO_ENV,
  ConsoleStyler
} from "../mod.ts";

// ============================================================================
// DATABASE CONNECTION CLASS
// ============================================================================

class DatabaseManager {
  private client: Client | null = null;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private isConnected = false;

  /**
   * Initialize database connection with retry logic
   */
  async connect(): Promise<Client> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    while (this.connectionAttempts < this.maxRetries) {
      try {
        this.connectionAttempts++;
        ConsoleStyler.logInfo(`🔄 Database connection attempt ${this.connectionAttempts}/${this.maxRetries}`);

        this.client = new Client();
        await this.client.connect(dbConfig);
        await this.testConnection();

        this.isConnected = true;
        this.logSuccessfulConnection();
        return this.client;

      } catch (error) {
        ConsoleStyler.logError(`❌ Connection attempt ${this.connectionAttempts} failed: ${error.message}`);

        if (this.connectionAttempts >= this.maxRetries) {
          ConsoleStyler.logError("❌ Maximum database connection retries exceeded");
          this.logConnectionFailure(error);
          Deno.exit(1);
        }

        await this.delay(2000 * this.connectionAttempts);
      }
    }

    throw new Error("Failed to establish database connection");
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.client) {
      throw new Error("Database client not initialized");
    }

    const result = await this.client.execute("SELECT 1 as test, NOW() as timestamp");
    if (!result || result.length === 0) {
      throw new Error("Database test query failed");
    }
  }

  /**
   * Log successful connection with environment info
   */
  private logSuccessfulConnection(): void {
    const envInfo = getEnvironmentInfo();

    ConsoleStyler.logSection("✅ DATABASE CONNECTED", "green");

    const dbInfo = [
      ['Database', dbConfig.db],
      ['Host', `${dbConfig.hostname}:${dbConfig.port || 3306}`],
      ['User', dbConfig.username],
      ['Pool Size', dbConfig.poolSize.toString()],
      ['Environment', envInfo.environment],
      ['Site Key', envInfo.siteKey],
      ['Port', envInfo.port.toString()]
    ];

    dbInfo.forEach(([label, value]) => {
      ConsoleStyler.logInfo(`🗄️ ${label}: ${value}`);
    });

    ConsoleStyler.logInfo("🎛️ Features:");
    const features = envInfo.features;
    Object.entries(features).forEach(([key, enabled]) => {
      const status = enabled ? '✅' : '❌';
      ConsoleStyler.logInfo(`   ${key}: ${status}`);
    });

    ConsoleStyler.logSuccess("🚀 Ready for Local-First Digital Sovereignty!");
  }

  /**
   * Log connection failure details
   */
  private logConnectionFailure(error: Error): void {
    ConsoleStyler.logError("❌ Database Connection Failed");
    ConsoleStyler.logError(`Error: ${error.message}`);

    const configInfo = [
      `Host: ${dbConfig.hostname}:${dbConfig.port || 3306}`,
      `Database: ${dbConfig.db}`,
      `User: ${dbConfig.username}`,
      `Environment: ${DENO_ENV}`
    ];

    configInfo.forEach(info => ConsoleStyler.logError(`Config - ${info}`));

    const troubleshooting = [
      "1. Database server is running",
      "2. Environment variables are correct",
      "3. Database user has proper permissions",
      "4. Network connectivity to database"
    ];

    ConsoleStyler.logWarning("Please check:");
    troubleshooting.forEach(step => ConsoleStyler.logWarning(step));
  }

  /**
   * Get database connection
   */
  getConnection(): Client {
    if (!this.client || !this.isConnected) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.client;
  }

  /**
   * Check if database is connected
   */
  isDbConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Gracefully close database connection
   */
  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        ConsoleStyler.logWarning("🔌 Database connection closed gracefully");
      } catch (error) {
        ConsoleStyler.logError(`❌ Error closing database connection: ${error.message}`);
      }
    }
  }

  /**
   * Execute query with error handling
   */
  async query(sql: string, params?: any[]): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error("Database not connected");
    }

    try {
      return await this.client.execute(sql, params);
    } catch (error) {
      ConsoleStyler.logError(`❌ Database query error: ${error.message}`);
      ConsoleStyler.logError(`SQL: ${sql}`);
      if (params) {
        ConsoleStyler.logError(`Params: ${JSON.stringify(params)}`);
      }
      throw error;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON DATABASE INSTANCE
// ============================================================================

const databaseManager = new DatabaseManager();

// Initialize connection
export const db = await databaseManager.connect();
export { databaseManager };

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Execute a query with parameters
 */
export async function executeQuery(sql: string, params?: any[]): Promise<any> {
  return await databaseManager.query(sql, params);
}

/**
 * Get database connection status
 */
export function getDatabaseStatus(): boolean {
  return databaseManager.isDbConnected();
}

/**
 * Close database connection (for graceful shutdown)
 */
export async function closeDatabaseConnection(): Promise<void> {
  await databaseManager.close();
}

// ============================================================================
// GRACEFUL SHUTDOWN HANDLER
// ============================================================================

const handleShutdown = async (signal: string) => {
  ConsoleStyler.logWarning(`🛑 Received ${signal}, shutting down database connections...`);
  await closeDatabaseConnection();
};

// Register shutdown handlers
Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (DENO_ENV === "development") {
  // @ts-ignore - Development only
  globalThis.db = db;
  // @ts-ignore - Development only
  globalThis.dbManager = databaseManager;

  ConsoleStyler.logInfo("🔧 Development mode: Database available as global.db");
}
