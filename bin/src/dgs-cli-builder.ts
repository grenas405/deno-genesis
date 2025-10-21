#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * CLI.ts - Meta CLI Utility for Creating CLI Utilities
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Generate production-ready CLI tools
 * - Accept text input: Command specifications, configuration
 * - Produce text output: TypeScript CLI files with all patterns
 * - Filter and transform: CLI spec → fully-featured command file
 * - Composable: Generated CLIs follow same composability principles
 *
 * Security-First Approach:
 * - Explicit permissions in generated shebangs
 * - Documented security boundaries
 * - Safe file operations
 * - Auditable code generation
 *
 * Zero-Configuration Philosophy:
 * - Interactive prompts with smart defaults
 * - Generates complete, working CLI tools
 * - Self-documenting output
 * - No build steps required
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";

// ============================================================================
// TYPES
// ============================================================================

interface CLIContext {
  cwd: string;
  configPath: string;
  verbose: boolean;
  dryRun: boolean;
  format: "text" | "json" | "yaml";
}

interface CLISpec {
  name: string;
  description: string;
  version: string;
  author?: string;
  commands: CommandSpec[];
  globalOptions: OptionSpec[];
  colors: boolean;
  interactivePrompts: boolean;
  validationHelpers: boolean;
}

interface CommandSpec {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  permissions: Permission[];
  options: OptionSpec[];
  arguments: ArgumentSpec[];
  validation: ValidationSpec[];
  interactive: boolean;
}

interface OptionSpec {
  name: string;
  alias?: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  default?: string | number | boolean;
}

interface ArgumentSpec {
  name: string;
  description: string;
  required: boolean;
  variadic: boolean;
}

interface ValidationSpec {
  field: string;
  type: "regex" | "range" | "enum" | "custom";
  rule: string;
  message: string;
}

interface Permission {
  flag: string;
  reason: string;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

const Colors = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  CYAN: "\x1b[36m",
  MAGENTA: "\x1b[35m",
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
};

function log(message: string, color = ""): void {
  console.log(`${color}${message}${Colors.RESET}`);
}

function logSuccess(message: string): void {
  log(`✅ ${message}`, Colors.GREEN);
}

function logError(message: string): void {
  log(`❌ ${message}`, Colors.RED);
}

function logWarning(message: string): void {
  log(`⚠️  ${message}`, Colors.YELLOW);
}

function logInfo(message: string): void {
  log(`ℹ  ${message}`, Colors.CYAN);
}

function logSection(title: string): void {
  console.log(
    `\n${Colors.CYAN}${Colors.BOLD}━━━ ${title} ━━━${Colors.RESET}\n`,
  );
}

// ============================================================================
// PROMPT UTILITIES
// ============================================================================

async function promptText(
  question: string,
  options: {
    required?: boolean;
    default?: string;
    validator?: (input: string) => boolean;
    hint?: string;
  } = {},
): Promise<string> {
  while (true) {
    const hint = options.hint
      ? ` ${Colors.DIM}(${options.hint})${Colors.RESET}`
      : "";
    const defaultText = options.default
      ? ` ${Colors.DIM}[${options.default}]${Colors.RESET}`
      : "";

    const promptText =
      `${Colors.CYAN}${question}${hint}${defaultText}:${Colors.RESET} `;
    await Deno.stdout.write(new TextEncoder().encode(promptText));

    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);
    const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim();

    if (!input && options.default) {
      return options.default;
    }

    if (options.required && !input) {
      logError("This field is required.");
      continue;
    }

    if (!input) {
      return "";
    }

    if (options.validator && !options.validator(input)) {
      logError("Invalid input format. Please try again.");
      continue;
    }

    return input;
  }
}

async function promptNumber(
  question: string,
  options: { min?: number; max?: number; default?: number } = {},
): Promise<number> {
  while (true) {
    const rangeText = options.min !== undefined && options.max !== undefined
      ? ` ${Colors.DIM}(${options.min}-${options.max})${Colors.RESET}`
      : "";
    const defaultText = options.default !== undefined
      ? ` ${Colors.DIM}[${options.default}]${Colors.RESET}`
      : "";

    const promptText =
      `${Colors.CYAN}${question}${rangeText}${defaultText}:${Colors.RESET} `;
    await Deno.stdout.write(new TextEncoder().encode(promptText));

    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);
    const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim();

    if (!input && options.default !== undefined) {
      return options.default;
    }

    const num = parseInt(input, 10);

    if (isNaN(num)) {
      logError("Please enter a valid number.");
      continue;
    }

    if (options.min !== undefined && num < options.min) {
      logError(`Number must be at least ${options.min}.`);
      continue;
    }

    if (options.max !== undefined && num > options.max) {
      logError(`Number must be at most ${options.max}.`);
      continue;
    }

    return num;
  }
}

async function promptYesNo(
  question: string,
  defaultValue = false,
): Promise<boolean> {
  const defaultText = defaultValue
    ? `${Colors.DIM}[Y/n]${Colors.RESET}`
    : `${Colors.DIM}[y/N]${Colors.RESET}`;
  const promptText =
    `${Colors.CYAN}${question} ${defaultText}:${Colors.RESET} `;

  await Deno.stdout.write(new TextEncoder().encode(promptText));

  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim()
    .toLowerCase();

  if (!input) {
    return defaultValue;
  }

  return input === "y" || input === "yes";
}

