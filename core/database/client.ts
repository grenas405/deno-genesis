// /database/client.ts
// ================================================================================
// 🗄️ DenoGenesis Universal Database Client
// Enhanced database connection with environment variable integration
// ================================================================================

import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
import {
  bold,
  green,
  red,
  cyan,
  magenta,
  yellow,
} from "https://deno.land/std@0.224.0/fmt/colors.ts";

// Import environment configuration
import { 
  dbConfig, 
  DENO_ENV, 
  SITE_KEY,
  getEnvironmentInfo 
} from "../config/env.ts";

// ================================================================================
// 🚀 DATABASE CONNECTION CLASS
// ================================================================================

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
        
        console.log(bold(cyan(`🔄 Attempting database connection (${this.connectionAttempts}/${this.maxRetries})...`)));
        
        this.client = new Client();
        await this.client.connect(dbConfig);
        
        // Test connection
        await this.testConnection();
        
        this.isConnected = true;
        this.logSuccessfulConnection();
        
        return this.client;
        
      } catch (error) {
        console.error(bold(red(`❌ Database connection attempt ${this.connectionAttempts} failed:`)), red(error.message));
        
        if (this.connectionAttempts >= this.maxRetries) {
          console.error(bold(red("❌ Maximum database connection retries exceeded")));
          this.logConnectionFailure(error);
          Deno.exit(1);
        }
        
        // Wait before retry
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
    
    console.log(bold(magenta("✨=====================================================✨")));
    console.log(bold(green("✅ DenoGenesis Universal Database Connected")));
    console.log(bold(magenta("✨=====================================================✨")));
    console.log(cyan("🗄️  Database:"), yellow(dbConfig.db));
    console.log(cyan("🌐 Host:"), yellow(`${dbConfig.hostname}:${dbConfig.port || 3306}`));
    console.log(cyan("👤 User:"), yellow(dbConfig.username));
    console.log(cyan("🏊 Pool Size:"), yellow(dbConfig.poolSize.toString()));
    console.log(cyan("🌍 Environment:"), yellow(envInfo.environment));
    console.log(cyan("🔑 Site Key:"), yellow(envInfo.siteKey));
    console.log(cyan("⚡ Port:"), yellow(envInfo.port.toString()));
    
    // Feature flags
    console.log(cyan("🎛️  Features:"));
    console.log(`   WebSockets: ${envInfo.features.websockets ? green('✅') : red('❌')}`);
    console.log(`   Multi-tenant: ${envInfo.features.multiTenant ? green('✅') : red('❌')}`);
    console.log(`   Real-time Sync: ${envInfo.features.realTimeSync ? green('✅') : red('❌')}`);
    console.log(`   Analytics: ${envInfo.features.analytics ? green('✅') : red('❌')}`);
    console.log(`   Notifications: ${envInfo.features.notifications ? green('✅') : red('❌')}`);
    
    console.log(bold(magenta("✨=====================================================✨")));
    console.log(bold(green("🚀 Ready for Local-First Digital Sovereignty!")));
    console.log(bold(magenta("✨=====================================================✨")));
  }

  /**
   * Log connection failure details
   */
  private logConnectionFailure(error: Error): void {
    console.log(bold(red("❌ Database Connection Failed")));
    console.log(bold(red("================================")));
    console.log(red("Error:"), error.message);
    console.log(red("Config:"));
    console.log(`   Host: ${dbConfig.hostname}:${dbConfig.port || 3306}`);
    console.log(`   Database: ${dbConfig.db}`);
    console.log(`   User: ${dbConfig.username}`);
    console.log(`   Environment: ${DENO_ENV}`);
    console.log(bold(red("================================")));
    console.log(red("Please check:"));
    console.log(red("1. Database server is running"));
    console.log(red("2. Environment variables are correct"));
    console.log(red("3. Database user has proper permissions"));
    console.log(red("4. Network connectivity to database"));
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
        console.log(bold(yellow("🔌 Database connection closed gracefully")));
      } catch (error) {
        console.error(bold(red("❌ Error closing database connection:")), error.message);
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
      console.error(bold(red("❌ Database query error:")), error.message);
      console.error(red("SQL:"), sql);
      if (params) {
        console.error(red("Params:"), params);
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

// ================================================================================
// 🌟 SINGLETON DATABASE INSTANCE
// ================================================================================

const databaseManager = new DatabaseManager();

// Initialize connection
export const db = await databaseManager.connect();

// Export database manager for advanced usage
export { databaseManager };

// ================================================================================
// 🎯 CONVENIENCE FUNCTIONS
// ================================================================================

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

// ================================================================================
// 🔄 GRACEFUL SHUTDOWN HANDLER
// ================================================================================

// Handle graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(bold(yellow(`\n🛑 Received ${signal}, shutting down database connections...`)));
  await closeDatabaseConnection();
};

// Register shutdown handlers
Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));

// ================================================================================
// 🎮 DEVELOPMENT UTILITIES
// ================================================================================

// Export for development/debugging
if (DENO_ENV === "development") {
  // @ts-ignore - Development only
  globalThis.db = db;
  // @ts-ignore - Development only  
  globalThis.dbManager = databaseManager;
  
  console.log(cyan("🔧 Development mode: Database available as global.db"));
}
