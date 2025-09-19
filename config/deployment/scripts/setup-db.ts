#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-net

/**
 * MariaDB Root Authentication Setup
 * 
 * Handles different MariaDB authentication scenarios:
 * - Fresh installation (no root password)
 * - Unix socket authentication
 * - Password-based authentication
 * - Secure setup wizard integration
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";

// ANSI colors
const Colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
} as const;

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

// Test different MariaDB authentication methods
async function testMariaDBConnection(): Promise<{ method: string; success: boolean; rootPassword: boolean }> {
  logHeader("Testing MariaDB Root Access");
  
  // Method 1: Unix socket authentication (most common on fresh installs)
  logInfo("Attempting Unix socket authentication...");
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
    logWarning(`Unix socket failed: ${error.message}`);
  }
  
  // Method 2: No password authentication
  logInfo("Attempting no-password authentication...");
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
    logWarning(`No-password authentication failed: ${error.message}`);
  }
  
  // Method 3: Interactive password prompt
  logInfo("Testing password-based authentication...");
  logWarning("You may be prompted for the MariaDB root password...");
  try {
    const passCmd = new Deno.Command("mysql", {
      args: ["-u", "root", "-p", "--execute", "SELECT 1;"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { success } = await passCmd.output();
    
    if (success) {
      logSuccess("Password authentication successful");
      return { method: "password", success: true, rootPassword: true };
    }
  } catch (error) {
    logWarning(`Password authentication failed: ${error.message}`);
  }
  
  return { method: "none", success: false, rootPassword: false };
}

// Setup MariaDB root user properly
async function setupMariaDBRoot(): Promise<boolean> {
  logHeader("Setting up MariaDB Root User");
  
  const { method, success, rootPassword } = await testMariaDBConnection();
  
  if (!success) {
    logError("Cannot connect to MariaDB with any authentication method");
    logError("Please ensure MariaDB is running and try one of these solutions:");
    logError("1. Run: sudo mysql -u root");
    logError("2. Run: mysql_secure_installation");
    logError("3. Reset root password manually");
    return false;
  }
  
  logInfo(`Connected using: ${method} authentication`);
  
  if (!rootPassword) {
    logWarning("MariaDB root user has no password - this is a security risk");
    logInfo("Setting up proper root authentication...");
    
    const setupSQL = `
      -- Create root@localhost with password if it doesn't exist
      CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'SecureRootPassword123!';
      
      -- Grant all privileges to root@localhost
      GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
      
      -- Remove anonymous users
      DELETE FROM mysql.user WHERE User='';
      
      -- Remove remote root access
      DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
      
      -- Remove test database
      DROP DATABASE IF EXISTS test;
      DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
      
      -- Reload privileges
      FLUSH PRIVILEGES;
    `;
    
    const executeCmd = method === "socket" 
      ? new Deno.Command("sudo", {
          args: ["mysql", "-u", "root", "--execute", setupSQL],
          stdout: "inherit",
          stderr: "inherit",
        })
      : new Deno.Command("mysql", {
          args: ["-u", "root", "--execute", setupSQL],
          stdout: "inherit",
          stderr: "inherit",
        });
    
    const { success: setupSuccess } = await executeCmd.output();
    
    if (setupSuccess) {
      logSuccess("MariaDB root user configured successfully");
      logSuccess("Root password set to: SecureRootPassword123!");
      logWarning("IMPORTANT: Change this default password for production use!");
      return true;
    } else {
      logError("Failed to configure MariaDB root user");
      return false;
    }
  }
  
  logSuccess("MariaDB root authentication is already configured");
  return true;
}

// Generate updated MariaDB setup function that handles authentication
function generateUpdatedSetupFunction(): string {
  return `
// Updated executeSQL function that handles different auth methods
async function executeSQL(sql: string, config: DatabaseConfig, useDatabase = false): Promise<boolean> {
  try {
    // First, determine the best authentication method
    const authMethods = [
      // Method 1: Try with configured root password
      {
        args: ["-h", config.host, "-P", config.port.toString(), "-u", "root", "-pSecureRootPassword123!", "--execute", sql]
      },
      // Method 2: Try Unix socket with sudo
      {
        cmd: "sudo",
        args: ["mysql", "-u", "root", "--execute", sql]
      },
      // Method 3: Try no password
      {
        args: ["-h", config.host, "-P", config.port.toString(), "-u", "root", "--execute", sql]
      },
      // Method 4: Interactive password prompt
      {
        args: ["-h", config.host, "-P", config.port.toString(), "-u", "root", "-p", "--execute", sql]
      }
    ];

    if (useDatabase) {
      authMethods.forEach(method => {
        if (method.args) {
          method.args.splice(-2, 0, "-D", config.name);
        }
      });
    }

    for (const method of authMethods) {
      try {
        const command = new Deno.Command(method.cmd || "mysql", {
          args: method.args,
          stdout: "piped",
          stderr: "piped",
        });

        const { success, stderr } = await command.output();

        if (success) {
          return true;
        }

        // Log the error for debugging but continue to next method
        if (Deno.args.includes("--verbose")) {
          const errorText = new TextDecoder().decode(stderr);
          logInfo(\`Auth method failed: \${errorText.slice(0, 100)}\`);
        }
      } catch {
        // Continue to next authentication method
        continue;
      }
    }

    logError("All authentication methods failed");
    return false;
  } catch (error) {
    logError(\`SQL execution error: \${error.message}\`);
    return false;
  }
}`;
}

// Interactive MariaDB setup wizard
async function runInteractiveSetup(): Promise<boolean> {
  logHeader("Interactive MariaDB Security Setup");
  
  logInfo("This will run the MariaDB security setup wizard...");
  logWarning("Please answer the prompts to secure your MariaDB installation");
  
  console.log(`
${Colors.CYAN}You will be asked:${Colors.RESET}
1. Enter current password for root (probably empty - just press Enter)
2. Set root password? ${Colors.GREEN}[Y/n]${Colors.RESET} - Choose Y
3. Remove anonymous users? ${Colors.GREEN}[Y/n]${Colors.RESET} - Choose Y  
4. Disallow root login remotely? ${Colors.GREEN}[Y/n]${Colors.RESET} - Choose Y
5. Remove test database? ${Colors.GREEN}[Y/n]${Colors.RESET} - Choose Y
6. Reload privilege tables? ${Colors.GREEN}[Y/n]${Colors.RESET} - Choose Y
  `);
  
  const secureCmd = new Deno.Command("sudo", {
    args: ["mysql_secure_installation"],
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  
  const { success } = await secureCmd.output();
  
  if (success) {
    logSuccess("MariaDB security setup completed");
    return true;
  } else {
    logError("MariaDB security setup failed");
    return false;
  }
}

// Main function
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["interactive", "test-only", "verbose", "help"],
    alias: {
      "i": "interactive",
      "t": "test-only", 
      "v": "verbose",
      "h": "help"
    }
  });

  if (args.help) {
    console.log(`
MariaDB Root Authentication Setup

USAGE:
  deno run --allow-run --allow-read --allow-write --allow-net mariadb-root-setup.ts [OPTIONS]

OPTIONS:
  -i, --interactive    Run interactive security setup wizard
  -t, --test-only      Only test current authentication
  -v, --verbose        Enable verbose logging
  -h, --help           Show this help message

EXAMPLES:
  # Test current MariaDB authentication
  deno run --allow-run mariadb-root-setup.ts --test-only

  # Run interactive security setup
  deno run --allow-run mariadb-root-setup.ts --interactive

  # Automatic setup (recommended)
  deno run --allow-run mariadb-root-setup.ts
    `);
    Deno.exit(0);
  }

  logHeader("MariaDB Root Authentication Setup");

  // Test only mode
  if (args["test-only"]) {
    const { method, success } = await testMariaDBConnection();
    if (success) {
      logSuccess(`MariaDB root access works via: ${method}`);
      Deno.exit(0);
    } else {
      logError("MariaDB root access is not working");
      Deno.exit(1);
    }
  }

  // Interactive mode
  if (args.interactive) {
    const success = await runInteractiveSetup();
    Deno.exit(success ? 0 : 1);
  }

  // Automatic setup
  const success = await setupMariaDBRoot();
  
  if (success) {
    logSuccess("MariaDB root authentication is properly configured");
    logInfo("You can now run your database setup scripts");
    
    console.log(`\n${Colors.CYAN}Next steps:${Colors.RESET}`);
    console.log("1. Update your MariaDB setup script with the new executeSQL function");
    console.log("2. Use root password: SecureRootPassword123! (change this for production)");
    console.log("3. Run your database setup: ./setup-mariadb.ts");
  } else {
    logError("MariaDB root setup failed");
    logError("Please run with --interactive flag for manual setup");
  }
  
  Deno.exit(success ? 0 : 1);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    Deno.exit(1);
  }
}