async function promptSelect(
  question: string,
  options: string[],
  defaultIndex = 0,
): Promise<number> {
  console.log(`\n${Colors.CYAN}${question}${Colors.RESET}`);
  options.forEach((opt, idx) => {
    const marker = idx === defaultIndex ? Colors.GREEN + "›" : " ";
    console.log(`  ${marker} ${idx + 1}. ${opt}${Colors.RESET}`);
  });

  return await promptNumber("Select option", {
    min: 1,
    max: options.length,
    default: defaultIndex + 1,
  }) - 1;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateCLIName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

function validateCommandName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

function validateVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

// ============================================================================
// INTERACTIVE CLI SPECIFICATION GATHERING
// ============================================================================

async function gatherCLISpecification(
  context: CLIContext,
): Promise<CLISpec> {
  logSection("CLI Tool Specification");

  // Basic Information
  const name = await promptText("CLI tool name", {
    required: true,
    validator: validateCLIName,
    hint: "lowercase, hyphens allowed",
  });

  const description = await promptText("Brief description", {
    required: true,
    hint: "what does this CLI do?",
  });

  const version = await promptText("Version", {
    default: "1.0.0",
    validator: validateVersion,
    hint: "semver format",
  });

  const author = await promptText("Author", {
    hint: "optional",
  });

  // Features
  logSection("CLI Features");

  const colors = await promptYesNo("Include color-coded output?", true);
  const interactivePrompts = await promptYesNo(
    "Include interactive prompts?",
    true,
  );
  const validationHelpers = await promptYesNo(
    "Include validation helpers?",
    true,
  );

  // Global Options
  const globalOptions: OptionSpec[] = [
    {
      name: "help",
      alias: "h",
      type: "boolean",
      description: "Show help information",
      required: false,
    },
    {
      name: "version",
      alias: "v",
      type: "boolean",
      description: "Show version information",
      required: false,
    },
    {
      name: "verbose",
      type: "boolean",
      description: "Enable verbose output",
      required: false,
    },
  ];

  const addDryRun = await promptYesNo(
    "Add --dry-run option for testing?",
    true,
  );
  if (addDryRun) {
    globalOptions.push({
      name: "dry-run",
      type: "boolean",
      description: "Show what would be done without executing",
      required: false,
    });
  }

  // Commands
  const commands: CommandSpec[] = [];
  let addMoreCommands = true;

  while (addMoreCommands) {
    logSection(`Command ${commands.length + 1}`);

    const command = await gatherCommandSpecification();
    commands.push(command);

    addMoreCommands = await promptYesNo("Add another command?", false);
  }

  return {
    name,
    description,
    version,
    author,
    commands,
    globalOptions,
    colors,
    interactivePrompts,
    validationHelpers,
  };
}

async function gatherCommandSpecification(): Promise<CommandSpec> {
  const name = await promptText("Command name", {
    required: true,
    validator: validateCommandName,
    hint: "e.g., init, build, deploy",
  });

  const description = await promptText("Command description", {
    required: true,
  });

  const usage = await promptText("Usage pattern", {
    default: `${name} [options]`,
    hint: "e.g., init [project-name] [options]",
  });

  // Examples
  const examples: string[] = [];
  const addExample1 = await promptText(`Example 1 for '${name}'`, {
    hint: "press Enter to skip",
  });
  if (addExample1) {
    examples.push(addExample1);

    const addMore = await promptYesNo("Add more examples?", false);
    if (addMore) {
      const example2 = await promptText("Example 2");
      if (example2) examples.push(example2);

      const addMore2 = await promptYesNo("Add one more example?", false);
      if (addMore2) {
        const example3 = await promptText("Example 3");
        if (example3) examples.push(example3);
      }
    }
  }

  // Permissions
  logInfo("Select required Deno permissions:");
  const permissionOptions = [
    { flag: "--allow-read", reason: "Read files and directories" },
    { flag: "--allow-write", reason: "Write files and directories" },
    { flag: "--allow-net", reason: "Make network requests" },
    { flag: "--allow-run", reason: "Run subprocesses" },
    { flag: "--allow-env", reason: "Access environment variables" },
  ];

  const permissions: Permission[] = [];
  for (const perm of permissionOptions) {
    const include = await promptYesNo(
      `  ${perm.flag} (${perm.reason})?`,
      false,
    );
    if (include) {
      permissions.push(perm);
    }
  }

  // Options
  const options: OptionSpec[] = [];
  const addOptions = await promptYesNo("Add command-specific options?", false);

  if (addOptions) {
    let addMoreOptions = true;
    while (addMoreOptions) {
      const option = await gatherOptionSpecification();
      options.push(option);

      addMoreOptions = await promptYesNo("Add another option?", false);
    }
  }

  // Interactive mode
  const interactive = await promptYesNo(
    "Should this command have interactive mode?",
    true,
  );

  return {
    name,
    description,
    usage,
    examples: examples.length > 0 ? examples : [`${name}`, `${name} --help`],
    permissions,
    options,
    arguments: [],
    validation: [],
    interactive,
  };
}

async function gatherOptionSpecification(): Promise<OptionSpec> {
  const name = await promptText("Option name", {
    required: true,
    hint: "without -- prefix",
  });

  const alias = await promptText("Short alias", {
    hint: "single letter, optional",
  });

  const typeIndex = await promptSelect(
    "Option type",
    ["string", "number", "boolean"],
    0,
  );
  const type = ["string", "number", "boolean"][typeIndex] as
    | "string"
    | "number"
    | "boolean";

  const description = await promptText("Description", { required: true });

  const required = await promptYesNo("Is this option required?", false);

  let defaultValue: string | number | boolean | undefined;
  if (!required) {
    const hasDefault = await promptYesNo("Set a default value?", false);
    if (hasDefault) {
      if (type === "boolean") {
        defaultValue = await promptYesNo("Default value", false);
      } else if (type === "number") {
        defaultValue = await promptNumber("Default value");
      } else {
        defaultValue = await promptText("Default value");
      }
    }
  }

  return {
    name,
    alias: alias || undefined,
    type,
    description,
    required,
    default: defaultValue,
  };
}

// ============================================================================
// CODE GENERATION
// ============================================================================

function generateShebang(permissions: Permission[]): string {
  const flags = permissions.map((p) => p.flag).join(" ");
  return `#!/usr/bin/env -S deno run ${flags}`;
}

function generateHeader(spec: CLISpec): string {
  return `${generateShebang(getAllPermissions(spec))}

/**
 * ${spec.name} - ${spec.description}
 * Version: ${spec.version}
 * ${spec.author ? `Author: ${spec.author}` : ""}
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: ${spec.description}
 * - Accept text input: Command line arguments and interactive prompts
 * - Produce text output: Structured logging and results
 * - Filter and transform: User intent → actionable results
 * - Composable: Can be scripted, piped, and automated
 *
 * Security-First Approach:
 * - Explicit permissions for all operations
 * - Auditable command execution
 * - Safe file system operations
 *
 * Zero-Configuration Philosophy:
 * - Sensible defaults for all options
 * - Interactive prompts when needed
 * - Self-documenting output
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";

// ============================================================================
// TYPES
// ============================================================================

interface CLIContext {
  cwd: string;
  configPath: string;
  verbose: boolean;
  dryRun: boolean;
  format: "text" | "json" | "yaml";
}
`;
}

function generateColorUtilities(spec: CLISpec): string {
  if (!spec.colors) return "";

  return `
// ============================================================================
// COLOR UTILITIES
// ============================================================================

const Colors = {
  RED: "\\x1b[31m",
  GREEN: "\\x1b[32m",
  YELLOW: "\\x1b[33m",
  BLUE: "\\x1b[34m",
  CYAN: "\\x1b[36m",
  RESET: "\\x1b[0m",
  BOLD: "\\x1b[1m",
};

function logSuccess(message: string): void {
  console.log(\`\${Colors.GREEN}✅ \${message}\${Colors.RESET}\`);
}

function logError(message: string): void {
  console.error(\`\${Colors.RED}❌ \${message}\${Colors.RESET}\`);
}

function logWarning(message: string): void {
  console.log(\`\${Colors.YELLOW}⚠️  \${message}\${Colors.RESET}\`);
}

function logInfo(message: string): void {
  console.log(\`\${Colors.CYAN}ℹ  \${message}\${Colors.RESET}\`);
}

function logSection(title: string): void {
  console.log(\`\\n\${Colors.CYAN}\${Colors.BOLD}━━━ \${title} ━━━\${Colors.RESET}\\n\`);
}
`;
}

function generateValidationHelpers(spec: CLISpec): string {
  if (!spec.validationHelpers) return "";

  return `
// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateRequired(value: string, fieldName: string): { valid: boolean; error?: string } {
  if (!value || !value.trim()) {
    return { valid: false, error: \`\${fieldName} is required\` };
  }
  return { valid: true };
}

function validateRegex(value: string, pattern: RegExp, fieldName: string): { valid: boolean; error?: string } {
  if (!pattern.test(value)) {
    return { valid: false, error: \`Invalid \${fieldName} format\` };
  }
  return { valid: true };
}

function validateRange(value: number, min: number, max: number, fieldName: string): { valid: boolean; error?: string } {
  if (value < min || value > max) {
    return { valid: false, error: \`\${fieldName} must be between \${min} and \${max}\` };
  }
  return { valid: true };
}
`;
}

function generatePromptUtilities(spec: CLISpec): string {
  if (!spec.interactivePrompts) return "";

  return `
// ============================================================================
// INTERACTIVE PROMPTS
// ============================================================================

async function promptText(
  question: string,
  options: {
    required?: boolean;
    default?: string;
    validator?: (input: string) => boolean;
    hint?: string;
  } = {}
): Promise<string> {
  while (true) {
    const hint = options.hint ? \` (\${options.hint})\` : "";
    const defaultText = options.default ? \` [\${options.default}]\` : "";
    const promptText = \`\${question}\${hint}\${defaultText}: \`;

    await Deno.stdout.write(new TextEncoder().encode(promptText));

    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);
    const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim();

    if (!input && options.default) {
      return options.default;
    }

    if (options.required && !input) {
      ${
    spec.colors
      ? 'logError("This field is required.");'
      : 'console.error("This field is required.");'
  }
      continue;
    }

    if (!input) {
      return "";
    }

    if (options.validator && !options.validator(input)) {
      ${
    spec.colors
      ? 'logError("Invalid input format.");'
      : 'console.error("Invalid input format.");'
  }
      continue;
    }

    return input;
  }
}

async function promptYesNo(question: string, defaultValue = false): Promise<boolean> {
  const defaultText = defaultValue ? "[Y/n]" : "[y/N]";
  const promptText = \`\${question} \${defaultText}: \`;

  await Deno.stdout.write(new TextEncoder().encode(promptText));

  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim().toLowerCase();

  if (!input) {
    return defaultValue;
  }

  return input === "y" || input === "yes";
}
`;
}

function generateCommandHandler(
  command: CommandSpec,
  spec: CLISpec,
): string {
  const functionName = `${command.name}Command`;
  const configType = `${capitalize(command.name)}Config`;
  const optionsType = `${capitalize(command.name)}Options`;

  return `
// ============================================================================
// ${command.name.toUpperCase()} COMMAND
// ============================================================================

interface ${optionsType} {
${command.options.map((opt) => `  ${opt.name}?: ${opt.type};`).join("\n")}
}

interface ${configType} {
  // TODO: Define your configuration structure
  name: string;
}

/**
 * Parse ${command.name} command arguments
 */
function parse${capitalize(command.name)}Args(args: string[]): ${optionsType} {
  const options: ${optionsType} = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
${generateArgParser(command)}
  }

  return options;
}

/**
 * Gather ${command.name} configuration
 */
async function gather${capitalize(command.name)}Configuration(
  options: ${optionsType},
  context: CLIContext
): Promise<${configType}> {
  ${
    spec.interactivePrompts
      ? `logSection("${capitalize(command.name)} Configuration");`
      : ""
  }

  // TODO: Implement configuration gathering
  const config: ${configType} = {
    name: "example",
  };

  return config;
}

/**
 * Validate ${command.name} configuration
 */
function validate${
    capitalize(command.name)
  }Config(config: ${configType}): { valid: boolean; error?: string } {
  // TODO: Implement validation logic
  if (!config.name) {
    return { valid: false, error: "Name is required" };
  }

  return { valid: true };
}

/**
 * Execute ${command.name} command
 */
async function execute${capitalize(command.name)}(
  config: ${configType},
  context: CLIContext
): Promise<void> {
  ${
    spec.colors
      ? `logInfo("Executing ${command.name}...");`
      : `console.log("Executing ${command.name}...");`
  }

  // TODO: Implement command logic

  ${
    spec.colors
      ? 'logSuccess("Command completed successfully!");'
      : 'console.log("Command completed successfully!");'
  }
}

/**
 * Main ${command.name} command handler
 */
export async function ${functionName}(
  args: string[],
  context: CLIContext
): Promise<number> {
  try {
    ${
    spec.colors
      ? `logSection("${capitalize(command.name)} Command");`
      : `console.log("\\n=== ${capitalize(command.name)} Command ===\\n");`
  }

    // Parse arguments
    const options = parse${capitalize(command.name)}Args(args);

    // Gather configuration
    const config = await gather${
    capitalize(command.name)
  }Configuration(options, context);

    // Validate configuration
    const validation = validate${capitalize(command.name)}Config(config);
    if (!validation.valid) {
      ${
    spec.colors ? "logError" : "console.error"
  }(\`Configuration validation failed: \${validation.error}\`);
      return 1;
    }

    // Execute command
    await execute${capitalize(command.name)}(config, context);

    return 0;
  } catch (error) {
    ${spec.colors ? "logError" : "console.error"}(\`${
    capitalize(command.name)
  } command failed: \${error.message}\`);
    if (context.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

/**
 * Show help for ${command.name} command
 */
export function show${capitalize(command.name)}Help(): void {
  console.log(\`
${Colors.BOLD}${command.name}${Colors.RESET} - ${command.description}

USAGE:
  ${command.usage}

DESCRIPTION:
  ${command.description}

${
    command.options.length > 0
      ? `OPTIONS:
${
        command.options.map((opt) =>
          `  --${opt.name}${
            opt.alias ? `, -${opt.alias}` : ""
          }    ${opt.description}`
        ).join("\n")
      }`
      : ""
  }

EXAMPLES:
${command.examples.map((ex) => `  ${ex}`).join("\n")}

PERMISSIONS:
  Required Deno permissions: ${command.permissions.map((p) => p.flag).join(" ")}
\`);
}
`;
}

function generateArgParser(command: CommandSpec): string {
  return command.options.map((opt) => {
    const conditions = [`arg === "--${opt.name}"`];
    if (opt.alias) {
      conditions.push(`arg === "-${opt.alias}"`);
    }

    if (opt.type === "boolean") {
      return `    if (${conditions.join(" || ")}) {
      options.${opt.name} = true;
    }`;
    } else {
      return `    if (${conditions.join(" || ")}) {
      options.${opt.name} = args[++i]${
        opt.type === "number" ? " as unknown as number" : ""
      };
    }`;
    }
  }).join("\n");
}

function generateMainFunction(spec: CLISpec): string {
  return `
// ============================================================================
// MAIN CLI HANDLER
// ============================================================================

interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[], context: CLIContext) => Promise<number>;
  permissions: string[];
}

const COMMANDS: Record<string, CommandDefinition> = {
${
    spec.commands.map((cmd) =>
      `  "${cmd.name}": {
    name: "${cmd.name}",
    description: "${cmd.description}",
    usage: "${cmd.usage}",
    examples: ${JSON.stringify(cmd.examples)},
    handler: ${cmd.name}Command,
    permissions: ${JSON.stringify(cmd.permissions.map((p) => p.flag))}
  }`
    ).join(",\n")
  }
};

function showHelp(command?: string): void {
  if (command && COMMANDS[command]) {
    show${capitalize(spec.commands[0].name)}Help();
    return;
  }

  console.log(\`
${Colors.BOLD}${spec.name}${Colors.RESET} - ${spec.description}
Version: ${spec.version}

USAGE:
  ${spec.name} <command> [options]

COMMANDS:
${
    spec.commands.map((cmd) => `  ${cmd.name.padEnd(12)} ${cmd.description}`)
      .join("\n")
  }

GLOBAL OPTIONS:
${
    spec.globalOptions.map((opt) =>
      `  --${opt.name}${opt.alias ? `, -${opt.alias}` : ""}${
        " ".repeat(12 - opt.name.length)
      }${opt.description}`
    ).join("\n")
  }

EXAMPLES:
  ${spec.name} help
  ${spec.commands[0].name ? `${spec.name} ${spec.commands[0].name}` : ""}
  ${spec.commands[0].name ? `${spec.name} ${spec.commands[0].name} --help` : ""}

For detailed help on any command:
  ${spec.name} help <command>
\`);
}

function showVersion(): void {
  console.log(\`${spec.name} v${spec.version}\`);
}

async function createCLIContext(args: string[]): Promise<CLIContext> {
  const verbose = args.includes("--verbose");
  const dryRun = args.includes("--dry-run");

  return {
    cwd: Deno.cwd(),
    configPath: join(Deno.cwd(), "${spec.name}.config.ts"),
    verbose,
    dryRun,
    format: "text"
  };
}

async function main(): Promise<number> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showHelp(args[1]);
    return 0;
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    return 0;
  }

  const command = args[0];

  if (!command) {
    showHelp();
    return 1;
  }

  if (command === "help") {
    showHelp(args[1]);
    return 0;
  }

  if (!COMMANDS[command]) {
    ${
    spec.colors ? "logError" : "console.error"
  }(\`Unknown command: \${command}\`);
    console.error(\`Run '${spec.name} help' for available commands.\`);
    return 1;
  }

  try {
    const context = await createCLIContext(args);
    const commandArgs = args.slice(1);

    if (context.verbose) {
      ${
    spec.colors ? "logInfo" : "console.log"
  }(\`Executing command: \${command}\`);
      ${
    spec.colors ? "logInfo" : "console.log"
  }(\`Required permissions: \${COMMANDS[command].permissions.join(" ")}\`);
    }

    const exitCode = await COMMANDS[command].handler(commandArgs, context);
    return exitCode;
  } catch (error) {
    ${
    spec.colors ? "logError" : "console.error"
  }(\`Error executing '\${command}': \${error.message}\`);
    return 1;
  }
}

if (import.meta.main) {
  const exitCode = await main();
  Deno.exit(exitCode);
}
`;
}

function getAllPermissions(spec: CLISpec): Permission[] {
  const permissionMap = new Map<string, Permission>();

  // Collect all unique permissions from all commands
  for (const command of spec.commands) {
    for (const permission of command.permissions) {
      if (!permissionMap.has(permission.flag)) {
        permissionMap.set(permission.flag, permission);
      }
    }
  }

  return Array.from(permissionMap.values());
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// FILE GENERATION
// ============================================================================

async function generateCLIFile(
  spec: CLISpec,
  outputPath: string,
  context: CLIContext,
): Promise<void> {
  logInfo(`Generating CLI file: ${spec.name}.ts`);

  const sections = [
    generateHeader(spec),
    generateColorUtilities(spec),
    generateValidationHelpers(spec),
    generatePromptUtilities(spec),
    ...spec.commands.map((cmd) => generateCommandHandler(cmd, spec)),
    generateMainFunction(spec),
  ];

  const content = sections.filter(Boolean).join("\n");

  await Deno.writeTextFile(outputPath, content);

  // Make file executable
  await Deno.chmod(outputPath, 0o755);

  logSuccess(`Generated: ${outputPath}`);
}

async function generateREADME(
  spec: CLISpec,
  outputDir: string,
): Promise<void> {
  const readmeContent = `# ${spec.name}

> ${spec.description}
${spec.author ? `> Author: ${spec.author}` : ""}

## Installation

\`\`\`bash
# Clone or download ${spec.name}.ts
chmod +x ${spec.name}.ts

# Optional: Create symlink for easy access
ln -s $(pwd)/${spec.name}.ts /usr/local/bin/${spec.name}
\`\`\`

## Usage

\`\`\`bash
# Show help
./${spec.name}.ts --help

# Show version
./${spec.name}.ts --version
\`\`\`

## Commands

${
    spec.commands.map((cmd) =>
      `### ${cmd.name}

${cmd.description}

**Usage:**
\`\`\`bash
${cmd.usage}
\`\`\`

**Examples:**
\`\`\`bash
${cmd.examples.join("\n")}
\`\`\`

**Required Permissions:**
${cmd.permissions.map((p) => `- \`${p.flag}\` - ${p.reason}`).join("\n")}
`
    ).join("\n")
  }

## Global Options

${
    spec.globalOptions.map((opt) =>
      `- \`--${opt.name}${
        opt.alias ? `, -${opt.alias}` : ""
      }\` - ${opt.description}`
    ).join("\n")
  }

