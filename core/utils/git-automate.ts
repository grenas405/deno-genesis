#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env

/**
 * DenoGenesis Git Automation Script
 * 
 * Automates the git workflow for the deno-genesis project:
 * - Stages all changes
 * - Creates commits with standardized messages
 * - Pushes to remote repository
 * - Handles error scenarios gracefully
 * 
 * @author DenoGenesis Framework Team
 * @version 1.0.0
 * @requires Deno 1.40+
 */

import { resolve } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";

interface GitConfig {
  readonly projectRoot: string;
  readonly defaultCommitMessage: string;
  readonly remoteBranch: string;
  readonly verbose: boolean;
}

interface GitOperationResult {
  readonly success: boolean;
  readonly command: string;
  readonly output?: string;
  readonly error?: string;
}

/**
 * Enhanced logger for colored terminal output
 */
class Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(this.colorize(`ℹ️  ${message}`, 'blue'));
  }

  success(message: string): void {
    console.log(this.colorize(`✅ ${message}`, 'green'));
  }

  warning(message: string): void {
    console.log(this.colorize(`⚠️  ${message}`, 'yellow'));
  }

  error(message: string): void {
    console.log(this.colorize(`❌ ${message}`, 'red'));
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(this.colorize(`🔍 ${message}`, 'gray'));
    }
  }

  private colorize(text: string, color: string): string {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[37m',
      reset: '\x1b[0m'
    };

    return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
  }
}

/**
 * Git operations manager with enhanced error handling
 */
class GitAutomator {
  private config: GitConfig;
  private logger: Logger;

  constructor(config: GitConfig) {
    this.config = config;
    this.logger = new Logger(config.verbose);
  }

