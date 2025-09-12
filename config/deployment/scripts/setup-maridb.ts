#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-net

/**
 * Deno Genesis MariaDB Setup Utility
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Setup MariaDB for multi-tenant architecture
 * - Accept text input: Environment variables and command line flags
 * - Produce text output: Structured logging with clear success/error states
 * - Filter and transform: Takes system state → configured database state
 * - Composable: Can be chained with other setup utilities
 *
 * Usage:
 *   deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts
 *   deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts --sample-data
 *   deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts --test-only
 */

import { parseArgs } from "https://deno.land/std@0.204.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.204.0/fs/mod.ts";

// Types for better developer experience
interface DatabaseConfig {
  name: string;
  user: string;
  password: string;
  host: string;
  port: number;
}

interface SetupOptions {
  sampleData: boolean;
  testOnly: boolean;
  verbose: boolean;
  configPath: string;
}

// Default configuration - follows principle of sensible defaults
const DEFAULT_CONFIG: DatabaseConfig = {
  name: "universal_db",
  user: "webadmin",
  password: "Password123!",
  host: "localhost",
  port: 3306,
};

// ANSI color codes for Unix-style terminal output
const Colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
} as const;

// Unix-style logging functions - structured output for composability
function logInfo(message: string): void {
  console.log(`${Colors.BLUE}[INFO]${Colors.RESET} ${message}`);
}

function logSuccess(message: string): void {
  console.log(`${Colors.GREEN}[SUCCESS]${Colors.RESET} ${message}`);
}

function logWarning(message: string): void {
  console.log(`${Colors.YELLOW}[WARNING]${Colors.RESET} ${message}`);
}

function logError(message: string): void {
  console.error(`${Colors.RED}[ERROR]${Colors.RESET} ${message}`);
}

function logHeader(message: string): void {
  const border = '='.repeat(50);
  console.log(`\n${Colors.CYAN}${border}`);
  console.log(`${Colors.BOLD}${Colors.CYAN} ${message}`);
  console.log(`${border}${Colors.RESET}\n`);
}