## Features

${spec.colors ? "✅ Color-coded terminal output" : ""}
${spec.interactivePrompts ? "✅ Interactive prompts with validation" : ""}
${spec.validationHelpers ? "✅ Built-in validation helpers" : ""}
✅ Unix Philosophy compliant
✅ Security-first design with explicit permissions
✅ Zero-configuration defaults

## Development

This CLI tool follows the Unix Philosophy:
- **Do one thing well**: ${spec.description}
- **Composable**: Can be scripted and automated
- **Text-based I/O**: Clear input and output
- **Explicit security**: All permissions documented

## License

${spec.author ? `Copyright © ${new Date().getFullYear()} ${spec.author}` : ""}
`;

  const readmePath = join(outputDir, "README.md");
  await Deno.writeTextFile(readmePath, readmeContent);

  logSuccess(`Generated: README.md`);
}

async function generateExampleConfig(
  spec: CLISpec,
  outputDir: string,
): Promise<void> {
  const configContent = `// ${spec.name} Configuration Example
// Copy this file to ${spec.name}.config.ts and customize

export interface Config {
  // Add your configuration options here
  debug: boolean;
  outputFormat: "text" | "json" | "yaml";
}

export const config: Config = {
  debug: false,
  outputFormat: "text"
};

export default config;
`;

  const configPath = join(outputDir, `${spec.name}.config.example.ts`);
  await Deno.writeTextFile(configPath, configContent);

  logSuccess(`Generated: ${spec.name}.config.example.ts`);
}

async function generateTestFile(
  spec: CLISpec,
  outputDir: string,
): Promise<void> {
  const testContent = `// ${spec.name} - Test Suite
