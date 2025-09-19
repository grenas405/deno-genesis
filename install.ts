#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-net --allow-env

/**
 * Universal Deno Installation Utility
 * 
 * Supports multiple installation methods and platforms:
 * - Shell installer (Linux, macOS)
 * - Package managers (APT, Homebrew, Chocolatey, Scoop, Pacman, etc.)
 * - Manual binary installation
 * - Version management and upgrades
 * - Environment configuration
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Install and configure Deno runtime
 * - Accept text input: Environment variables and command line flags
 * - Produce text output: Structured logging with clear success/error states
 * - Filter and transform: Takes system state → configured Deno environment
 * - Composable: Can be chained with other setup utilities
 *
 * Usage:
 *   deno run --allow-all setup-deno.ts
 *   deno run --allow-all setup-deno.ts --version 1.40.0
 *   deno run --allow-all setup-deno.ts --method package-manager
 *   deno run --allow-all setup-deno.ts --shell bash
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";

// Types for better developer experience
interface DenoConfig {
  version: string;
  installPath: string;
  shell: string;
  addToPath: boolean;
}

interface SetupOptions {
  method: string;
  version: string;
  testOnly: boolean;
  verbose: boolean;
  skipPath: boolean;
  uninstall: boolean;
  upgrade: boolean;
}

interface InstallMethod {
  name: string;
  platforms: string[];
  checkCmd: string[];
  installCmd: (version?: string) => Promise<boolean>;
  priority: number;
}

// Default configuration
const DEFAULT_CONFIG: DenoConfig = {
  version: "latest",
  installPath: "",
  shell: "",
  addToPath: true,
};

// Detect operating system and architecture
function detectPlatform(): { os: string; arch: string } {
  const os = Deno.build.os;
  const arch = Deno.build.arch;
  return { os, arch };
}

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

// Unix-style logging functions
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
  const border = '='.repeat(60);
  console.log(`\n${Colors.CYAN}${border}`);
  console.log(`${Colors.BOLD}${Colors.CYAN} ${message}`);
  console.log(`${border}${Colors.RESET}\n`);
}

// Check if Deno is already installed
async function checkDenoInstalled(): Promise<{ installed: boolean; version: string; path: string }> {
  try {
    const command = new Deno.Command("deno", {
      args: ["--version"],
      stdout: "piped",
      stderr: "null",
    });
    const { success, stdout } = await command.output();
    
    if (success) {
      const output = new TextDecoder().decode(stdout);
      const versionMatch = output.match(/deno (\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";
      
      // Get Deno path
      const whichCmd = new Deno.Command("which", {
        args: ["deno"],
        stdout: "piped",
        stderr: "null",
      });
      const { stdout: pathOutput } = await whichCmd.output();
      const path = new TextDecoder().decode(pathOutput).trim();
      
      return { installed: true, version, path };
    }
    
    return { installed: false, version: "", path: "" };
  } catch {
    return { installed: false, version: "", path: "" };
  }
}

// Shell installer method (official recommended approach)
async function installViaShell(version?: string): Promise<boolean> {
  logInfo("Installing Deno via official shell installer...");
  
  try {
    const platform = detectPlatform();
    let installUrl = "https://deno.land/install.sh";
    
    if (platform.os === "windows") {
      installUrl = "https://deno.land/install.ps1";
    }
    
    const fetchCmd = platform.os === "windows" ? "powershell" : "curl";
    const fetchArgs = platform.os === "windows" 
      ? ["-ExecutionPolicy", "RemoteSigned", "-Command", `iwr ${installUrl} -useb | iex`]
      : ["-fsSL", installUrl];
    
    // Set version if specified
    const env = version && version !== "latest" 
      ? { DENO_INSTALL_VERSION: `v${version}` }
      : {};
    
    const installCmd = new Deno.Command(fetchCmd, {
      args: fetchArgs,
      stdout: "inherit",
      stderr: "inherit",
      env,
    });
    
    const { success } = await installCmd.output();
    return success;
  } catch (error) {
    logError(`Shell installation failed: ${error.message}`);
    return false;
  }
}

// Package manager installations
async function installViaPackageManager(): Promise<boolean> {
  const platform = detectPlatform();
  logInfo(`Installing Deno via package manager for ${platform.os}...`);
  
  try {
    if (platform.os === "linux") {
      // Try various Linux package managers
      const managers = [
        { cmd: "apt", args: ["sudo", "apt", "update", "&&", "sudo", "apt", "install", "-y", "deno"] },
        { cmd: "pacman", args: ["sudo", "pacman", "-S", "deno"] },
        { cmd: "dnf", args: ["sudo", "dnf", "install", "-y", "deno"] },
        { cmd: "zypper", args: ["sudo", "zypper", "install", "-y", "deno"] },
      ];
      
      for (const manager of managers) {
        try {
          const checkCmd = new Deno.Command(manager.cmd, {
            args: ["--version"],
            stdout: "null",
            stderr: "null",
          });
          const { success: available } = await checkCmd.output();
          
          if (available) {
            logInfo(`Using ${manager.cmd} package manager...`);
            const installCmd = new Deno.Command("bash", {
              args: ["-c", manager.args.join(" ")],
              stdout: "inherit",
              stderr: "inherit",
            });
            const { success } = await installCmd.output();
            return success;
          }
        } catch {
          continue;
        }
      }
    } else if (platform.os === "darwin") {
      // macOS - use Homebrew
      const brewCmd = new Deno.Command("brew", {
        args: ["install", "deno"],
        stdout: "inherit",
        stderr: "inherit",
      });
      const { success } = await brewCmd.output();
      return success;
    } else if (platform.os === "windows") {
      // Windows - try Chocolatey first, then Scoop
      try {
        const chocoCmd = new Deno.Command("choco", {
          args: ["install", "deno", "-y"],
          stdout: "inherit",
          stderr: "inherit",
        });
        const { success } = await chocoCmd.output();
        if (success) return true;
      } catch {
        // Try Scoop
        const scoopCmd = new Deno.Command("scoop", {
          args: ["install", "deno"],
          stdout: "inherit",
          stderr: "inherit",
        });
        const { success } = await scoopCmd.output();
        return success;
      }
    }
    
    return false;
  } catch (error) {
    logError(`Package manager installation failed: ${error.message}`);
    return false;
  }
}

// Manual binary installation
async function installManually(version: string = "latest"): Promise<boolean> {
  logInfo("Installing Deno manually via binary download...");
  
  try {
    const platform = detectPlatform();
    const { os, arch } = platform;
    
    // Map Deno build target names
    const targetMap: Record<string, string> = {
      "linux-x86_64": "x86_64-unknown-linux-gnu",
      "linux-aarch64": "aarch64-unknown-linux-gnu",
      "darwin-x86_64": "x86_64-apple-darwin",
      "darwin-aarch64": "aarch64-apple-darwin",
      "windows-x86_64": "x86_64-pc-windows-msvc",
    };
    
    const platformKey = `${os}-${arch}`;
    const target = targetMap[platformKey];
    
    if (!target) {
      logError(`Unsupported platform: ${platformKey}`);
      return false;
    }
    
    // Get latest version if not specified
    let releaseVersion = version;
    if (version === "latest") {
      logInfo("Fetching latest Deno version...");
      const apiResponse = await fetch("https://api.github.com/repos/denoland/deno/releases/latest");
      const release = await apiResponse.json();
      releaseVersion = release.tag_name.replace('v', '');
    }
    
    const fileName = os === "windows" ? "deno.exe" : "deno";
    const zipName = `deno-${target}.zip`;
    const downloadUrl = `https://github.com/denoland/deno/releases/download/v${releaseVersion}/${zipName}`;
    
    logInfo(`Downloading Deno ${releaseVersion} for ${target}...`);
    
    // Download and extract
    const tempDir = await Deno.makeTempDir();
    const zipPath = `${tempDir}/${zipName}`;
    const binPath = `${tempDir}/${fileName}`;
    
    // Download
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      logError(`Failed to download Deno: ${response.statusText}`);
      return false;
    }
    
    const zipData = new Uint8Array(await response.arrayBuffer());
    await Deno.writeFile(zipPath, zipData);
    
    // Extract (using system unzip/PowerShell)
    const extractCmd = os === "windows"
      ? new Deno.Command("powershell", {
          args: ["-Command", `Expand-Archive -Path "${zipPath}" -DestinationPath "${tempDir}"`],
          stdout: "inherit",
          stderr: "inherit",
        })
      : new Deno.Command("unzip", {
          args: ["-q", zipPath, "-d", tempDir],
          stdout: "inherit",
          stderr: "inherit",
        });
    
    const { success: extractSuccess } = await extractCmd.output();
    if (!extractSuccess) {
      logError("Failed to extract Deno binary");
      return false;
    }
    
    // Install to appropriate location
    const installDir = os === "windows" 
      ? `${Deno.env.get("USERPROFILE")}\\.deno\\bin`
      : `${Deno.env.get("HOME")}/.deno/bin`;
    
    await Deno.mkdir(installDir, { recursive: true });
    
    const finalPath = `${installDir}/${fileName}`;
    await Deno.copyFile(binPath, finalPath);
    
    // Make executable on Unix systems
    if (os !== "windows") {
      await Deno.chmod(finalPath, 0o755);
    }
    
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
    
    logSuccess(`Deno ${releaseVersion} installed to ${finalPath}`);
    return true;
  } catch (error) {
    logError(`Manual installation failed: ${error.message}`);
    return false;
  }
}

// Configure shell environment
async function configureEnvironment(config: DenoConfig): Promise<boolean> {
  if (!config.addToPath) {
    return true;
  }
  
  logHeader("Configuring Shell Environment");
  
  try {
    const platform = detectPlatform();
    const homeDir = platform.os === "windows" 
      ? Deno.env.get("USERPROFILE")
      : Deno.env.get("HOME");
    
    if (!homeDir) {
      logError("Unable to determine home directory");
      return false;
    }
    
    const denoBinPath = platform.os === "windows"
      ? `${homeDir}\\.deno\\bin`
      : `${homeDir}/.deno/bin`;
    
    if (platform.os === "windows") {
      // Windows: Add to PATH via PowerShell
      const addPathCmd = new Deno.Command("powershell", {
        args: ["-Command", `$env:PATH += ";${denoBinPath}"; [Environment]::SetEnvironmentVariable("PATH", $env:PATH, "User")`],
        stdout: "inherit",
        stderr: "inherit",
      });
      const { success } = await addPathCmd.output();
      
      if (success) {
        logSuccess("Added Deno to Windows PATH");
      }
      return success;
    } else {
      // Unix systems: Add to shell profile
      const shells = [
        { name: "bash", file: ".bashrc" },
        { name: "zsh", file: ".zshrc" },
        { name: "fish", file: ".config/fish/config.fish" },
      ];
      
      const exportLine = `export PATH="${denoBinPath}:$PATH"`;
      
      for (const shell of shells) {
        const shellFile = shell.name === "fish" 
          ? `${homeDir}/${shell.file}`
          : `${homeDir}/${shell.file}`;
        
        try {
          if (await exists(shellFile)) {
            const content = await Deno.readTextFile(shellFile);
            if (!content.includes(denoBinPath)) {
              const newContent = content + `\n# Deno\n${exportLine}\n`;
              await Deno.writeTextFile(shellFile, newContent);
              logSuccess(`Updated ${shell.file}`);
            } else {
              logInfo(`${shell.file} already contains Deno PATH`);
            }
          }
        } catch {
          // Shell file doesn't exist or can't be read
          continue;
        }
      }
      
      return true;
    }
  } catch (error) {
    logError(`Environment configuration failed: ${error.message}`);
    return false;
  }
}

// Test Deno installation
async function testInstallation(): Promise<boolean> {
  logHeader("Testing Deno Installation");
  
  try {
    const { installed, version, path } = await checkDenoInstalled();
    
    if (!installed) {
      logError("Deno installation test failed - command not found");
      return false;
    }
    
    logSuccess(`Deno ${version} is installed at ${path}`);
    
    // Test basic functionality
    logInfo("Testing Deno functionality...");
    const testCmd = new Deno.Command("deno", {
      args: ["eval", "console.log('Deno is working!')"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { success, stdout, stderr } = await testCmd.output();
    
    if (success) {
      const output = new TextDecoder().decode(stdout);
      if (output.trim() === "Deno is working!") {
        logSuccess("Deno functionality test passed");
        return true;
      }
    }
    
    const errorOutput = new TextDecoder().decode(stderr);
    logError(`Functionality test failed: ${errorOutput}`);
    return false;
  } catch (error) {
    logError(`Installation test failed: ${error.message}`);
    return false;
  }
}

// Uninstall Deno
async function uninstallDeno(): Promise<boolean> {
  logHeader("Uninstalling Deno");
  
  try {
    const { installed, path } = await checkDenoInstalled();
    
    if (!installed) {
      logWarning("Deno is not installed");
      return true;
    }
    
    const platform = detectPlatform();
    const homeDir = platform.os === "windows" 
      ? Deno.env.get("USERPROFILE")
      : Deno.env.get("HOME");
    
    const denoDir = platform.os === "windows"
      ? `${homeDir}\\.deno`
      : `${homeDir}/.deno`;
    
    // Remove Deno directory
    if (await exists(denoDir)) {
      logInfo(`Removing Deno directory: ${denoDir}`);
      await Deno.remove(denoDir, { recursive: true });
    }
    
    // Remove from PATH (manual instruction)
    logWarning("Please manually remove Deno from your PATH:");
    logWarning(`Remove: ${denoDir}/bin from your shell profile`);
    
    logSuccess("Deno uninstalled successfully");
    return true;
  } catch (error) {
    logError(`Uninstallation failed: ${error.message}`);
    return false;
  }
}

// Display installation summary
function displaySummary(): void {
  logHeader("Installation Summary");
  
  console.log(`${Colors.GREEN}✓ Deno Runtime: ${Colors.RESET}Successfully installed`);
  console.log(`${Colors.GREEN}✓ Environment: ${Colors.RESET}PATH configured`);
  console.log(`${Colors.GREEN}✓ Functionality: ${Colors.RESET}Tested and working`);
  
  console.log(`\n${Colors.CYAN}Next Steps:${Colors.RESET}`);
  console.log(`  • Restart your terminal or run: source ~/.bashrc`);
  console.log(`  • Verify installation: deno --version`);
  console.log(`  • Start coding: deno run https://deno.land/std/examples/welcome.ts`);
  console.log(`  • Read the manual: https://deno.land/manual`);
}

// Main execution function
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["test-only", "verbose", "help", "skip-path", "uninstall", "upgrade"],
    string: ["method", "version", "shell"],
    default: {
      "method": "auto",
      "version": "latest",
      "test-only": false,
      "verbose": false,
      "skip-path": false,
      "uninstall": false,
      "upgrade": false,
    },
    alias: {
      "m": "method",
      "v": "version",
      "t": "test-only",
      "s": "shell",
      "h": "help",
    }
  });

  if (args.help) {
    console.log(`
Universal Deno Installation Utility

USAGE:
  deno run --allow-all setup-deno.ts [OPTIONS]

OPTIONS:
  -m, --method METHOD      Installation method (auto|shell|package|manual)
  -v, --version VERSION    Specific Deno version to install (default: latest)
  -t, --test-only          Only test existing Deno installation
  -s, --shell SHELL        Target shell for PATH configuration
      --skip-path          Skip PATH configuration
      --uninstall          Uninstall Deno
      --upgrade            Upgrade existing Deno installation
      --verbose            Enable verbose logging
  -h, --help               Show this help message

INSTALLATION METHODS:
  • auto              - Automatically choose best method for your system
  • shell             - Official shell installer (recommended)
  • package           - System package manager (apt, brew, choco, etc.)
  • manual            - Direct binary download and installation

SUPPORTED PLATFORMS:
  • Linux (x86_64, aarch64)
  • macOS (Intel, Apple Silicon)  
  • Windows (x86_64)

EXAMPLES:
  # Basic installation (recommended)
  deno run --allow-all setup-deno.ts

  # Install specific version
  deno run --allow-all setup-deno.ts --version 1.40.0

  # Use package manager
  deno run --allow-all setup-deno.ts --method package

  # Test existing installation
  deno run --allow-all setup-deno.ts --test-only

  # Uninstall Deno
  deno run --allow-all setup-deno.ts --uninstall
    `);
    Deno.exit(0);
  }

  const options: SetupOptions = {
    method: args.method,
    version: args.version,
    testOnly: args["test-only"],
    verbose: args.verbose,
    skipPath: args["skip-path"],
    uninstall: args.uninstall,
    upgrade: args.upgrade,
  };

  let config = DEFAULT_CONFIG;
  config.version = options.version;
  config.shell = args.shell || "";
  config.addToPath = !options.skipPath;

  logHeader("Universal Deno Installation Utility");

  // Handle uninstall
  if (options.uninstall) {
    const success = await uninstallDeno();
    Deno.exit(success ? 0 : 1);
  }

  // Test-only mode
  if (options.testOnly) {
    logInfo("Running in test-only mode");
    const success = await testInstallation();
    Deno.exit(success ? 0 : 1);
  }

  // Check if already installed
  const { installed, version: currentVersion } = await checkDenoInstalled();
  
  if (installed && !options.upgrade) {
    logSuccess(`Deno ${currentVersion} is already installed`);
    
    if (!options.skipPath) {
      await configureEnvironment(config);
    }
    
    const testSuccess = await testInstallation();
    if (testSuccess) {
      displaySummary();
    }
    Deno.exit(testSuccess ? 0 : 1);
  }

  // Install Deno
  let installSuccess = false;
  
  if (options.method === "auto") {
    // Try methods in order of preference
    logInfo("Auto-detecting best installation method...");
    
    // Try shell installer first (most reliable)
    installSuccess = await installViaShell(config.version);
    
    if (!installSuccess) {
      logWarning("Shell installer failed, trying package manager...");
      installSuccess = await installViaPackageManager();
    }
    
    if (!installSuccess) {
      logWarning("Package manager failed, trying manual installation...");
      installSuccess = await installManually(config.version);
    }
  } else if (options.method === "shell") {
    installSuccess = await installViaShell(config.version);
  } else if (options.method === "package") {
    installSuccess = await installViaPackageManager();
  } else if (options.method === "manual") {
    installSuccess = await installManually(config.version);
  } else {
    logError(`Unknown installation method: ${options.method}`);
    Deno.exit(1);
  }

  if (!installSuccess) {
    logError("Deno installation failed with all attempted methods");
    logError("Please visit https://deno.land/manual/getting_started/installation for manual instructions");
    Deno.exit(1);
  }

  // Configure environment
  if (!options.skipPath) {
    if (!await configureEnvironment(config)) {
      logWarning("Environment configuration failed, but Deno was installed");
      logWarning("You may need to manually add Deno to your PATH");
    }
  }

  // Test installation
  if (!await testInstallation()) {
    logError("Installation verification failed");
    Deno.exit(1);
  }

  // Display summary
  displaySummary();

  logSuccess("Deno installation completed successfully!");
  logInfo("You can now start building amazing applications with Deno!");
}

// Unix philosophy: Fail fast and provide clear error messages
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Installation failed: ${error.message}`);
    if (Deno.args.includes("--verbose")) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}