  /**
   * Execute a git command with proper error handling
   */
  private async executeGitCommand(
    command: string[], 
    description: string
  ): Promise<GitOperationResult> {
    this.logger.debug(`Executing: git ${command.join(' ')}`);

    try {
      const process = new Deno.Command('git', {
        args: command,
        cwd: this.config.projectRoot,
        stdout: 'piped',
        stderr: 'piped'
      });

      const result = await process.output();
      const output = new TextDecoder().decode(result.stdout);
      const error = new TextDecoder().decode(result.stderr);

      if (result.success) {
        this.logger.debug(`✓ ${description} completed`);
        return {
          success: true,
          command: `git ${command.join(' ')}`,
          output: output.trim()
        };
      } else {
        this.logger.debug(`✗ ${description} failed with exit code: ${result.code}`);
        this.logger.debug(`stdout: ${output}`);
        this.logger.debug(`stderr: ${error}`);
        
        return {
          success: false,
          command: `git ${command.join(' ')}`,
          error: error.trim() || output.trim() || `Command failed with exit code ${result.code}`
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      this.logger.debug(`Exception during git command: ${errorMessage}`);
      
      return {
        success: false,
        command: `git ${command.join(' ')}`,
        error: errorMessage
      };
    }
  }

  /**
   * Check git configuration (user.name and user.email)
   */
  private async validateGitConfig(): Promise<boolean> {
    this.logger.debug('Validating git configuration...');
    
    const nameResult = await this.executeGitCommand(['config', 'user.name'], 'Check user.name');
    const emailResult = await this.executeGitCommand(['config', 'user.email'], 'Check user.email');
    
    if (!nameResult.success || !nameResult.output) {
      this.logger.error('Git user.name is not configured');
      this.logger.warning('Please run: git config --global user.name "Your Name"');
      return false;
    }
    
    if (!emailResult.success || !emailResult.output) {
      this.logger.error('Git user.email is not configured');
      this.logger.warning('Please run: git config --global user.email "your.email@example.com"');
      return false;
    }
    
    this.logger.debug(`✓ Git configured for user: ${nameResult.output} <${emailResult.output}>`);
    return true;
  }
  private async validateGitRepository(): Promise<boolean> {
    const gitDir = resolve(this.config.projectRoot, '.git');
    const isGitRepo = await exists(gitDir);
    
    if (!isGitRepo) {
      this.logger.error('Not a git repository! Please run this script from within a git project.');
      return false;
    }

    this.logger.debug('✓ Git repository validated');
    return true;
  }

  /**
   * Check git status and show current state
   */
  async checkStatus(): Promise<GitOperationResult> {
    this.logger.info('Checking git status...');
    
    const result = await this.executeGitCommand(['status', '--porcelain'], 'Status check');
    
    if (result.success) {
      const changes = result.output?.split('\n').filter(line => line.trim()) || [];
      
      if (changes.length === 0) {
        this.logger.warning('No changes detected in repository');
        return { success: true, command: 'git status' };
      }

      this.logger.info(`Found ${changes.length} change(s):`);
      changes.forEach(change => {
        this.logger.debug(`  ${change}`);
      });
    }

    return result;
  }

  /**
   * Stage all changes
   */
  async stageAllChanges(): Promise<GitOperationResult> {
    this.logger.info('Staging all changes...');
    return await this.executeGitCommand(['add', '.'], 'Stage all changes');
  }

  /**
   * Create commit with message
   */
  async createCommit(message: string): Promise<GitOperationResult> {
    this.logger.info(`Creating commit: "${message}"`);
    
    // First check if there are staged changes to commit
    const stagedResult = await this.executeGitCommand(['diff', '--cached', '--quiet'], 'Check staged changes');
    
    if (stagedResult.success) {
      this.logger.warning('No staged changes found - nothing to commit');
      return { 
        success: true, 
        command: 'git commit', 
        output: 'No changes to commit' 
      };
    }

    const result = await this.executeGitCommand(['commit', '-m', message], 'Create commit');
    
    // Provide more detailed error information
    if (!result.success && result.error) {
      this.logger.error(`Commit failed with detailed error: ${result.error}`);
      
      // Common git commit issues and suggestions
      if (result.error.includes('Please tell me who you are')) {
        this.logger.warning('Git user configuration missing. Run:');
        this.logger.warning('  git config --global user.name "Your Name"');
        this.logger.warning('  git config --global user.email "your.email@example.com"');
      } else if (result.error.includes('nothing to commit')) {
        this.logger.warning('No changes staged for commit');
      }
    }
    
    return result;
  }

  /**
   * Push changes to remote
   */
  async pushToRemote(): Promise<GitOperationResult> {
    this.logger.info(`Pushing to ${this.config.remoteBranch}...`);
    return await this.executeGitCommand(['push', 'origin', this.config.remoteBranch], 'Push to remote');
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const result = await this.executeGitCommand(['branch', '--show-current'], 'Get current branch');
    return result.success ? (result.output || 'main') : 'main';
  }

  /**
   * Main automation workflow
   */
  async automateGitWorkflow(commitMessage?: string): Promise<boolean> {
    this.logger.info('🚀 Starting DenoGenesis Git Automation...\n');

    // Validate git repository
    if (!(await this.validateGitRepository())) {
      return false;
    }

    // Validate git configuration
    if (!(await this.validateGitConfig())) {
      return false;
    }

    // Get current branch for push operation
    const currentBranch = await this.getCurrentBranch();
    this.config = { ...this.config, remoteBranch: currentBranch };

    const operations = [
      { name: 'Status Check', action: () => this.checkStatus(), critical: false },
      { name: 'Stage Changes', action: () => this.stageAllChanges(), critical: true },
      { name: 'Create Commit', action: () => this.createCommit(commitMessage || this.config.defaultCommitMessage), critical: true },
      { name: 'Push to Remote', action: () => this.pushToRemote(), critical: true }
    ];

    let allSuccessful = true;

    for (const operation of operations) {
      this.logger.debug(`\n--- ${operation.name} ---`);
      
      const result = await operation.action();
      
      if (result.success) {
        this.logger.success(`${operation.name} completed successfully`);
        if (result.output) {
          this.logger.debug(`Output: ${result.output}`);
        }
      } else {
        this.logger.error(`${operation.name} failed: ${result.error}`);
        
        if (operation.critical) {
          allSuccessful = false;
          break; // Stop on critical failures
        }
      }
    }

    if (allSuccessful) {
      this.logger.success('\n🎉 Git automation completed successfully!');
      this.logger.info('All changes have been committed and pushed to remote repository.\n');
    } else {
      this.logger.error('\n💥 Git automation encountered errors.');
      this.logger.warning('Please review the output above and resolve any issues manually.\n');
    }

    return allSuccessful;
  }
}

/**
 * Configuration parser
 */
class ConfigManager {
  static parseArgs(args: string[]): Partial<GitConfig> {
    const config: Partial<GitConfig> = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--root':
        case '-r':
          config.projectRoot = args[++i];
          break;
        case '--message':
        case '-m':
          config.defaultCommitMessage = args[++i];
          break;
        case '--branch':
        case '-b':
          config.remoteBranch = args[++i];
          break;
        case '--verbose':
        case '-v':
          config.verbose = true;
          break;
        case '--help':
        case '-h':
          ConfigManager.showHelp();
          Deno.exit(0);
          break;
      }
    }

    return config;
  }