// Run with: deno test ${spec.name}.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Mock CLI context for testing
function createMockContext(): any {
  return {
    cwd: Deno.cwd(),
    configPath: "./${spec.name}.config.ts",
    verbose: false,
    dryRun: true,
    format: "text"
  };
}

${
    spec.commands.map((cmd) => `
Deno.test("${cmd.name} command - basic execution", async () => {
  const context = createMockContext();
  // TODO: Add test implementation
  assertExists(context);
});

Deno.test("${cmd.name} command - validation", async () => {
  const context = createMockContext();
  // TODO: Add validation tests
  assertExists(context);
});
`).join("\n")
  }

Deno.test("Help output", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", "${spec.name}.ts", "--help"],
    stdout: "piped",
    stderr: "piped"
  }).spawn();

  const { code } = await process.status;
  assertEquals(code, 0, "Help should exit with code 0");
});

Deno.test("Version output", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", "${spec.name}.ts", "--version"],
    stdout: "piped",
    stderr: "piped"
  }).spawn();

  const { code } = await process.status;
  assertEquals(code, 0, "Version should exit with code 0");
});
`;

  const testPath = join(outputDir, `${spec.name}.test.ts`);
  await Deno.writeTextFile(testPath, testContent);

  logSuccess(`Generated: ${spec.name}.test.ts`);
}

// ============================================================================
// MAIN CLI.TS COMMAND HANDLERS
// ============================================================================

async function newCommand(
  args: string[],
  context: CLIContext,
): Promise<number> {
  try {
    logSection("CLI.ts - Create New CLI Tool");

    console.log(`
