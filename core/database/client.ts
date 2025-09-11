/**
 * DenoGenesis Universal Database Client
 * Enhanced database connection with environment variable integration
 *
 * FIXED: Removed circular dependency by importing config directly
 */

import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

// ⚠️ CRITICAL FIX: Import directly from config to avoid circular dependency
import {
  dbConfig,
  DENO_ENV
} from "../config/env.ts";

// Import utilities that don't create circular dependencies
import { ConsoleStyler } from "../utils/consoleStyler.ts";

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
   * Log successful connection with basic info
   */
  private logSuccessfulConnection(): void {
    ConsoleStyler.logSection("✅ DATABASE CONNECTED", "green");

    const dbInfo = [
      ['Database', dbConfig.db],
      ['Host', `${dbConfig.hostname}:${dbConfig.port || 3306}`],
      ['User', dbConfig.username],
      ['Pool Size', dbConfig.poolSize.toString()],
      ['Environment', DENO_ENV]
    ];

    dbInfo.forEach(([label, value]) => {
      ConsoleStyler.logInfo(`🗄️ ${label}: ${value}`);
    });

    ConsoleStyler.logSuccess("🚀 Database ready for operations!");
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
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
  async query(sql: string, params?: unknown[]): Promise<unknown> {
    if (!this.isConnected || !this.client) {
      throw new Error("Database not connected. Call connect() first.");
    }

    try {
      const result = await this.client.execute(sql, params);
      return result;
    } catch (error) {
      ConsoleStyler.logError(`❌ Database query failed: ${error.message}`);
      ConsoleStyler.logError(`SQL: ${sql}`);
      if (params) {
        ConsoleStyler.logError(`Params: ${JSON.stringify(params)}`);
      }
      throw error;
    }
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction(callback: (client: Client) => Promise<void>): Promise<void> {
    if (!this.isConnected || !this.client) {
      throw new Error("Database not connected. Call connect() first.");
    }

    try {
      await this.client.execute("START TRANSACTION");
      await callback(this.client);
      await this.client.execute("COMMIT");
    } catch (error) {
      await this.client.execute("ROLLBACK");
      ConsoleStyler.logError(`❌ Transaction failed and rolled back: ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE AND EXPORTS
// ============================================================================

/**
 * Global database manager instance
 * Lazy initialization to prevent startup issues
 */
let databaseManager: DatabaseManager | null = null;

/**
 * Get or create database manager instance
 */
function getDatabaseManager(): DatabaseManager {
  if (!databaseManager) {
    databaseManager = new DatabaseManager();
  }
  return databaseManager;
}

/**
 * Main database connection instance
 * Call db.connect() before using
 */
export const db = getDatabaseManager();

/**
 * Initialize database connection
 * Call this in your main.ts before starting the server
 */
export async function initializeDatabase(): Promise<Client> {
  const manager = getDatabaseManager();
  return await manager.connect();
}

/**
 * Close database connection gracefully
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (databaseManager) {
    await databaseManager.close();
  }
}

/**
 * Get database connection status
 */
export function getDatabaseStatus(): {
  connected: boolean;
  manager: DatabaseManager | null;
} {
  return {
    connected: databaseManager?.isDbConnected() ?? false,
    manager: databaseManager
  };
}