  static showHelp(): void {
    console.log(`
🚀 DenoGenesis Git Automation Script

USAGE:
  deno run --allow-run --allow-read --allow-write --allow-env git-automate.ts [OPTIONS]

OPTIONS:
  -r, --root <path>        Project root directory (default: current directory)
  -m, --message <msg>      Commit message (default: "one person, one paradigm shift")
  -b, --branch <name>      Remote branch to push to (default: current branch)
  -v, --verbose            Enable verbose logging
  -h, --help               Show this help message

EXAMPLES:
  # Basic usage (like your terminal session)
  deno run --allow-run --allow-read --allow-write --allow-env git-automate.ts

  # Custom commit message
  deno run --allow-run --allow-read --allow-write --allow-env git-automate.ts -m "feat: add new deployment config"

  # Verbose output for debugging
  deno run --allow-run --allow-read --allow-write --allow-env git-automate.ts -v

  # Specific project directory
  deno run --allow-run --allow-read --allow-write --allow-env git-automate.ts -r /path/to/project

PERMISSIONS REQUIRED:
  --allow-run    : Execute git commands
  --allow-read   : Read project files and .git directory
  --allow-write  : Write git objects and references
  --allow-env    : Access environment variables for git configuration

This script replicates the workflow shown in your terminal:
  1. git add .
  2. git commit -m "one person, one paradigm shift"
  3. git push origin main
`);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = Deno.args;
  const userConfig = ConfigManager.parseArgs(args);

  // Default configuration
  const defaultConfig: GitConfig = {
    projectRoot: Deno.cwd(),
    defaultCommitMessage: "one person, one paradigm",
    remoteBranch: "main",
    verbose: false
  };

  // Merge user config with defaults
  const config: GitConfig = { ...defaultConfig, ...userConfig };

  // Custom commit message from remaining args (if not provided via -m)
  const remainingArgs = args.filter(arg => !arg.startsWith('-') && 
    !['--root', '--message', '--branch', '--verbose', '--help'].includes(args[args.indexOf(arg) - 1])
  );

  const customMessage = remainingArgs.join(' ').trim();
  if (customMessage && !userConfig.defaultCommitMessage) {
    config.defaultCommitMessage = customMessage;
  }

  // Create and run automator
  const automator = new GitAutomator(config);
  const success = await automator.automateGitWorkflow();

  // Exit with appropriate code
  Deno.exit(success ? 0 : 1);
}

// Execute if run directly
if (import.meta.main) {
  await main();
}
