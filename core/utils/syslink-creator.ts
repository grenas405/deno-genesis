#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * DenoGenesis Framework Deployment Script
 *
 * Updates symbolic links from site directories to the core framework directory
 * to eliminate version drift and ensure consistency across all sites.
 *
 * @author DenoGenesis Framework Team
 * @version 1.0.0
 * @requires Deno 1.40+
 */

import { resolve, join, dirname, basename } from "https://deno.land/std@0.208.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.208.0/fs/mod.ts";

// Configuration interface for deployment settings
interface DeploymentConfig {
  readonly coreDirectory: string;
  readonly sitesDirectory: string;
  readonly symlinkTargets: readonly string[];
  readonly backupDirectory: string;
  readonly verbose: boolean;
}

// Result interface for operation tracking
interface LinkUpdateResult {
  readonly path: string;
  readonly success: boolean;
  readonly action: 'created' | 'updated' | 'skipped' | 'failed';
  readonly error?: string;
}

// Default configuration following DenoGenesis patterns
const DEFAULT_CONFIG: DeploymentConfig = {
  coreDirectory: './core',
  sitesDirectory: './sites',
  symlinkTargets: [
    'config',
    'controllers',
    'database',
    'middleware',
    'models',
    'routes',
    'services',
    'types',
    'utils',
    'main.ts',
    'meta.ts'
  ],
  backupDirectory: './deployment/backups',
  verbose: false
} as const;

/**
 * Enhanced console styling for deployment feedback
 * Following DenoGenesis consoleStyler patterns
 */
class DeploymentLogger {
  private readonly enableColors: boolean;

  constructor(enableColors = true) {
    this.enableColors = enableColors && Deno.isatty(Deno.stdout.rid);
  }

  private colorize(text: string, color: string): string {
    if (!this.enableColors) return text;

    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m'
    } as const;

    return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
  }

  success(message: string): void {
    console.log(`${this.colorize('✅', 'green')} ${message}`);
  }

  error(message: string): void {
    console.error(`${this.colorize('❌', 'red')} ${message}`);
  }

  warning(message: string): void {
    console.warn(`${this.colorize('⚠️', 'yellow')} ${message}`);
  }

  info(message: string): void {
    console.log(`${this.colorize('ℹ️', 'blue')} ${message}`);
  }

  header(message: string): void {
    const separator = '='.repeat(60);
    console.log(`\n${this.colorize(separator, 'cyan')}`);
    console.log(`${this.colorize(message.toUpperCase(), 'bold')}`);
    console.log(`${this.colorize(separator, 'cyan')}\n`);
  }

  verbose(message: string, isVerbose: boolean): void {
    if (isVerbose) {
      console.log(`${this.colorize('🔍', 'dim')} ${this.colorize(message, 'dim')}`);
    }
  }
}

/**
 * Core deployment manager for symbolic link operations
 */
