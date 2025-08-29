#!/usr/bin/env -S deno run --allow-read --allow-write

import { resolve, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { exists, ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";

interface SymlinkConfig {
  coreDirectory: string;
  targetDirectory: string;
  items?: string[]; // Specific files/folders to link, if empty links all
  force?: boolean; // Overwrite existing symlinks
  recursive?: boolean; // Create symlinks for subdirectories
}

class DenoSymlinkManager {
  private config: SymlinkConfig;

  constructor(config: SymlinkConfig) {
    this.config = config;
  }

  /**
   * Create symbolic links based on configuration
   */
  async createSymlinks(): Promise<void> {
    try {
      // Validate core directory exists
      await this.validateCoreDirectory();

      // Ensure target directory exists
      await this.ensureTargetDirectory();

      // Get items to link
      const itemsToLink = await this.getItemsToLink();

      console.log(`Creating ${itemsToLink.length} symbolic links...`);

      // Create symlinks for each item
      for (const item of itemsToLink) {
        await this.createSymlink(item);
      }

      console.log('✅ All symbolic links created successfully!');
    } catch (error) {
      console.error('❌ Error creating symbolic links:', error);
      Deno.exit(1);
    }
  }

  /**
   * Validate that the core directory exists
   */
  private async validateCoreDirectory(): Promise<void> {
    const coreExists = await exists(this.config.coreDirectory);
    if (!coreExists) {
      throw new Error(`Core directory does not exist: ${this.config.coreDirectory}`);
    }

    const coreInfo = await Deno.stat(this.config.coreDirectory);
    if (!coreInfo.isDirectory) {
      throw new Error(`Core path is not a directory: ${this.config.coreDirectory}`);
    }

    console.log(`📁 Core directory found: ${this.config.coreDirectory}`);
  }

  /**
   * Ensure target directory exists, create if necessary
   */
  private async ensureTargetDirectory(): Promise<void> {
    const targetExists = await exists(this.config.targetDirectory);

    if (!targetExists) {
      console.log(`📁 Creating target directory: ${this.config.targetDirectory}`);
      await ensureDir(this.config.targetDirectory);
    } else {
      console.log(`📁 Target directory found: ${this.config.targetDirectory}`);
    }
  }

  /**
   * Get list of items to create symlinks for
   */
  private async getItemsToLink(): Promise<string[]> {
    if (this.config.items && this.config.items.length > 0) {
      // Use specified items
      return this.config.items;
    } else {
      // Get all items from core directory
      const items: string[] = [];

      for await (const dirEntry of Deno.readDir(this.config.coreDirectory)) {
        if (this.config.recursive || dirEntry.isFile) {
          items.push(dirEntry.name);
        }
      }

      return items;
    }
  }

  /**
   * Create a symbolic link for a specific item
   */
  private async createSymlink(item: string): Promise<void> {
    const sourcePath = resolve(this.config.coreDirectory, item);
    const targetPath = resolve(this.config.targetDirectory, item);

    try {
      // Check if source exists
      const sourceExists = await exists(sourcePath);
      if (!sourceExists) {
        throw new Error(`Source does not exist: ${sourcePath}`);
      }

      // Check if target already exists
      const targetExists = await exists(targetPath);

      if (targetExists) {
        if (this.config.force) {
          console.log(`🔄 Removing existing: ${targetPath}`);
          await this.removeIfSymlink(targetPath);
        } else {
          console.log(`⚠️  Skipping existing: ${targetPath}`);
          return;
        }
      }

      // Create the symlink
      await Deno.symlink(sourcePath, targetPath);
      console.log(`🔗 Created symlink: ${targetPath} -> ${sourcePath}`);

    } catch (error) {
      console.error(`❌ Failed to create symlink for ${item}:`, error);
      throw error;
    }
  }

  /**
   * Remove a file/symlink if it exists and is a symlink
   */
  private async removeIfSymlink(path: string): Promise<void> {
    try {
      const stat = await Deno.lstat(path);
      if (stat.isSymlink) {
        await Deno.remove(path);
      } else {
        console.log(`⚠️  Path exists but is not a symlink: ${path}`);
      }
    } catch (error) {
      // File doesn't exist or can't be accessed, which is fine
      console.log(`⚠️  Could not remove path: ${path}`);
    }
  }

  /**
   * Remove all symlinks created by this script
   */
  async removeSymlinks(): Promise<void> {
    try {
      const itemsToRemove = await this.getItemsToLink();

      console.log(`Removing ${itemsToRemove.length} symbolic links...`);

      for (const item of itemsToRemove) {
        const targetPath = resolve(this.config.targetDirectory, item);

        try {
          const targetExists = await exists(targetPath);
          if (targetExists) {
            const stat = await Deno.lstat(targetPath);
            if (stat.isSymlink) {
              await Deno.remove(targetPath);
              console.log(`🗑️  Removed symlink: ${targetPath}`);
            } else {
              console.log(`⚠️  Path exists but is not a symlink: ${targetPath}`);
            }
          } else {
            console.log(`⚠️  Symlink not found: ${targetPath}`);
          }
        } catch (error) {
          console.log(`⚠️  Could not process: ${targetPath}`, error.message);
        }
      }

      console.log('✅ All symbolic links removed successfully!');
    } catch (error) {
      console.error('❌ Error removing symbolic links:', error);
      Deno.exit(1);
    }
  }
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
Deno Symbolic Link Creator

Usage: deno run --allow-read --allow-write symlink-creator.ts <core-directory> <target-directory> [options]

Arguments:
  core-directory    Path to the core directory containing files to link
  target-directory  Path where symbolic links will be created

Options:
  --items item1,item2,item3  Specific items to link (comma-separated)
  --force                    Overwrite existing symlinks
  --recursive                Include subdirectories
  --remove                   Remove existing symlinks instead of creating
  --help                     Show this help message

Examples:
  deno run --allow-read --allow-write symlink-creator.ts ./core ./project/core
  deno run --allow-read --allow-write symlink-creator.ts ./core ./project/core --force --recursive
  deno run --allow-read --allow-write symlink-creator.ts ./core ./project/core --items config.json,utils.ts
  deno run --allow-read --allow-write symlink-creator.ts ./core ./project/core --remove

Required Permissions:
  --allow-read   Read access to source and target directories
  --allow-write  Write access to create/remove symbolic links
`);
}

/**
 * Main function to handle command line arguments and execute script
 */
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["force", "recursive", "remove", "help"],
    string: ["items"],
    alias: { h: "help" }
  });

  if (args.help || args._.length < 2) {
    showHelp();
    Deno.exit(args.help ? 0 : 1);
  }

  const coreDirectory = args._[0] as string;
  const targetDirectory = args._[1] as string;

  // Build configuration
  const config: SymlinkConfig = {
    coreDirectory: resolve(coreDirectory),
    targetDirectory: resolve(targetDirectory),
    force: args.force,
    recursive: args.recursive
  };

  // Parse items if specified
  if (args.items) {
    config.items = args.items.split(',').map(item => item.trim());
  }

  const symlinkManager = new DenoSymlinkManager(config);

  if (args.remove) {
    await symlinkManager.removeSymlinks();
  } else {
    await symlinkManager.createSymlinks();
  }
}

// Execute main function if script is run directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    Deno.exit(1);
  });
}

export { DenoSymlinkManager, type SymlinkConfig };