${Colors.CYAN}This wizard will guide you through creating a new CLI tool.${Colors.RESET}
${Colors.DIM}Following Unix Philosophy and Deno Genesis patterns.${Colors.RESET}
`);

    // Gather specification
    const spec = await gatherCLISpecification(context);

    // Create output directory
    const outputDir = join(context.cwd, spec.name);

    if (await exists(outputDir)) {
      const overwrite = await promptYesNo(
        `Directory '${spec.name}' already exists. Overwrite?`,
        false,
      );
      if (!overwrite) {
        logWarning("Operation cancelled.");
        return 1;
      }
    }

    await ensureDir(outputDir);

    // Generate files
    logSection("Generating Files");

    const cliPath = join(outputDir, `${spec.name}.ts`);
    await generateCLIFile(spec, cliPath, context);
    await generateREADME(spec, outputDir);
    await generateExampleConfig(spec, outputDir);
    await generateTestFile(spec, outputDir);

    // Success output
    console.log(`
${Colors.GREEN}${Colors.BOLD}✅ CLI tool generated successfully!${Colors.RESET}

${Colors.BOLD}Generated Files:${Colors.RESET}
  📄 ${spec.name}.ts                Main CLI executable
  📖 README.md                      Documentation
  ⚙️  ${spec.name}.config.example.ts  Configuration template
  🧪 ${spec.name}.test.ts           Test suite