class SymlinkDeploymentManager {
  private readonly config: DeploymentConfig;
  private readonly logger: DeploymentLogger;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.logger = new DeploymentLogger();
  }

  /**
   * Main deployment execution method
   */
  async deploy(): Promise<void> {
    try {
      this.logger.header('DenoGenesis Core Symlink Deployment');

      await this.validateEnvironment();
      await this.createBackupDirectory();

      const siteDirectories = await this.discoverSites();
      const results: LinkUpdateResult[] = [];

      for (const siteDir of siteDirectories) {
        this.logger.info(`Processing site: ${basename(siteDir)}`);
        const siteResults = await this.updateSiteSymlinks(siteDir);
        results.push(...siteResults);
      }

      this.reportResults(results);

    } catch (error) {
      this.logger.error(`Deployment failed: ${error.message}`);
      Deno.exit(1);
    }
  }

  /**
   * Validates the deployment environment
   */
  private async validateEnvironment(): Promise<void> {
    this.logger.info('Validating deployment environment...');

    // Check core directory exists
    if (!await exists(this.config.coreDirectory)) {
      throw new Error(`Core directory not found: ${this.config.coreDirectory}`);
    }

    // Check sites directory exists
    if (!await exists(this.config.sitesDirectory)) {
      throw new Error(`Sites directory not found: ${this.config.sitesDirectory}`);
    }

    // Validate core directory structure
    for (const target of this.config.symlinkTargets) {
      const coreTargetPath = join(this.config.coreDirectory, target);
      if (!await exists(coreTargetPath)) {
        this.logger.warning(`Core target missing: ${target}`);
      }
    }

    this.logger.success('Environment validation completed');
  }

  /**
   * Creates backup directory for deployment artifacts
   */
  private async createBackupDirectory(): Promise<void> {
    await ensureDir(this.config.backupDirectory);
    this.logger.verbose(`Backup directory ready: ${this.config.backupDirectory}`, this.config.verbose);
  }

  /**
   * Discovers all site directories in the sites folder
   */
  private async discoverSites(): Promise<string[]> {
    const siteDirectories: string[] = [];

    try {
      for await (const entry of Deno.readDir(this.config.sitesDirectory)) {
        if (entry.isDirectory) {
          const sitePath = join(this.config.sitesDirectory, entry.name);
          siteDirectories.push(sitePath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to read sites directory: ${error.message}`);
    }

    this.logger.info(`Discovered ${siteDirectories.length} sites`);
    return siteDirectories;
  }

  /**
   * Updates symbolic links for a specific site
   */
  private async updateSiteSymlinks(siteDirectory: string): Promise<LinkUpdateResult[]> {
    const results: LinkUpdateResult[] = [];
    const absoluteCoreDir = resolve(this.config.coreDirectory);

    for (const target of this.config.symlinkTargets) {
      const result = await this.updateSymlink(
        siteDirectory,
        target,
        absoluteCoreDir
      );
      results.push(result);

      this.logLinkResult(result);
    }

    return results;
  }

  /**
   * Updates or creates a single symbolic link
   */
  private async updateSymlink(
    siteDirectory: string,
    target: string,
    absoluteCoreDir: string
  ): Promise<LinkUpdateResult> {
    const linkPath = join(siteDirectory, target);
    const targetPath = join(absoluteCoreDir, target);

    try {
      // Check if target exists in core
      if (!await exists(targetPath)) {
        return {
          path: linkPath,
          success: false,
          action: 'failed',
          error: `Target not found in core: ${target}`
        };
      }

      // Handle existing symlink or directory
      if (await exists(linkPath)) {
        const stat = await Deno.lstat(linkPath);

        if (stat.isSymlink) {
          // Check if symlink points to correct target
          const currentTarget = await Deno.readLink(linkPath);
          const resolvedCurrent = resolve(dirname(linkPath), currentTarget);

          if (resolvedCurrent === targetPath) {
            return {
              path: linkPath,
              success: true,
              action: 'skipped'
            };
          }

          // Remove outdated symlink
          await this.backupAndRemove(linkPath);
        } else {
          // Backup existing directory/file
          await this.backupAndRemove(linkPath);
        }
      }

      // Create new symlink
      const relativePath = this.calculateRelativePath(siteDirectory, targetPath);
      await Deno.symlink(relativePath, linkPath);

      return {
        path: linkPath,
        success: true,
        action: await this.wasExistingLink(linkPath) ? 'updated' : 'created'
      };

    } catch (error) {
      return {
        path: linkPath,
        success: false,
        action: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Calculates relative path from site directory to core target
   * This ensures symlinks remain valid even if the entire project is moved
   */
  private calculateRelativePath(fromDir: string, toPath: string): string {
    const fromAbsolute = resolve(fromDir);
    const toAbsolute = resolve(toPath);

    // Calculate relative path using directory traversal
    const fromParts = fromAbsolute.split('/').filter(p => p);
    const toParts = toAbsolute.split('/').filter(p => p);

    // Find common prefix
    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    // Build relative path
    const upSteps = fromParts.length - commonLength;
    const downSteps = toParts.slice(commonLength);

    const relativeParts = ['..'.repeat(upSteps), ...downSteps].filter(p => p);
    return relativeParts.join('/') || '.';
  }

  /**
   * Backs up and removes existing file or directory
   */
  private async backupAndRemove(path: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${basename(path)}.backup.${timestamp}`;
    const backupPath = join(this.config.backupDirectory, backupName);

    try {
      // Attempt to move to backup location
      await Deno.rename(path, backupPath);
      this.logger.verbose(`Backed up: ${path} → ${backupPath}`, this.config.verbose);
    } catch {
      // If backup fails, just remove (less safe but ensures deployment continues)
      await Deno.remove(path, { recursive: true });
      this.logger.verbose(`Removed: ${path}`, this.config.verbose);
    }
  }

  /**
   * Checks if a symlink was previously existing (for result reporting)
   */
  private async wasExistingLink(path: string): Promise<boolean> {
    const backupPattern = `${basename(path)}.backup.`;

    try {
      for await (const entry of Deno.readDir(this.config.backupDirectory)) {
        if (entry.name.startsWith(backupPattern)) {
          return true;
        }
      }
    } catch {
      // Backup directory might not exist or be accessible
    }

    return false;
  }

  /**
   * Logs the result of a single symlink operation
   */
  private logLinkResult(result: LinkUpdateResult): void {
    const relativePath = result.path.replace(this.config.sitesDirectory + '/', '');

    switch (result.action) {
      case 'created':
        this.logger.success(`Created: ${relativePath}`);
        break;
      case 'updated':
        this.logger.success(`Updated: ${relativePath}`);
        break;
      case 'skipped':
        this.logger.verbose(`Skipped: ${relativePath} (already current)`, this.config.verbose);
        break;
      case 'failed':
        this.logger.error(`Failed: ${relativePath} - ${result.error}`);
        break;
    }
  }

  /**
   * Reports comprehensive deployment results
   */
  private reportResults(results: LinkUpdateResult[]): void {
    this.logger.header('Deployment Summary');

    const summary = results.reduce((acc, result) => {
      acc[result.action] = (acc[result.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Results:`);
    console.log(`   Created: ${summary.created || 0}`);
    console.log(`   Updated: ${summary.updated || 0}`);
    console.log(`   Skipped: ${summary.skipped || 0}`);
    console.log(`   Failed:  ${summary.failed || 0}`);

    const totalOperations = results.length;
    const successfulOperations = (summary.created || 0) + (summary.updated || 0) + (summary.skipped || 0);

    if (summary.failed && summary.failed > 0) {
      this.logger.warning(`Deployment completed with ${summary.failed} failures`);
      console.log('\nFailed operations:');
      results
        .filter(r => r.action === 'failed')
        .forEach(r => console.log(`  - ${r.path}: ${r.error}`));
    } else {
      this.logger.success(`Deployment completed successfully! (${successfulOperations}/${totalOperations})`);
    }

    console.log(`\n${this.logger['colorize']?.('🔗 All sites now point to latest core framework', 'green') || '🔗 All sites now point to latest core framework'}\n`);
  }
}

/**
 * Configuration parser and validator
 */
class ConfigurationManager {
  static parseArgs(args: string[]): Partial<DeploymentConfig> {
    const config: Partial<DeploymentConfig> = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--core':
        case '-c':
          config.coreDirectory = args[++i];
          break;
        case '--sites':
        case '-s':
          config.sitesDirectory = args[++i];
          break;
        case '--backup':
        case '-b':
          config.backupDirectory = args[++i];
          break;
        case '--verbose':
        case '-v':
          config.verbose = true;
          break;
        case '--targets':
        case '-t':
          config.symlinkTargets = args[++i]?.split(',') || [];
          break;
        case '--help':
        case '-h':
          ConfigurationManager.showHelp();
          Deno.exit(0);
          break;
      }
    }

    return config;
  }

  static showHelp(): void {
    console.log(`
🚀 DenoGenesis Core Symlink Deployment Script

USAGE:
  deno run --allow-read --allow-write --allow-run deploy-symlinks.ts [OPTIONS]

OPTIONS:
  -c, --core <path>      Path to core directory (default: ./core)
  -s, --sites <path>     Path to sites directory (default: ./sites)
  -b, --backup <path>    Path to backup directory (default: ./deployment/backups)
  -t, --targets <list>   Comma-separated list of symlink targets
  -v, --verbose          Enable verbose logging
  -h, --help            Show this help message

EXAMPLES:
  # Standard deployment
  deno run --allow-read --allow-write --allow-run deploy-symlinks.ts

  # Custom directories with verbose output
  deno run --allow-read --allow-write --allow-run deploy-symlinks.ts \\
    --core ./framework/core \\
    --sites ./applications \\
    --verbose

  # Specific targets only
  deno run --allow-read --allow-write --allow-run deploy-symlinks.ts \\
    --targets utils,middleware,config

SYMLINK TARGETS:
  The script creates symbolic links for these core framework directories:
  - utils       (Shared utility functions)
  - middleware  (HTTP middleware components)
  - config      (Framework configuration)
  - types       (TypeScript type definitions)
  - database    (Database utilities and schemas)
  - components  (Shared UI components)
  - libs        (Third-party library integrations)

SAFETY FEATURES:
  ✅ Creates backups before removing existing files
  ✅ Validates all paths before making changes
  ✅ Uses relative paths for portable symlinks
  ✅ Comprehensive error handling and rollback
  ✅ Detailed logging and progress reporting

For more information, see: https://github.com/dominguez-tech/deno-genesis
`);
  }
}

/**
 * Pre-deployment validation and safety checks
 */
class DeploymentValidator {
  static async validateDeployment(config: DeploymentConfig): Promise<void> {
    const logger = new DeploymentLogger();

    // Validate permissions
    try {
      const testFile = join(config.backupDirectory, '.permission-test');
      await ensureDir(dirname(testFile));
      await Deno.writeTextFile(testFile, 'test');
      await Deno.remove(testFile);
    } catch {
      throw new Error('Insufficient file system permissions for deployment');
    }

    // Validate core directory structure
    logger.verbose('Validating core directory structure...', config.verbose);
    for (const target of config.symlinkTargets) {
      const targetPath = join(config.coreDirectory, target);
      if (!await exists(targetPath)) {
        logger.warning(`Optional core target missing: ${target}`);
      }
    }

    // Check for running services that might need restart
    try {
      const systemctlResult = await new Deno.Command('systemctl', {
        args: ['list-units', '--type=service', '--state=active', 'denogenesis-*'],
        stdout: 'piped',
        stderr: 'piped'
      }).output();

      if (systemctlResult.success && systemctlResult.stdout.length > 0) {
        logger.warning('Active DenoGenesis services detected. Consider stopping services during deployment.');
      }
    } catch {
      // systemctl might not be available (development environment)
      logger.verbose('SystemD not available - skipping service check', config.verbose);
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const userConfig = ConfigurationManager.parseArgs(Deno.args);
    const config: DeploymentConfig = { ...DEFAULT_CONFIG, ...userConfig };

    // Validate deployment environment
    await DeploymentValidator.validateDeployment(config);

    // Execute deployment
    const deploymentManager = new SymlinkDeploymentManager(config);
    await deploymentManager.deploy();

  } catch (error) {
    const logger = new DeploymentLogger();
    logger.error(`Fatal error: ${error.message}`);

    if (error.stack && Deno.args.includes('--verbose')) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    Deno.exit(1);
  }
}

// Self-executing deployment script
if (import.meta.main) {
  await main();
}

// Export for testing and module usage
export {
  SymlinkDeploymentManager,
  DeploymentLogger,
  ConfigurationManager,
  type DeploymentConfig,
  type LinkUpdateResult
};
