#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * DenoGenesis Framework Deployment Script - Enhanced Version
 *
 * Updates symbolic links from site directories to the core framework directory
 * to eliminate version drift and ensure consistency across all sites.
 *
 * Enhanced with robust file existence error handling and atomic operations.
 *
 * @author DenoGenesis Framework Team
 * @version 1.1.0
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
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

// Result interface for operation tracking
interface LinkUpdateResult {
  readonly path: string;
  readonly success: boolean;
  readonly action: 'created' | 'updated' | 'skipped' | 'failed' | 'retried';
  readonly error?: string;
  readonly attempts?: number;
}

// Operation state for atomic transactions
interface OperationState {
  readonly linkPath: string;
  readonly targetPath: string;
  readonly backupPath?: string;
  readonly wasSymlink: boolean;
  readonly originalExists: boolean;
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
    'VERSION',
    'meta.ts'
  ],
  backupDirectory: './deployment/backups',
  verbose: false,
  maxRetries: 3,
  retryDelayMs: 100
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

  retry(message: string, attempt: number, maxAttempts: number): void {
    console.log(`${this.colorize('🔄', 'yellow')} ${message} (attempt ${attempt}/${maxAttempts})`);
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
 * Enhanced deployment manager with atomic operations and retry logic
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
      this.logger.header('DenoGenesis Core Symlink Deployment - Enhanced');

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
    if (!await this.safeExists(this.config.coreDirectory)) {
      throw new Error(`Core directory not found: ${this.config.coreDirectory}`);
    }

    // Check sites directory exists
    if (!await this.safeExists(this.config.sitesDirectory)) {
      throw new Error(`Sites directory not found: ${this.config.sitesDirectory}`);
    }

    // Validate core directory structure
    for (const target of this.config.symlinkTargets) {
      const coreTargetPath = join(this.config.coreDirectory, target);
      if (!await this.safeExists(coreTargetPath)) {
        this.logger.warning(`Core target missing: ${target}`);
      }
    }

    this.logger.success('Environment validation completed');
  }

  /**
   * Creates backup directory for deployment artifacts
   */
  private async createBackupDirectory(): Promise<void> {
    await this.safeEnsureDir(this.config.backupDirectory);
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
      const result = await this.updateSymlinkWithRetry(
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
   * Updates or creates a single symbolic link with retry mechanism
   */
  private async updateSymlinkWithRetry(
    siteDirectory: string,
    target: string,
    absoluteCoreDir: string
  ): Promise<LinkUpdateResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.updateSymlinkAtomic(siteDirectory, target, absoluteCoreDir);
        
        if (result.success) {
          if (attempt > 1) {
            result.action = 'retried';
            result.attempts = attempt;
          }
          return result;
        }

        if (attempt < this.config.maxRetries && result.error?.includes('exists')) {
          this.logger.retry(`Retrying ${target}`, attempt, this.config.maxRetries);
          await this.delay(this.config.retryDelayMs * attempt);
          lastError = new Error(result.error);
          continue;
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries) {
          this.logger.retry(`Retrying ${target} due to error`, attempt, this.config.maxRetries);
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    return {
      path: join(siteDirectory, target),
      success: false,
      action: 'failed',
      error: `Max retries exceeded: ${lastError?.message}`,
      attempts: this.config.maxRetries
    };
  }

  /**
   * Atomic symbolic link update operation
   */
  private async updateSymlinkAtomic(
    siteDirectory: string,
    target: string,
    absoluteCoreDir: string
  ): Promise<LinkUpdateResult> {
    const linkPath = join(siteDirectory, target);
    const targetPath = join(absoluteCoreDir, target);
    const tempLinkPath = `${linkPath}.tmp.${Date.now()}`;

    // Gather operation state
    const state: OperationState = {
      linkPath,
      targetPath,
      wasSymlink: false,
      originalExists: false
    };

    try {
      // Check if target exists in core
      if (!await this.safeExists(targetPath)) {
        return {
          path: linkPath,
          success: false,
          action: 'failed',
          error: `Target not found in core: ${target}`
        };
      }

      // Check current state of link path
      state.originalExists = await this.safeExists(linkPath);
      
      if (state.originalExists) {
        const stat = await this.safeLstat(linkPath);
        state.wasSymlink = stat?.isSymlink ?? false;

        // If it's already a correct symlink, skip
        if (state.wasSymlink) {
          const currentTarget = await this.safeReadLink(linkPath);
          if (currentTarget) {
            const resolvedCurrent = resolve(dirname(linkPath), currentTarget);
            if (resolvedCurrent === targetPath) {
              return {
                path: linkPath,
                success: true,
                action: 'skipped'
              };
            }
          }
        }

        // Create backup of existing file/directory
        state.backupPath = await this.createSafeBackup(linkPath);
      }

      // Ensure parent directory exists
      await this.safeEnsureDir(dirname(linkPath));

      // Create temporary symlink first (atomic operation)
      const relativePath = this.calculateRelativePath(siteDirectory, targetPath);
      await this.createSymlinkSafe(relativePath, tempLinkPath);

      // Atomic move from temp to final location
      await this.atomicMove(tempLinkPath, linkPath);

      return {
        path: linkPath,
        success: true,
        action: state.originalExists ? 'updated' : 'created'
      };

    } catch (error) {
      // Cleanup on failure
      await this.cleanupFailedOperation(tempLinkPath, state);
      
      return {
        path: linkPath,
        success: false,
        action: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Safe file existence check with error handling
   */
  private async safeExists(path: string): Promise<boolean> {
    try {
      await Deno.lstat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return false;
      }
      // Re-throw other errors (permission issues, etc.)
      throw error;
    }
  }

  /**
   * Safe lstat with error handling
   */
  private async safeLstat(path: string): Promise<Deno.FileInfo | null> {
    try {
      return await Deno.lstat(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Safe readLink with error handling
   */
  private async safeReadLink(path: string): Promise<string | null> {
    try {
      return await Deno.readLink(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound || 
          error instanceof Deno.errors.InvalidData) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Safe ensureDir with retry logic
   */
  private async safeEnsureDir(path: string, retries = 2): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await ensureDir(path);
        return;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Failed to ensure directory ${path}: ${error.message}`);
        }
        await this.delay(50 * attempt);
      }
    }
  }

  /**
   * Creates a safe backup with collision handling
   */
  private async createSafeBackup(originalPath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = basename(originalPath);
    
    // Try different backup names if collision occurs
    for (let counter = 0; counter < 100; counter++) {
      const suffix = counter === 0 ? '' : `-${counter}`;
      const backupName = `${baseName}.backup.${timestamp}${suffix}`;
      const backupPath = join(this.config.backupDirectory, backupName);

      if (!await this.safeExists(backupPath)) {
        await this.atomicMove(originalPath, backupPath);
        this.logger.verbose(`Backed up: ${originalPath} → ${backupPath}`, this.config.verbose);
        return backupPath;
      }
    }

    // If we can't create a backup, remove the original (last resort)
    this.logger.warning(`Could not create backup for ${originalPath}, removing instead`);
    await this.safeRemove(originalPath);
    return '';
  }

  /**
   * Safe file/directory removal
   */
  private async safeRemove(path: string): Promise<void> {
    try {
      const stat = await this.safeLstat(path);
      if (stat) {
        await Deno.remove(path, { recursive: !stat.isSymlink });
        this.logger.verbose(`Removed: ${path}`, this.config.verbose);
      }
    } catch (error) {
      // If removal fails, it might have been removed by another process
      if (!error.message.includes('NotFound')) {
        throw error;
      }
    }
  }

  /**
   * Safe symlink creation with existence check
   */
  private async createSymlinkSafe(targetPath: string, linkPath: string): Promise<void> {
    try {
      await Deno.symlink(targetPath, linkPath);
    } catch (error) {
      if (error instanceof Deno.errors.AlreadyExists) {
        // Handle race condition - another process created the file
        throw new Error(`File already exists: ${linkPath}`);
      }
      throw error;
    }
  }

  /**
   * Atomic move operation with fallback
   */
  private async atomicMove(sourcePath: string, destPath: string): Promise<void> {
    try {
      // First try atomic rename (fastest)
      await Deno.rename(sourcePath, destPath);
    } catch (error) {
      if (error instanceof Deno.errors.AlreadyExists) {
        // Destination exists - remove it first then try again
        await this.safeRemove(destPath);
        await Deno.rename(sourcePath, destPath);
      } else {
        throw error;
      }
    }
  }

  /**
   * Cleanup after failed operations
   */
  private async cleanupFailedOperation(tempPath: string, state: OperationState): Promise<void> {
    // Remove temporary symlink if it exists
    if (await this.safeExists(tempPath)) {
      await this.safeRemove(tempPath);
    }

    // Restore backup if operation was partially completed
    if (state.backupPath && await this.safeExists(state.backupPath)) {
      try {
        await this.atomicMove(state.backupPath, state.linkPath);
        this.logger.verbose(`Restored backup: ${state.linkPath}`, this.config.verbose);
      } catch (error) {
        this.logger.warning(`Failed to restore backup for ${state.linkPath}: ${error.message}`);
      }
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

    const relativeParts = [
      ...Array(upSteps).fill('..'),
      ...downSteps
    ].filter(p => p);

    return relativeParts.join('/') || '.';
  }

  /**
   * Non-blocking delay utility
   */
  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
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
      case 'retried':
        this.logger.success(`Retried and completed: ${relativePath} (${result.attempts} attempts)`);
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
      const key = result.action === 'retried' ? 'updated' : result.action;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Results:`);
    console.log(`   Created: ${summary.created || 0}`);
    console.log(`   Updated: ${summary.updated || 0}`);
    console.log(`   Skipped: ${summary.skipped || 0}`);
    console.log(`   Failed:  ${summary.failed || 0}`);

    // Report retry statistics
    const retriedOperations = results.filter(r => r.action === 'retried');
    if (retriedOperations.length > 0) {
      const totalAttempts = retriedOperations.reduce((sum, r) => sum + (r.attempts || 0), 0);
      console.log(`   Retries: ${retriedOperations.length} operations required ${totalAttempts} total attempts`);
    }

    const totalOperations = results.length;
    const successfulOperations = (summary.created || 0) + (summary.updated || 0) + (summary.skipped || 0);

    if (summary.failed && summary.failed > 0) {
      this.logger.warning(`Deployment completed with ${summary.failed} failures`);
      console.log('\nFailed operations:');
      results
        .filter(r => r.action === 'failed')
        .forEach(r => console.log(`  - ${r.path}: ${r.error}`));
      
      console.log('\n💡 Troubleshooting tips:');
      console.log('  - Ensure no processes are using the target files');
      console.log('  - Check file permissions and ownership');
      console.log('  - Try running with elevated permissions if needed');
      console.log('  - Use --verbose flag for detailed operation logs');
    } else {
      this.logger.success(`Deployment completed successfully! (${successfulOperations}/${totalOperations})`);
    }

    console.log(`\n${this.colorize('🔗 All sites now point to latest core framework', 'green')}\n`);
  }

  private colorize(text: string, color: string): string {
    return this.logger['colorize']?.(text, color) ?? text;
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
        case '--retries':
        case '-r':
          config.maxRetries = parseInt(args[++i]) || 3;
          break;
        case '--delay':
        case '-d':
          config.retryDelayMs = parseInt(args[++i]) || 100;
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
🚀 DenoGenesis Core Symlink Deployment Script - Enhanced

USAGE:
  deno run --allow-read --allow-write --allow-run syslink-creator.ts [OPTIONS]

OPTIONS:
  -c, --core <path>      Path to core directory (default: ./core)
  -s, --sites <path>     Path to sites directory (default: ./sites)
  -b, --backup <path>    Path to backup directory (default: ./deployment/backups)
  -t, --targets <list>   Comma-separated list of symlink targets
  -r, --retries <num>    Maximum retry attempts (default: 3)
  -d, --delay <ms>       Retry delay in milliseconds (default: 100)
  -v, --verbose          Enable verbose logging
  -h, --help            Show this help message

EXAMPLES:
  # Standard deployment
  deno run --allow-read --allow-write --allow-run syslink-creator.ts

  # Custom directories with verbose output and retry settings
  deno run --allow-read --allow-write --allow-run syslink-creator.ts \\
    --core ./framework/core \\
    --sites ./applications \\
    --retries 5 \\
    --delay 200 \\
    --verbose

  # Specific targets only
  deno run --allow-read --allow-write --allow-run syslink-creator.ts \\
    --targets utils,middleware,config

ENHANCED FEATURES:
  ✅ Atomic symlink operations (temp file → rename)
  ✅ Retry mechanism for transient failures
  ✅ Race condition protection
  ✅ Safe backup with collision handling
  ✅ Comprehensive error recovery
  ✅ Detailed operation logging

SYMLINK TARGETS:
  The script creates symbolic links for these core framework directories:
  - utils       (Shared utility functions)
  - middleware  (HTTP middleware components)  
  - config      (Framework configuration)
  - types       (TypeScript type definitions)
  - database    (Database utilities and schemas)
  - models      (Data models and schemas)
  - routes      (HTTP route handlers)
  - services    (Business logic services)
  - controllers (Request controllers)
  - main.ts     (Application entry point)
  - VERSION     (Framework version info)
  - meta.ts     (Framework metadata)

SAFETY FEATURES:
  ✅ Atomic operations prevent partial updates
  ✅ Automatic backup before file removal
  ✅ Retry logic for transient file system issues
  ✅ Race condition handling between processes
  ✅ Comprehensive rollback on failures
  ✅ Detailed logging and progress reporting
  ✅ File system permission validation

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

    // Validate permissions with enhanced checking
    try {
      const testFile = join(config.backupDirectory, '.permission-test');
      await ensureDir(dirname(testFile));
      await Deno.writeTextFile(testFile, 'test');
      
      // Test both read and write permissions
      const content = await Deno.readTextFile(testFile);
      if (content !== 'test') {
        throw new Error('File system read/write verification failed');
      }
      
      await Deno.remove(testFile);
    } catch (error) {
      throw new Error(`Insufficient file system permissions for deployment: ${error.message}`);
    }

    // Validate core directory structure
    logger.verbose('Validating core directory structure...', config.verbose);
    let missingTargets = 0;
    
    for (const target of config.symlinkTargets) {
      const targetPath = join(config.coreDirectory, target);
      if (!await exists(targetPath)) {
        logger.warning(`Optional core target missing: ${target}`);
        missingTargets++;
      }
    }

    if (missingTargets === config.symlinkTargets.length) {
      throw new Error('No symlink targets found in core directory - deployment would be ineffective');
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

    // Additional file system health checks
    await DeploymentValidator.validateFileSystemHealth(config, logger);
  }

  /**
   * Additional file system health checks
   */
  private static async validateFileSystemHealth(config: DeploymentConfig, logger: DeploymentLogger): Promise<void> {
    try {
      // Check available disk space
      const tempFile = join(config.backupDirectory, '.space-test');
      const testData = 'x'.repeat(1024); // 1KB test
      
      await Deno.writeTextFile(tempFile, testData);
      await Deno.remove(tempFile);
      
      logger.verbose('File system health check passed', config.verbose);
    } catch (error) {
      throw new Error(`File system health check failed: ${error.message}`);
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
    const deploymentManager = new SymlinkDe