// Unix philosophy: Small functions that do one thing well
async function checkMariaDBInstalled(): Promise<boolean> {
  try {
    const command = new Deno.Command("mysql", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
}

async function checkMariaDBRunning(): Promise<boolean> {
  try {
    const command = new Deno.Command("systemctl", {
      args: ["is-active", "mariadb"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await command.output();

    if (success) return true;

    // Also check for mysql service name
    const mysqlCommand = new Deno.Command("systemctl", {
      args: ["is-active", "mysql"],
      stdout: "null",
      stderr: "null",
    });
    const { success: mysqlSuccess } = await mysqlCommand.output();
    return mysqlSuccess;
  } catch {
    return false;
  }
}

async function installMariaDB(): Promise<boolean> {
  logHeader("Installing MariaDB Server");

  try {
    logInfo("Updating package list...");
    const updateCmd = new Deno.Command("sudo", {
      args: ["apt", "update"],
      stdout: "inherit",
      stderr: "inherit",
    });
    await updateCmd.output();

    logInfo("Installing MariaDB server and client...");
    const installCmd = new Deno.Command("sudo", {
      args: ["apt", "install", "-y", "mariadb-server", "mariadb-client"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { success } = await installCmd.output();

    if (!success) {
      logError("Failed to install MariaDB");
      return false;
    }

    logInfo("Starting and enabling MariaDB service...");
    const startCmd = new Deno.Command("sudo", {
      args: ["systemctl", "start", "mariadb"],
    });
    await startCmd.output();

    const enableCmd = new Deno.Command("sudo", {
      args: ["systemctl", "enable", "mariadb"],
    });
    await enableCmd.output();

    logSuccess("MariaDB installation completed");
    return true;

  } catch (error) {
    logError(`Installation failed: ${error.message}`);
    return false;
  }
}

async function executeSQL(sql: string, config: DatabaseConfig, useDatabase = false): Promise<boolean> {
  try {
    const mysqlArgs = [
      "-h", config.host,
      "-P", config.port.toString(),
      "-u", "root",
      "-p",
      "--execute", sql
    ];

    if (useDatabase) {
      mysqlArgs.splice(-2, 0, "-D", config.name);
    }

    const command = new Deno.Command("mysql", {
      args: mysqlArgs,
      stdout: "null",
      stderr: "piped",
    });

    const { success, stderr } = await command.output();

    if (!success) {
      const errorText = new TextDecoder().decode(stderr);
      logError(`SQL execution failed: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`SQL execution error: ${error.message}`);
    return false;
  }
}

async function createDatabase(config: DatabaseConfig): Promise<boolean> {
  logHeader("Creating Database and Tables");

  // Create database
  logInfo(`Creating database: ${config.name}`);
  const createDbSQL = `
    CREATE DATABASE IF NOT EXISTS ${config.name}
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
  `;

  if (!await executeSQL(createDbSQL, config)) {
    return false;
  }

  // Create tables with multi-tenant architecture
  logInfo("Creating multi-tenant table structure...");
  const createTablesSQL = `
    USE ${config.name};

    -- Admin Users Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      username VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(100),
      role ENUM('admin', 'editor', 'viewer') DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT true,
      INDEX idx_site_key (site_key),
      INDEX idx_username_site (username, site_key),
      UNIQUE KEY unique_user_site (username, site_key)
    ) ENGINE=InnoDB;

    -- Contact Messages Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      subject VARCHAR(200),
      message TEXT NOT NULL,
      status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      replied_at TIMESTAMP NULL,
      notes TEXT,
      INDEX idx_site_key (site_key),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;

    -- Appointments Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      service VARCHAR(100),
      preferred_date DATE,
      preferred_time TIME,
      message TEXT,
      status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      notes TEXT,
      INDEX idx_site_key (site_key),
      INDEX idx_status (status),
      INDEX idx_preferred_date (preferred_date),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB;

    -- Site Settings Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS site_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_site_key (site_key),
      INDEX idx_setting_key (setting_key),
      UNIQUE KEY unique_setting_site (site_key, setting_key)
    ) ENGINE=InnoDB;

    -- Blog Posts Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      featured_image VARCHAR(500),
      author_id INT,
      status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
      published_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      meta_description TEXT,
      meta_keywords TEXT,
      INDEX idx_site_key (site_key),
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_published_at (published_at),
      UNIQUE KEY unique_slug_site (site_key, slug),
      FOREIGN KEY (author_id) REFERENCES admin_users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;

    -- Projects/Portfolio Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(200) NOT NULL,
      description TEXT,
      long_description TEXT,
      featured_image VARCHAR(500),
      gallery JSON,
      technologies JSON,
      project_url VARCHAR(500),
      github_url VARCHAR(500),
      status ENUM('concept', 'development', 'completed', 'maintenance') DEFAULT 'development',
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      sort_order INT DEFAULT 0,
      is_featured BOOLEAN DEFAULT false,
      INDEX idx_site_key (site_key),
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_is_featured (is_featured),
      INDEX idx_sort_order (sort_order),
      UNIQUE KEY unique_slug_site (site_key, slug)
    ) ENGINE=InnoDB;

    -- Transactions/Payments Table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      transaction_id VARCHAR(100) NOT NULL,
      customer_name VARCHAR(100),
      customer_email VARCHAR(100),
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      payment_method VARCHAR(50),
      payment_processor VARCHAR(50),
      processor_transaction_id VARCHAR(100),
      description TEXT,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_site_key (site_key),
      INDEX idx_transaction_id (transaction_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      UNIQUE KEY unique_transaction_id (transaction_id)
    ) ENGINE=InnoDB;
  `;

  if (!await executeSQL(createTablesSQL, config)) {
    return false;
  }

  logSuccess("Database and tables created successfully");
  return true;
}

async function createDatabaseUser(config: DatabaseConfig): Promise<boolean> {
  logHeader("Creating Database User");

  const createUserSQL = `
    CREATE USER IF NOT EXISTS '${config.user}'@'localhost' IDENTIFIED BY '${config.password}';
    GRANT ALL PRIVILEGES ON ${config.name}.* TO '${config.user}'@'localhost';
    FLUSH PRIVILEGES;
  `;

  logInfo(`Creating database user: ${config.user}`);

  if (!await executeSQL(createUserSQL, config)) {
    return false;
  }

  logSuccess(`Database user '${config.user}' created with full privileges`);
  return true;
}

async function testConnection(config: DatabaseConfig): Promise<boolean> {
  logHeader("Testing Database Connection");

  try {
    const command = new Deno.Command("mysql", {
      args: [
        "-h", config.host,
        "-P", config.port.toString(),
        "-u", config.user,
        `-p${config.password}`,
        "-D", config.name,
        "--execute", "SELECT 'Connection successful' AS test;"
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout, stderr } = await command.output();

    if (success) {
      logSuccess("Database connection test passed");
      return true;
    } else {
      const errorText = new TextDecoder().decode(stderr);
      logError(`Connection test failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    logError(`Connection test error: ${error.message}`);
    return false;
  }
}

async function createSampleData(config: DatabaseConfig): Promise<boolean> {
  logHeader("Creating Sample Data");

  const sampleDataSQL = `
    USE ${config.name};

    -- Sample admin users (password: 'admin123' - should be changed in production)
    INSERT IGNORE INTO admin_users (site_key, username, password_hash, email) VALUES
    ('pedromdominguez-com', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x', 'admin@pedromdominguez.com'),
    ('domtech', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x', 'admin@domtech.dev');

    -- Sample contact messages
    INSERT IGNORE INTO contact_messages (site_key, name, email, phone, message) VALUES
    ('pedromdominguez-com', 'John Doe', 'john@example.com', '555-1234', 'Interested in web development services for my business.'),
    ('domtech', 'Jane Smith', 'jane@example.com', '555-5678', 'Looking for technical consulting for our startup.');

    -- Sample appointments
    INSERT IGNORE INTO appointments (site_key, name, phone, email, service, message) VALUES
    ('pedromdominguez-com', 'Mike Johnson', '555-9999', 'mike@example.com', 'Website Redesign', 'Need to modernize our company website.'),
    ('domtech', 'Sarah Wilson', '555-0000', 'sarah@example.com', 'IT Consultation', 'Startup needs technology infrastructure guidance.');

    -- Sample site settings
    INSERT IGNORE INTO site_settings (site_key, setting_key, setting_value, setting_type) VALUES
    ('pedromdominguez-com', 'site_title', 'Pedro M. Dominguez - Full Stack Developer', 'string'),
    ('pedromdominguez-com', 'contact_email', 'contact@pedromdominguez.com', 'string'),
    ('domtech', 'site_title', 'DomTech - Technology Solutions', 'string'),
    ('domtech', 'contact_email', 'hello@domtech.dev', 'string');
  `;

  if (!await executeSQL(sampleDataSQL, config)) {
    return false;
  }

  logSuccess("Sample data created successfully");
  return true;
}

function displaySummary(config: DatabaseConfig): void {
  logHeader("Setup Summary");

  console.log(`${Colors.GREEN}✅ Database Setup Complete${Colors.RESET}\n`);
  console.log(`${Colors.CYAN}Database Details:${Colors.RESET}`);
  console.log(`  📊 Database: ${config.name}`);
  console.log(`  👤 User: ${config.user}`);
  console.log(`  🏠 Host: ${config.host}:${config.port}`);
  console.log(`  🔗 Connection: mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.name}`);

  console.log(`\n${Colors.CYAN}Test Connection:${Colors.RESET}`);
  console.log(`  ${Colors.YELLOW}mysql -u ${config.user} -p'${config.password}' -D ${config.name}${Colors.RESET}`);

  console.log(`\n${Colors.YELLOW}⚠️  IMPORTANT SECURITY NOTES:${Colors.RESET}`);
  console.log(`  • Change the default password in production environments`);
  console.log(`  • Update your Deno Genesis config files with these credentials`);
  console.log(`  • Consider using environment variables for sensitive data`);
}

// Main execution function - orchestrates all setup steps
async function main(): Promise<void> {
  // Parse command line arguments - Unix philosophy: accept text input
  const args = parseArgs(Deno.args, {
    boolean: ["sample-data", "test-only", "verbose", "help"],
    string: ["config"],
    default: {
      "sample-data": false,
      "test-only": false,
      "verbose": false,
      "config": "./config/database.json"
    },
    alias: {
      "s": "sample-data",
      "t": "test-only",
      "v": "verbose",
      "h": "help",
      "c": "config"
    }
  });

  if (args.help) {
    console.log(`
Deno Genesis MariaDB Setup Utility

USAGE:
  deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts [OPTIONS]

OPTIONS:
  -s, --sample-data    Create sample data for testing
  -t, --test-only      Only test the database connection
  -v, --verbose        Enable verbose logging
  -c, --config FILE    Use custom config file (default: ./config/database.json)
  -h, --help           Show this help message

EXAMPLES:
  # Basic setup
  deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts

  # Setup with sample data
  deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts --sample-data

  # Test existing connection
  deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts --test-only
    `);
    Deno.exit(0);
  }

  const options: SetupOptions = {
    sampleData: args["sample-data"],
    testOnly: args["test-only"],
    verbose: args.verbose,
    configPath: args.config
  };

  // Load configuration - prefer environment, fall back to defaults
  let config = DEFAULT_CONFIG;

  // Try to load from config file if it exists
  if (await exists(options.configPath)) {
    try {
      const configText = await Deno.readTextFile(options.configPath);
      const fileConfig = JSON.parse(configText);
      config = { ...config, ...fileConfig };
      logInfo(`Loaded configuration from ${options.configPath}`);
    } catch (error) {
      logWarning(`Failed to load config file, using defaults: ${error.message}`);
    }
  }

  // Override with environment variables if present
  config.name = Deno.env.get("DB_NAME") || config.name;
  config.user = Deno.env.get("DB_USER") || config.user;
  config.password = Deno.env.get("DB_PASSWORD") || config.password;
  config.host = Deno.env.get("DB_HOST") || config.host;
  config.port = parseInt(Deno.env.get("DB_PORT") || config.port.toString());

  logHeader("Deno Genesis Framework - MariaDB Setup");

  // Test-only mode
  if (options.testOnly) {
    logInfo("Running in test-only mode");
    const connectionOk = await testConnection(config);
    Deno.exit(connectionOk ? 0 : 1);
  }

  // Check if MariaDB is installed
  if (!await checkMariaDBInstalled()) {
    logWarning("MariaDB not found. Would you like to install it? (This requires sudo privileges)");

    // In a real implementation, you might want to prompt for user input
    // For now, we'll proceed with installation
    if (!await installMariaDB()) {
      logError("MariaDB installation failed. Exiting.");
      Deno.exit(1);
    }
  } else {
    logSuccess("MariaDB client found");
  }

  // Check if MariaDB service is running
  if (!await checkMariaDBRunning()) {
    logInfo("Starting MariaDB service...");
    try {
      const startCmd = new Deno.Command("sudo", {
        args: ["systemctl", "start", "mariadb"]
      });
      await startCmd.output();

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!await checkMariaDBRunning()) {
        logError("Failed to start MariaDB service");
        Deno.exit(1);
      }
    } catch (error) {
      logError(`Failed to start MariaDB: ${error.message}`);
      Deno.exit(1);
    }
  }

  // Create database and tables
  if (!await createDatabase(config)) {
    logError("Database creation failed. Exiting.");
    Deno.exit(1);
  }

  // Create database user
  if (!await createDatabaseUser(config)) {
    logError("User creation failed. Exiting.");
    Deno.exit(1);
  }

  // Test the connection
  if (!await testConnection(config)) {
    logError("Connection test failed. Exiting.");
    Deno.exit(1);
  }

  // Create sample data if requested
  if (options.sampleData) {
    if (!await createSampleData(config)) {
      logWarning("Sample data creation failed, but setup completed successfully");
    }
  }

  // Display summary
  displaySummary(config);

  logSuccess("MariaDB setup completed successfully!");
  logInfo("You can now configure your Deno Genesis applications to use this database.");
}

// Unix philosophy: Fail fast and provide clear error messages
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    if (Deno.args.includes("--verbose")) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}
