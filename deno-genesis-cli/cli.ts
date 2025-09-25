#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-env

/**
 * Deno Genesis CLI Tool
 * 
 * Unix Philosophy Implementation:
 * - Do one thing well: Orchestrate Genesis framework operations
 * - Accept text input: Commands, configuration files, environment variables
 * - Produce text output: Structured logging, JSON output, status reports
 * - Filter and transform: Take user intent → execute framework operations
 * - Composable: Each subcommand can be piped, scripted, automated
 * 
 * Security-First Composition:
 * - Explicit permissions for each operation
 * - No hidden access rights
 * - Auditable command execution
 * 
 * Zero-Configuration Complexity:
 * - No build steps required
 * - Direct TypeScript execution
 * - Sensible defaults everywhere
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { join, dirname } from "https://deno.land/std@0.224.0/path/mod.ts";

// Import subcommand modules following Unix principle of modularity
import { initCommand } from "./commands/init.ts";
import { newCommand } from "./commands/new.ts";
import { devCommand } from "./commands/dev.ts";
import { deployCommand } from "./commands/deploy.ts";
import { dbCommand } from "./commands/db.ts";
import { envCommand } from "./commands/env.ts";
import { statusCommand } from "./commands/status.ts";
import { aiCommand } from "./commands/ai.ts";
import { securityCommand } from "./commands/security.ts";
import { updateCommand } from "./commands/update.ts";

// Types for better developer experience and AI collaboration
interface CLIContext {
  cwd: string;
  configPath: string;
  verbose: boolean;
  dryRun: boolean;
  format: 'text' | 'json' | 'yaml';
}

interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[], context: CLIContext) => Promise<number>;
  permissions: string[];
}

// Command registry - following Unix principle of modularity
const COMMANDS: Record<string, CommandDefinition> = {
  init: {
    name: "init",
    description: "Initialize new Genesis project with hub-and-spoke architecture",
    usage: "genesis init [project-name] [--template=basic|full|enterprise]",
    examples: [
      "genesis init my-project",
      "genesis init enterprise-app --template=enterprise",
      "genesis init . --template=basic"
    ],
    handler: initCommand,
    permissions: ["--allow-read", "--allow-write", "--allow-net"]
  },
  
  new: {
    name: "new",
    description: "Create new site in existing Genesis hub-and-spoke project",
    usage: "genesis new [site-name] [--template=api|webapp|static]",
    examples: [
      "genesis new api-service --template=api",
      "genesis new marketing-site --template=static",
      "genesis new admin-dashboard --template=webapp"
    ],
    handler: newCommand,
    permissions: ["--allow-read", "--allow-write"]
  },

  dev: {
    name: "dev",
    description: "Start development server with hot reload",
    usage: "genesis dev [site-name] [--port=3000] [--watch]",
    examples: [
      "genesis dev",
      "genesis dev api-service --port=8080",
      "genesis dev frontend --watch"
    ],
    handler: devCommand,
    permissions: ["--allow-read", "--allow-net", "--allow-run", "--allow-env"]
  },

  deploy: {
    name: "deploy",
    description: "Deploy to staging or production environment",
    usage: "genesis deploy [environment] [--site=all|site-name] [--dry-run]",
    examples: [
      "genesis deploy staging",
      "genesis deploy production --site=api-service",
      "genesis deploy staging --dry-run"
    ],
    handler: deployCommand,
    permissions: ["--allow-read", "--allow-write", "--allow-run", "--allow-net", "--allow-env"]
  },

  db: {
    name: "db",
    description: "Database operations for multi-tenant architecture",
    usage: "genesis db <setup|migrate|seed|backup|restore> [options]",
    examples: [
      "genesis db setup",
      "genesis db migrate site1",
      "genesis db backup --all",
      "genesis db restore backup-2024-01-15.sql"
    ],
    handler: dbCommand,
    permissions: ["--allow-read", "--allow-write", "--allow-run", "--allow-net"]
  },

  env: {
    name: "env",
    description: "Environment configuration management",
    usage: "genesis env <setup|validate|sync> [--environment=dev|staging|prod]",
    examples: [
      "genesis env setup",
      "genesis env validate --environment=production",
      "genesis env sync"
    ],
    handler: envCommand,
    permissions: ["--allow-read", "--allow-write", "--allow-env"]
  },

  status: {
    name: "status",
    description: "Show status of all services and sites",
    usage: "genesis status [--format=text|json] [--site=site-name]",
    examples: [
      "genesis status",
      "genesis status --format=json",
      "genesis status --site=api-service"
    ],
    handler: statusCommand,
    permissions: ["--allow-read", "--allow-run", "--allow-net"]
  },

  ai: {
    name: "ai",
    description: "AI-augmented development operations",
    usage: "genesis ai <generate|review|docs|migrate> [options]",
    examples: [
      "genesis ai generate component Button",
      "genesis ai review src/components/",
      "genesis ai docs src/api/",
      "genesis ai migrate v1.0 v2.0"
    ],
    handler: aiCommand,
    permissions: ["--allow-read", "--allow-write", "--allow-net"]
  },

  security: {
    name: "security",
    description: "Security analysis and permission auditing",
    usage: "genesis security <audit|scan|certs> [options]",
    examples: [
      "genesis security audit",
      "genesis security scan --deep",
      "genesis security certs setup"
    ],
    handler: securityCommand,
    permissions: ["--allow-read", "--allow-run", "--allow-net"]
  },

  update: {
    name: "update",
    description: "Update framework core and sync all sites",
    usage: "genesis update [--check-only] [--backup]",
    examples: [
      "genesis update",
      "genesis update --check-only",
      "genesis update --backup"
    ],
    handler: updateCommand,
    permissions: ["--allow-read", "--allow-write", "--allow-run", "--allow-net"]
  }
};

// Utility functions following Unix principles
function showHelp(command?: string): void {
  if (command && COMMANDS[command]) {
    const cmd = COMMANDS[command];
    console.log(`\n${cmd.name} - ${cmd.description}\n`);
    console.log(`Usage: ${cmd.usage}\n`);
    console.log("Examples:");
    cmd.examples.forEach(example => console.log(`  ${example}`));
    console.log(`\nRequired permissions: ${cmd.permissions.join(" ")}\n`);
    return;
  }

  console.log(`
🚀 Deno Genesis CLI - Unix Philosophy + Modern Runtime = Revolutionary Development

USAGE:
  genesis <command> [options]

CORE COMMANDS:
  init       Initialize new Genesis project
  new        Create new site in hub-and-spoke architecture
  dev        Start development server with hot reload
  deploy     Deploy to staging or production

DATABASE:
  db         Database operations (setup, migrate, backup, restore)

ENVIRONMENT:
  env        Environment configuration management
  status     Show status of all services and sites

AI-AUGMENTED:
  ai         AI-powered development operations
  security   Security analysis and auditing
  update     Update framework and sync sites

OPTIONS:
  --help, -h     Show this help message
  --version, -v  Show version information
  --verbose      Enable verbose output
  --dry-run      Show what would be done without executing
  --format       Output format: text, json, yaml

EXAMPLES:
  genesis init my-project
  genesis new api-service --template=api
  genesis dev --port=8080
  genesis deploy production --site=api-service
  genesis db backup --all
  genesis ai generate component UserCard

For detailed help on any command:
  genesis help <command>

🔒 SECURITY: All operations use explicit Deno permissions
📖 DOCS: https://github.com/grenas405/deno-genesis/docs
💬 SUPPORT: https://github.com/grenas405/deno-genesis/issues
`);
}

function showVersion(): void {
  console.log(`
Deno Genesis Framework v2.0.0
Runtime: Deno ${Deno.version.deno}
TypeScript: ${Deno.version.typescript}
V8: ${Deno.version.v8}

Built with Unix Philosophy principles:
- Do one thing well ✓
- Composable by design ✓  
- Text-based configuration ✓
- Explicit security ✓
- Zero-configuration complexity ✓
`);
}

async function detectGenesisProject(): Promise<string | null> {
  let currentDir = Deno.cwd();
  
  while (currentDir !== dirname(currentDir)) {
    const configPath = join(currentDir, "genesis.config.ts");
    if (await exists(configPath)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }
  
  return null;
}

async function createCLIContext(args: ReturnType<typeof parseArgs>): Promise<CLIContext> {
  const projectRoot = await detectGenesisProject();
  const cwd = projectRoot || Deno.cwd();
  
  return {
    cwd,
    configPath: join(cwd, "genesis.config.ts"),
    verbose: Boolean(args.verbose),
    dryRun: Boolean(args["dry-run"]),
    format: (args.format as 'text' | 'json' | 'yaml') || 'text'
  };
}

// Main CLI entry point
async function main(): Promise<number> {
  const args = parseArgs(Deno.args, {
    boolean: ["help", "version", "verbose", "dry-run"],
    string: ["format"],
    alias: { h: "help", v: "version" },
    unknown: (arg: string) => {
      if (arg.startsWith("-")) {
        console.error(`❌ Unknown option: ${arg}`);
        return false;
      }
      return true;
    }
  });

  // Handle global flags
  if (args.help) {
    const command = args._[0] as string;
    showHelp(command);
    return 0;
  }

  if (args.version) {
    showVersion();
    return 0;
  }

  // Extract command and remaining arguments
  const command = args._[0] as string;
  const commandArgs = args._.slice(1) as string[];

  if (!command) {
    showHelp();
    return 1;
  }

  // Handle special help case
  if (command === "help") {
    const helpCommand = commandArgs[0];
    showHelp(helpCommand);
    return 0;
  }

  // Validate command exists
  if (!COMMANDS[command]) {
    console.error(`❌ Unknown command: ${command}`);
    console.error(`Run 'genesis help' for available commands.`);
    return 1;
  }

  try {
    // Create CLI context
    const context = await createCLIContext(args);
    
    // Log permissions being used (Unix principle: explicit and auditable)
    if (context.verbose) {
      console.log(`🔒 Required permissions: ${COMMANDS[command].permissions.join(" ")}`);
      console.log(`📁 Working directory: ${context.cwd}`);
      console.log(`⚙️  Configuration: ${context.configPath}`);
    }

    // Execute command
    const exitCode = await COMMANDS[command].handler(commandArgs, context);
    return exitCode;

  } catch (error) {
    console.error(`❌ Error executing '${command}':`, error.message);
    
    if (args.verbose) {
      console.error(error.stack);
    }
    
    return 1;
  }
}

// Unix principle: Clear exit codes
if (import.meta.main) {
  const exitCode = await main();
  Deno.exit(exitCode);
}