#!/usr/bin/env -S deno run --allow-sys --allow-env --allow-run --allow-read --allow-write --allow-net

/**
 * Universal Deno Genesis MariaDB Setup Utility
 *
 * Supports all major Linux package managers:
 * - APT (Debian, Ubuntu, Mint)
 * - YUM/DNF (RHEL, CentOS, Fedora)
 * - Pacman (Arch Linux, Manjaro)
 * - Zypper (openSUSE)
 * - APK (Alpine Linux)
 * - Portage (Gentoo)
 * - XBPS (Void Linux)
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

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";

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

interface PackageManager {
  name: string;
  checkCmd: string[];
  updateCmd: string[];
  installCmd: string[];
  packages: string[];
  serviceName: string;
}

interface AuthMethod {
  method: string;
  success: boolean;
  rootPassword: boolean;
}

// Default configuration - follows principle of sensible defaults
const DEFAULT_CONFIG: DatabaseConfig = {
  name: "universal_db",
  user: "webadmin",
  password: "Password123!",
  host: "localhost",
  port: 3306,
};

// Package manager configurations
const PACKAGE_MANAGERS: PackageManager[] = [
  {
    name: "APT",
    checkCmd: ["apt", "--version"],
    updateCmd: ["sudo", "apt", "update"],
    installCmd: ["sudo", "apt", "install", "-y"],
    packages: ["mariadb-server", "mariadb-client"],
    serviceName: "mariadb",
  },
  {
    name: "DNF",
    checkCmd: ["dnf", "--version"],
    updateCmd: ["sudo", "dnf", "check-update"],
    installCmd: ["sudo", "dnf", "install", "-y"],
    packages: ["mariadb-server", "mariadb"],
    serviceName: "mariadb",
  },
  {
    name: "YUM",
    checkCmd: ["yum", "--version"],
    updateCmd: ["sudo", "yum", "check-update"],
    installCmd: ["sudo", "yum", "install", "-y"],
    packages: ["mariadb-server", "mariadb"],
    serviceName: "mariadb",
  },
  {
    name: "Pacman",
    checkCmd: ["pacman", "--version"],
    updateCmd: ["sudo", "pacman", "-Sy"],
    installCmd: ["sudo", "pacman", "-S", "--noconfirm"],
    packages: ["mariadb"],
    serviceName: "mariadb",
  },
  {
    name: "Zypper",
    checkCmd: ["zypper", "--version"],
    updateCmd: ["sudo", "zypper", "refresh"],
    installCmd: ["sudo", "zypper", "install", "-y"],
    packages: ["mariadb", "mariadb-client"],
    serviceName: "mariadb",
  },
  {
    name: "APK",
    checkCmd: ["apk", "--version"],
    updateCmd: ["sudo", "apk", "update"],
    installCmd: ["sudo", "apk", "add"],
    packages: ["mariadb", "mariadb-client"],
    serviceName: "mariadb",
  },
  {
    name: "Portage",
    checkCmd: ["emerge", "--version"],
    updateCmd: ["sudo", "emerge", "--sync"],
    installCmd: ["sudo", "emerge"],
    packages: ["dev-db/mariadb"],
    serviceName: "mariadb",
  },
  {
    name: "XBPS",
    checkCmd: ["xbps-install", "--version"],
    updateCmd: ["sudo", "xbps-install", "-S"],
    installCmd: ["sudo", "xbps-install", "-y"],
    packages: ["mariadb"],
    serviceName: "mariadb",
  },
];

// ANSI color codes for Unix-style terminal output
const Colors = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  WHITE: "\x1b[37m",
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
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
  const border = "=".repeat(50);
  console.log(`\n${Colors.CYAN}${border}`);
  console.log(`${Colors.BOLD}${Colors.CYAN} ${message}`);
  console.log(`${border}${Colors.RESET}\n`);
}

function logPasswordPrompt(promptType: "root" | "webadmin"): void {
  const userInfo = promptType === "root" 
    ? "MariaDB root user (root@localhost)"
    : "Database user (webadmin)";
  
  console.log(`\n${Colors.YELLOW}[PASSWORD REQUIRED]${Colors.RESET} ${Colors.BOLD}${userInfo}${Colors.RESET}`);
  console.log(`${Colors.CYAN}You will be prompted for the ${promptType === "root" ? "MariaDB root" : "webadmin"} password.${Colors.RESET}`);
  
  if (promptType === "root") {
    console.log(`${Colors.YELLOW}Note: This is the MariaDB root@localhost database password${Colors.RESET}`);
    console.log(`${Colors.YELLOW}      (not your system user password)${Colors.RESET}`);
  } else {
    console.log(`${Colors.YELLOW}Note: This is the webadmin database user password${Colors.RESET}`);
    console.log(`${Colors.YELLOW}      Default: Password123! (if just installed)${Colors.RESET}`);
  }
  console.log("");
}

// Test different MariaDB authentication methods
async function testMariaDBConnection(): Promise<AuthMethod> {
  logHeader("Testing MariaDB Root Access");
  
  // Method 1: Unix socket authentication (most common on fresh installs)
  logInfo("Testing Unix socket authentication...");
  try {
    const socketCmd = new Deno.Command("sudo", {
      args: ["mysql", "-u", "root", "--execute", "SELECT 1;"],
      stdout: "piped",
      stderr: "piped",
    });
    const { success } = await socketCmd.output();
    
    if (success) {
      logSuccess("Unix socket authentication successful");
      return { method: "socket", success: true, rootPassword: false };
    }
  } catch (error) {
    logWarning(`Unix socket failed: ${(error as Error).message}`);
  }
  
  // Method 2: No password authentication
  logInfo("Testing no-password authentication...");
  try {
    const noPassCmd = new Deno.Command("mysql", {
      args: ["-u", "root", "--execute", "SELECT 1;"],
      stdout: "piped",
      stderr: "piped",
    });
    const { success } = await noPassCmd.output();
    
    if (success) {
      logSuccess("No-password authentication successful");
      return { method: "no-password", success: true, rootPassword: false };
    }
  } catch (error) {
    logWarning(`No-password authentication failed: ${(error as Error).message}`);
  }
  
  // Method 3: Interactive password prompt with clear messaging
  logPasswordPrompt("root");
  try {
    const passCmd = new Deno.Command("mysql", {
      args: ["-u", "root", "-p", "--execute", "SELECT 1;"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { success } = await passCmd.output();
    
    if (success) {
      logSuccess("Root password authentication successful");
      return { method: "password", success: true, rootPassword: true };
    }
  } catch (error) {
    logWarning(`Password authentication failed: ${(error as Error).message}`);
  }
  
  return { method: "none", success: false, rootPassword: false };
}

// Detect available package manager
async function detectPackageManager(): Promise<PackageManager | null> {
  logInfo("Detecting package manager...");

  for (const pm of PACKAGE_MANAGERS) {
    try {
      const command = new Deno.Command(pm.checkCmd[0], {
        args: pm.checkCmd.slice(1),
        stdout: "null",
        stderr: "null",
      });
      const { success } = await command.output();

      if (success) {
        logSuccess(`Detected package manager: ${pm.name}`);
        return pm;
      }
    } catch {
      // Command not found, continue to next package manager
      continue;
    }
  }

  return null;
}

// Unix philosophy: Small functions that do one thing well
async function checkRootPrivileges(): Promise<boolean> {
  try {
    // Check if running as root
    const uid = Deno.uid();
    if (uid === 0) {
      logWarning(
        "Running as root user - this is not recommended for security reasons",
      );
      return true;
    }

    // Check if user has sudo privileges by testing a harmless sudo command
    const sudoTestCmd = new Deno.Command("sudo", {
      args: ["-n", "true"], // -n flag means non-interactive (don't prompt for password)
      stdout: "null",
      stderr: "null",
    });
    const { success } = await sudoTestCmd.output();

    if (success) {
      logSuccess("Sudo privileges confirmed");
      return true;
    }

    // If non-interactive sudo failed, try to prompt for password
    logInfo("Testing sudo access (you may be prompted for your password)...");
    const sudoPromptCmd = new Deno.Command("sudo", {
      args: ["true"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { success: promptSuccess } = await sudoPromptCmd.output();

    if (promptSuccess) {
      logSuccess("Sudo privileges confirmed with password");
      return true;
    }

    return false;
  } catch (error) {
    logError(`Failed to check privileges: ${(error as Error).message}`);
    return false;
  }
}

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

async function checkMariaDBRunning(serviceName: string): Promise<boolean> {
  try {
    // Try systemctl first (most common)
    const systemctlCommand = new Deno.Command("systemctl", {
      args: ["is-active", serviceName],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await systemctlCommand.output();

    if (success) return true;

    // Try alternative service names
    const altNames = ["mysql", "mysqld"];
    for (const altName of altNames) {
      const altCommand = new Deno.Command("systemctl", {
        args: ["is-active", altName],
        stdout: "null",
        stderr: "null",
      });
      const { success: altSuccess } = await altCommand.output();
      if (altSuccess) return true;
    }

    // Try service command (older systems)
    const serviceCommand = new Deno.Command("service", {
      args: [serviceName, "status"],
      stdout: "null",
      stderr: "null",
    });
    const { success: serviceSuccess } = await serviceCommand.output();
    return serviceSuccess;
  } catch {
    return false;
  }
}

async function installMariaDB(
  packageManager: PackageManager,
): Promise<boolean> {
  logHeader(`Installing MariaDB Server using ${packageManager.name}`);

  try {
    // Update package list
    logInfo("Updating package list...");
    const updateCmd = new Deno.Command(packageManager.updateCmd[0], {
      args: packageManager.updateCmd.slice(1),
      stdout: "inherit",
      stderr: "inherit",
    });
    await updateCmd.output();

    // Install MariaDB packages
    logInfo(
      `Installing MariaDB packages: ${packageManager.packages.join(", ")}`,
    );
    const installCmd = new Deno.Command(packageManager.installCmd[0], {
      args: [...packageManager.installCmd.slice(1), ...packageManager.packages],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { success } = await installCmd.output();

    if (!success) {
      logError("Failed to install MariaDB packages");
      return false;
    }

    // Special handling for Arch Linux (Pacman)
    if (packageManager.name === "Pacman") {
      logInfo("Initializing MariaDB data directory (Arch Linux)...");
      const initCmd = new Deno.Command("sudo", {
        args: [
          "mariadb-install-db",
          "--user=mysql",
          "--basedir=/usr",
          "--datadir=/var/lib/mysql",
        ],
        stdout: "inherit",
        stderr: "inherit",
      });
      await initCmd.output();
    }

    // Special handling for Gentoo (Portage)
    if (packageManager.name === "Portage") {
      logInfo("Configuring MariaDB (Gentoo)...");
      const configCmd = new Deno.Command("sudo", {
        args: ["emerge", "--config", "=dev-db/mariadb-10.6.0"], // Adjust version as needed
        stdout: "inherit",
        stderr: "inherit",
      });
      await configCmd.output();
    }

    // Start and enable MariaDB service
    logInfo("Starting and enabling MariaDB service...");

    // Try systemctl first
    try {
      const startCmd = new Deno.Command("sudo", {
        args: ["systemctl", "start", packageManager.serviceName],
        stdout: "inherit",
        stderr: "inherit",
      });
      await startCmd.output();

      const enableCmd = new Deno.Command("sudo", {
        args: ["systemctl", "enable", packageManager.serviceName],
        stdout: "inherit",
        stderr: "inherit",
      });
      await enableCmd.output();
    } catch {
      // Fallback to service command
      logInfo("Systemctl not available, trying service command...");
      const serviceCmd = new Deno.Command("sudo", {
        args: ["service", packageManager.serviceName, "start"],
        stdout: "inherit",
        stderr: "inherit",
      });
      await serviceCmd.output();
    }

    // For Alpine Linux, use OpenRC
    if (packageManager.name === "APK") {
      logInfo("Using OpenRC for Alpine Linux...");
      const rcUpdateCmd = new Deno.Command("sudo", {
        args: ["rc-update", "add", packageManager.serviceName, "default"],
        stdout: "inherit",
        stderr: "inherit",
      });
      await rcUpdateCmd.output();

      const rcServiceCmd = new Deno.Command("sudo", {
        args: ["rc-service", packageManager.serviceName, "start"],
        stdout: "inherit",
        stderr: "inherit",
      });
      await rcServiceCmd.output();
    }

    logSuccess("MariaDB installation completed");
    return true;
  } catch (error) {
    logError(`Installation failed: ${(error as Error).message}`);
    return false;
  }
}

async function executeSQL(
  sql: string,
  config: DatabaseConfig,
  useDatabase = false,
  authMethod?: AuthMethod
): Promise<boolean> {
  try {
    // Determine the best authentication method based on previous testing
    let mysqlArgs: string[] = [];
    let command: string = "mysql";
    let useSudo = false;

    if (authMethod?.method === "socket") {
      // Use Unix socket with sudo
      useSudo = true;
      mysqlArgs = ["-u", "root", "--execute", sql];
    } else if (authMethod?.method === "no-password") {
      // Use direct connection without password
      mysqlArgs = [
        "-h", config.host,
        "-P", config.port.toString(),
        "-u", "root",
        "--execute", sql,
      ];
    } else {
      // Use password authentication with clear prompt
      logPasswordPrompt("root");
      mysqlArgs = [
        "-h", config.host,
        "-P", config.port.toString(),
        "-u", "root",
        "-p",
        "--execute", sql,
      ];
    }

    if (useDatabase) {
      mysqlArgs.splice(-2, 0, "-D", config.name);
    }

    const cmd = useSudo 
      ? new Deno.Command("sudo", { args: ["mysql", ...mysqlArgs], stdout: "null", stderr: "piped" })
      : new Deno.Command(command, { args: mysqlArgs, stdout: "null", stderr: "piped" });

    const { success, stderr } = await cmd.output();

    if (!success) {
      const errorText = new TextDecoder().decode(stderr);
      logError(`SQL execution failed: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    logError(`SQL execution error: ${(error as Error).message}`);
    return false;
  }
}

async function createDatabase(config: DatabaseConfig, authMethod: AuthMethod): Promise<boolean> {
  logHeader("Creating Database and Tables");

  // Create database
  logInfo(`Creating database: ${config.name}`);
  const createDbSQL = `
    CREATE DATABASE IF NOT EXISTS ${config.name}
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
  `;

  if (!await executeSQL(createDbSQL, config, false, authMethod)) {
    return false;
  }

  // Create tables with multi-tenant structure
  const createTablesSQL = `
    USE ${config.name};

    -- Sites table for multi-tenant architecture
    CREATE TABLE IF NOT EXISTS sites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL UNIQUE,
      domain VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      settings JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      INDEX idx_site_key (site_key),
      INDEX idx_domain (domain),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB;

    -- Content table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      type ENUM('page', 'post', 'product', 'service') NOT NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      content TEXT,
      excerpt TEXT,
      meta_title VARCHAR(255),
      meta_description TEXT,
      featured_image VARCHAR(500),
      status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
      author_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      published_at TIMESTAMP NULL,
      sort_order INT DEFAULT 0,
      INDEX idx_site_key (site_key),
      INDEX idx_type (type),
      INDEX idx_slug (slug),
      INDEX idx_status (status),
      INDEX idx_published_at (published_at),
      INDEX idx_sort_order (sort_order),
      UNIQUE KEY unique_slug_site (site_key, slug)
    ) ENGINE=InnoDB;

    -- Projects table (Multi-tenant)
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      site_key VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT,
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

  if (!await executeSQL(createTablesSQL, config, false, authMethod)) {
    return false;
  }

  logSuccess("Database and tables created successfully");
  return true;
}

async function createDatabaseUser(config: DatabaseConfig, authMethod: AuthMethod): Promise<boolean> {
  logHeader("Creating Database User");

  const createUserSQL = `
    CREATE USER IF NOT EXISTS '${config.user}'@'localhost' IDENTIFIED BY '${config.password}';
    GRANT ALL PRIVILEGES ON ${config.name}.* TO '${config.user}'@'localhost';
    FLUSH PRIVILEGES;
  `;

  if (!await executeSQL(createUserSQL, config, false, authMethod)) {
    return false;
  }

  logSuccess(`Database user '${config.user}' created successfully`);
  return true;
}

async function testConnection(config: DatabaseConfig): Promise<boolean> {
  logHeader("Testing Database Connection");

  try {
    logPasswordPrompt("webadmin");
    
    const testCmd = new Deno.Command("mysql", {
      args: [
        "-h", config.host,
        "-P", config.port.toString(),
        "-u", config.user,
        "-p",
        "-D", config.name,
        "--execute", "SELECT 1 as test_connection;",
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout, stderr } = await testCmd.output();

    if (success) {
      logSuccess("Database connection test passed");
      return true;
    } else {
      const errorText = new TextDecoder().decode(stderr);
      logError(`Connection test failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    logError(`Connection test error: ${(error as Error).message}`);
    return false;
  }
}

async function createSampleData(config: DatabaseConfig, authMethod: AuthMethod): Promise<boolean> {
  logHeader("Creating Sample Data");

  const sampleDataSQL = `
    INSERT IGNORE INTO sites (site_key, domain, name, description) VALUES
    ('demo', 'demo.example.com', 'Demo Site', 'A demonstration site for Deno Genesis'),
    ('portfolio', 'portfolio.example.com', 'Portfolio Site', 'Personal portfolio website');

    INSERT IGNORE INTO content (site_key, type, title, slug, content, status, published_at) VALUES
    ('demo', 'page', 'Home', 'home', 'Welcome to our demo site!', 'published', NOW()),
    ('demo', 'page', 'About', 'about', 'Learn more about our company.', 'published', NOW()),
    ('portfolio', 'page', 'Home', 'home', 'Welcome to my portfolio!', 'published', NOW()),
    ('portfolio', 'post', 'My First Project', 'my-first-project', 'This is my first project...', 'published', NOW());

    INSERT IGNORE INTO projects (site_key, title, slug, description, status, is_featured) VALUES
    ('portfolio', 'Deno Genesis Framework', 'deno-genesis', 'A powerful web framework built with Deno', 'development', true),
    ('portfolio', 'MariaDB Setup Tool', 'mariadb-setup', 'Universal database setup utility', 'completed', false);
  `;

  if (!await executeSQL(sampleDataSQL, config, true, authMethod)) {
    return false;
  }

  logSuccess("Sample data created successfully");
  return true;
}

function displaySummary(config: DatabaseConfig): void {
  logHeader("Setup Summary");

  console.log(
    `${Colors.GREEN}✓ MariaDB Server: ${Colors.RESET}Installed and running`,
  );
  console.log(`${Colors.GREEN}✓ Database: ${Colors.RESET}${config.name}`);
  console.log(`${Colors.GREEN}✓ Database User: ${Colors.RESET}${config.user}`);
  console.log(
    `${Colors.GREEN}✓ Host: ${Colors.RESET}${config.host}:${config.port}`,
  );

  console.log(`\n${Colors.CYAN}Database Connection Details:${Colors.RESET}`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.name}`);
  console.log(`  Username: ${config.user}`);
  console.log(`  Password: [CONFIGURED]`);

  console.log(`\n${Colors.YELLOW}Next Steps:${Colors.RESET}`);
  console.log(
    `  • Update your Deno Genesis config files with these credentials`,
  );
  console.log(`  • Consider using environment variables for sensitive data`);
  console.log(`  • Review the created database schema and sample data`);
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
      "config": "./config/database.json",
    },
    alias: {
      "s": "sample-data",
      "t": "test-only",
      "v": "verbose",
      "h": "help",
      "c": "config",
    },
  });

  if (args.help) {
    console.log(`
Universal Deno Genesis MariaDB Setup Utility

USAGE:
  deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts [OPTIONS]

OPTIONS:
  -s, --sample-data    Create sample data for testing
  -t, --test-only      Only test the database connection
  -v, --verbose        Enable verbose logging
  -c, --config FILE    Use custom config file (default: ./config/database.json)
  -h, --help           Show this help message

SUPPORTED PACKAGE MANAGERS:
  • APT (Debian, Ubuntu, Linux Mint)
  • DNF/YUM (Fedora, RHEL, CentOS)
  • Pacman (Arch Linux, Manjaro)
  • Zypper (openSUSE)
  • APK (Alpine Linux)
  • Portage (Gentoo)
  • XBPS (Void Linux)

EXAMPLES:
  # Basic setup (requires sudo)
  sudo deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts

  # Setup with sample data
  sudo deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts --sample-data

  # Test existing connection (no sudo required)
  deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts --test-only

PRIVILEGE REQUIREMENTS:
  • Package installation requires root/sudo privileges
  • Service management requires root/sudo privileges
  • Database operations can run as regular user
  • Test-only mode does not require elevated privileges

PASSWORD PROMPTS:
  • First prompts ask for MariaDB 'root'@'localhost' password
  • Final prompt asks for 'webadmin' database user password
    `);
    Deno.exit(0);
  }

  const options: SetupOptions = {
    sampleData: args["sample-data"],
    testOnly: args["test-only"],
    verbose: args.verbose,
    configPath: args.config,
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
      logWarning(
        `Failed to load config file, using defaults: ${(error as Error).message}`,
      );
    }
  }

  // Override with environment variables if present
  config.name = Deno.env.get("DB_NAME") || config.name;
  config.user = Deno.env.get("DB_USER") || config.user;
  config.password = Deno.env.get("DB_PASSWORD") || config.password;
  config.host = Deno.env.get("DB_HOST") || config.host;
  config.port = parseInt(Deno.env.get("DB_PORT") || config.port.toString());

  logHeader("Universal Deno Genesis Framework - MariaDB Setup");

  // Test-only mode
  if (options.testOnly) {
    logInfo("Running in test-only mode");
    const connectionOk = await testConnection(config);
    Deno.exit(connectionOk ? 0 : 1);
  }

  // Check for root/sudo privileges first - required for package installation
  logInfo("Checking system privileges...");
  if (!await checkRootPrivileges()) {
    logError("This script requires root privileges or sudo access to:");
    logError("  • Install MariaDB packages");
    logError("  • Start and enable system services");
    logError("  • Configure MariaDB system settings");
    logError("");
    logError("Please run one of the following:");
    logError(
      "  sudo deno run --allow-run --allow-read --allow-write --allow-net setup-mariadb.ts",
    );
    logError("  Or ensure your user is in the sudo group");
    Deno.exit(1);
  }

  // Detect package manager
  const packageManager = await detectPackageManager();
  if (!packageManager) {
    logError("No supported package manager found!");
    logError(
      "Supported package managers: APT, DNF, YUM, Pacman, Zypper, APK, Portage, XBPS",
    );
    Deno.exit(1);
  }

  // Check if MariaDB is installed
  if (!await checkMariaDBInstalled()) {
    logWarning("MariaDB not found. Installing it now...");

    if (!await installMariaDB(packageManager)) {
      logError("MariaDB installation failed. Exiting.");
      Deno.exit(1);
    }
  } else {
    logSuccess("MariaDB client found");
  }

  // Check if MariaDB service is running
  if (!await checkMariaDBRunning(packageManager.serviceName)) {
    logInfo("Starting MariaDB service...");
    try {
      const startCmd = new Deno.Command("sudo", {
        args: ["systemctl", "start", packageManager.serviceName],
      });
      await startCmd.output();

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (!await checkMariaDBRunning(packageManager.serviceName)) {
        logError("Failed to start MariaDB service");
        Deno.exit(1);
      }
    } catch (error) {
      logError(`Failed to start MariaDB: ${(error as Error).message}`);
      Deno.exit(1);
    }
  }

  // Test MariaDB connection and determine authentication method
  const authMethod = await testMariaDBConnection();
  if (!authMethod.success) {
    logError("Cannot establish connection to MariaDB. Please check:");
    logError("  • MariaDB service is running");
    logError("  • Root user authentication is configured");
    logError("  • Try running: sudo mysql_secure_installation");
    Deno.exit(1);
  }

  // Create database and tables
  if (!await createDatabase(config, authMethod)) {
    logError("Database creation failed. Exiting.");
    Deno.exit(1);
  }

  // Create database user
  if (!await createDatabaseUser(config, authMethod)) {
    logError("User creation failed. Exiting.");
    Deno.exit(1);
  }

  // Test the connection with the new user
  if (!await testConnection(config)) {
    logError("Connection test failed. Exiting.");
    Deno.exit(1);
  }

  // Create sample data if requested
  if (options.sampleData) {
    if (!await createSampleData(config, authMethod)) {
      logWarning(
        "Sample data creation failed, but setup completed successfully",
      );
    }
  }

  // Display summary
  displaySummary(config);

  logSuccess("MariaDB setup completed successfully!");
  logInfo(
    "You can now configure your Deno Genesis applications to use this database.",
  );
}

// Unix philosophy: Fail fast and provide clear error messages
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Setup failed: ${(error as Error).message}`);
    if (Deno.args.includes("--verbose")) {
      console.error((error as Error).stack);
    }
    Deno.exit(1);
  }
}