${Colors.BOLD}Quick Start:${Colors.RESET}
  cd ${spec.name}
  ./${spec.name}.ts --help
  ./${spec.name}.ts ${spec.commands[0].name}

${Colors.BOLD}Run Tests:${Colors.RESET}
  deno test ${spec.name}.test.ts

${Colors.BOLD}Make Globally Available:${Colors.RESET}
  ln -s $(pwd)/${spec.name}/${spec.name}.ts /usr/local/bin/${spec.name}

${Colors.BOLD}Next Steps:${Colors.RESET}
  1. Review generated code in ${spec.name}.ts
  2. Implement TODO sections in command handlers
  3. Customize validation logic
  4. Add tests to ${spec.name}.test.ts
  5. Update README.md with specific details

${Colors.CYAN}Generated CLI follows:${Colors.RESET}
  ✓ Unix Philosophy principles
  ✓ Deno Genesis patterns
  ✓ Security-first design
  ✓ Zero-configuration defaults
  ✓ Full TypeScript type safety

${Colors.DIM}Happy coding! 🚀${Colors.RESET}
`);

    return 0;
  } catch (error) {
    logError(`Failed to generate CLI: ${error.message}`);
    if (context.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

async function listCommand(
  args: string[],
  context: CLIContext,
): Promise<number> {
  try {
    logSection("Available CLI Templates");

    console.log(`
${Colors.BOLD}Built-in Templates:${Colors.RESET}

  ${Colors.GREEN}1. Basic${Colors.RESET}
     Simple CLI with one or two commands
     Perfect for: Scripts, utilities, tools

  ${Colors.GREEN}2. Standard${Colors.RESET}
     Multiple commands with interactive prompts
     Perfect for: Project generators, deployment tools

  ${Colors.GREEN}3. Advanced${Colors.RESET}
     Full-featured with validation, config files
     Perfect for: Framework CLIs, complex workflows

${Colors.CYAN}Create a new CLI:${Colors.RESET}
  CLI.ts new

${Colors.CYAN}Learn more:${Colors.RESET}
  CLI.ts help
`);

    return 0;
  } catch (error) {
    logError(`Failed to list templates: ${error.message}`);
    return 1;
  }
}

async function validateCommand(
  args: string[],
  context: CLIContext,
): Promise<number> {
  try {
    const cliFile = args[0];

    if (!cliFile) {
      logError("Please specify a CLI file to validate");
      console.log("Usage: CLI.ts validate <cli-file.ts>");
      return 1;
    }

    logSection(`Validating: ${cliFile}`);

    if (!await exists(cliFile)) {
      logError(`File not found: ${cliFile}`);
      return 1;
    }

    // Check if file is executable
    try {
      const fileInfo = await Deno.stat(cliFile);
      const isExecutable = (fileInfo.mode! & 0o111) !== 0;

      if (isExecutable) {
        logSuccess("File is executable");
      } else {
        logWarning("File is not executable");
        console.log(`  Fix: chmod +x ${cliFile}`);
      }
    } catch {
      logWarning("Could not check file permissions");
    }

    // Try to parse the file
    try {
      const content = await Deno.readTextFile(cliFile);

      // Check for required patterns
      const hasShebang = content.startsWith("#!/usr/bin/env");
      const hasMainGuard = content.includes("if (import.meta.main)");
      const hasHelp = content.includes("showHelp") ||
        content.includes("--help");
      const hasVersion = content.includes("showVersion") ||
        content.includes("--version");

      console.log("\n" + Colors.BOLD + "Validation Results:" + Colors.RESET);

      console.log(
        hasShebang
          ? `${Colors.GREEN}✓${Colors.RESET} Has proper shebang`
          : `${Colors.RED}✗${Colors.RESET} Missing shebang`,
      );

      console.log(
        hasMainGuard
          ? `${Colors.GREEN}✓${Colors.RESET} Has main execution guard`
          : `${Colors.YELLOW}⚠${Colors.RESET} Missing main execution guard`,
      );

      console.log(
        hasHelp
          ? `${Colors.GREEN}✓${Colors.RESET} Has help functionality`
          : `${Colors.YELLOW}⚠${Colors.RESET} Missing help functionality`,
      );

      console.log(
        hasVersion
          ? `${Colors.GREEN}✓${Colors.RESET} Has version information`
          : `${Colors.YELLOW}⚠${Colors.RESET} Missing version information`,
      );

      if (hasShebang && hasMainGuard) {
        console.log(
          "\n" + Colors.GREEN + "✅ CLI file looks valid!" + Colors.RESET,
        );
        return 0;
      } else {
        console.log(
          "\n" + Colors.YELLOW + "⚠️  CLI file has some issues" + Colors.RESET,
        );
        return 1;
      }
    } catch (error) {
      logError(`Failed to parse file: ${error.message}`);
      return 1;
    }
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    return 1;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

interface CommandDefinition {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[], context: CLIContext) => Promise<number>;
}

const COMMANDS: Record<string, CommandDefinition> = {
  new: {
    name: "new",
    description: "Create a new CLI tool with interactive wizard",
    usage: "CLI.ts new",
    examples: [
      "CLI.ts new",
      "CLI.ts new --verbose",
    ],
    handler: newCommand,
  },
  list: {
    name: "list",
    description: "List available CLI templates and patterns",
    usage: "CLI.ts list",
    examples: ["CLI.ts list"],
    handler: listCommand,
  },
  validate: {
    name: "validate",
    description: "Validate an existing CLI tool file",
    usage: "CLI.ts validate <cli-file.ts>",
    examples: [
      "CLI.ts validate my-tool.ts",
      "CLI.ts validate ./bin/deploy.ts",
    ],
    handler: validateCommand,
  },
};

function showHelp(command?: string): void {
  if (command && COMMANDS[command]) {
    const cmd = COMMANDS[command];
    console.log(`
${Colors.BOLD}${cmd.name}${Colors.RESET} - ${cmd.description}

${Colors.BOLD}USAGE:${Colors.RESET}
  ${cmd.usage}

${Colors.BOLD}EXAMPLES:${Colors.RESET}
${cmd.examples.map((ex) => `  ${ex}`).join("\n")}
`);
    return;
  }

  console.log(`
${Colors.CYAN}${Colors.BOLD}CLI.ts${Colors.RESET} - Meta CLI Utility for Creating CLI Utilities

${Colors.BOLD}DESCRIPTION:${Colors.RESET}
  Generate production-ready CLI tools following Unix Philosophy
  and Deno Genesis patterns. Creates fully-functional CLI utilities
  with interactive prompts, validation, and comprehensive documentation.

${Colors.BOLD}USAGE:${Colors.RESET}
  CLI.ts <command> [options]

${Colors.BOLD}COMMANDS:${Colors.RESET}
  new         Create a new CLI tool with interactive wizard
  list        List available CLI templates and patterns
  validate    Validate an existing CLI tool file
  help        Show this help message

${Colors.BOLD}GLOBAL OPTIONS:${Colors.RESET}
  --help, -h     Show help information
  --version, -v  Show version information
  --verbose      Enable verbose output
  --dry-run      Show what would be done without executing

${Colors.BOLD}EXAMPLES:${Colors.RESET}
  # Create a new CLI tool (interactive)
  CLI.ts new

  # List available templates
  CLI.ts list

  # Validate an existing CLI
  CLI.ts validate my-tool.ts

  # Show help for a specific command
  CLI.ts help new

${Colors.BOLD}FEATURES:${Colors.RESET}
  ✓ Interactive wizard for CLI creation
  ✓ Generates complete, working CLI tools
  ✓ Follows Unix Philosophy principles
  ✓ Includes validation helpers
  ✓ Color-coded terminal output
  ✓ Comprehensive documentation
  ✓ Test suite generation
  ✓ Zero configuration required

${Colors.BOLD}GENERATED CLIs INCLUDE:${Colors.RESET}
  • Command handlers with error handling
  • Interactive prompts with validation
  • Argument parsing
  • Help and version commands
  • Color-coded output
  • Test suite
  • README documentation
  • Configuration examples

${Colors.BOLD}PHILOSOPHY:${Colors.RESET}
  CLI.ts follows the Unix Philosophy:
  • Do one thing well: Generate CLI tools
  • Composable: Generated CLIs are composable
  • Text-based I/O: Clear input and output
  • Explicit security: All permissions documented

${Colors.DIM}For more information, see the generated README.md files${Colors.RESET}
`);
}

function showVersion(): void {
  console.log(`
${Colors.BOLD}CLI.ts${Colors.RESET} v1.0.0

Meta CLI Utility for Creating CLI Utilities
Built with Unix Philosophy + Deno Genesis Patterns

Runtime: Deno ${Deno.version.deno}
TypeScript: ${Deno.version.typescript}
V8: ${Deno.version.v8}
`);
}

async function createCLIContext(): Promise<CLIContext> {
  const args = Deno.args;

  return {
    cwd: Deno.cwd(),
    configPath: join(Deno.cwd(), "CLI.config.ts"),
    verbose: args.includes("--verbose"),
    dryRun: args.includes("--dry-run"),
    format: "text",
  };
}

async function main(): Promise<number> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    showHelp(args[1]);
    return 0;
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    return 0;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  if (command === "help") {
    showHelp(commandArgs[0]);
    return 0;
  }

  if (!COMMANDS[command]) {
    logError(`Unknown command: ${command}`);
    console.error(`Run 'CLI.ts help' for available commands.`);
    return 1;
  }

  try {
    const context = await createCLIContext();

    if (context.verbose) {
      logInfo(`Executing command: ${command}`);
    }

    const exitCode = await COMMANDS[command].handler(commandArgs, context);
    return exitCode;
  } catch (error) {
    logError(`Error executing '${command}': ${error.message}`);
    if (Deno.args.includes("--verbose")) {
      console.error(error.stack);
    }
    return 1;
  }
}

if (import.meta.main) {
  const exitCode = await main();
  Deno.exit(exitCode);
}
