#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Deno Genesis Environment Setup Utility
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Generate and manage environment configurations
 * - Accept text input: Template files, user input, existing configs
 * - Produce text output: Environment files, validation reports
 * - Filter and transform: Template + values → configured environment
 * - Composable: Works with other setup utilities via standard formats
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env setup-env.ts
 *   deno run --allow-read --allow-write --allow-env setup-env.ts --env production
 *   deno run --allow-read --allow-write --allow-env setup-env.ts --validate-only
 */

import { parseArgs } from "https://deno.land/std@0.204.0/cli/parse_args.ts";
import { exists, ensureDir } from "https://deno.land/std@0.204.0/fs/mod.ts";
import { join, dirname } from "https://deno.land/std@0.204.0/path/mod.ts";

// Environment configuration types
interface EnvironmentConfig {
  name: string;
  description: string;
  variables: Record<string, EnvironmentVariable>;
}

interface EnvironmentVariable {
  value: string;
  description: string;
  required: boolean;
  sensitive: boolean;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'path';
  validation?: string; // regex pattern for validation
}

interface SetupOptions {
  environment: string;
  validateOnly: boolean;
  interactive: boolean;
  outputPath: string;
  templatePath: string;
  verbose: boolean;
}

// ANSI color codes for Unix-style output
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
  const border = '='.repeat(50);
  console.log(`\n${Colors.CYAN}${border}`);
  console.log(`${Colors.BOLD}${Colors.CYAN} ${message}`);
  console.log(`${border}${Colors.RESET}\n`);
}

// Default environment configurations
const DEFAULT_ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  development: {
    name: "development",
    description: "Local development environment",
    variables: {
      NODE_ENV: {
        value: "development",
        description: "Application environment mode",
        required: true,
        sensitive: false,
        type: "string"
      },
      PORT: {
        value: "3000",
        description: "Application server port",
        required: true,
        sensitive: false,
        type: "number"
      },
      HOST: {
        value: "localhost",
        description: "Application server host",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_HOST: {
        value: "localhost",
        description: "Database server host",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_PORT: {
        value: "3306",
        description: "Database server port",
        required: true,
        sensitive: false,
        type: "number"
      },
      DB_NAME: {
        value: "universal_db",
        description: "Database name",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_USER: {
        value: "webadmin",
        description: "Database username",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_PASSWORD: {
        value: "Password123!",
        description: "Database password",
        required: true,
        sensitive: true,
        type: "string"
      },
      JWT_SECRET: {
        value: "dev-jwt-secret-change-in-production",
        description: "JWT signing secret",
        required: true,
        sensitive: true,
        type: "string"
      },
      SESSION_SECRET: {
        value: "dev-session-secret-change-in-production",
        description: "Session encryption secret",
        required: true,
        sensitive: true,
        type: "string"
      },
      LOG_LEVEL: {
        value: "debug",
        description: "Application log level",
        required: false,
        sensitive: false,
        type: "string",
        validation: "^(error|warn|info|debug)$"
      },
      CORS_ORIGIN: {
        value: "http://localhost:3000",
        description: "CORS allowed origins",
        required: false,
        sensitive: false,
        type: "url"
      },
      STATIC_FILES_PATH: {
        value: "./public",
        description: "Static files directory path",
        required: false,
        sensitive: false,
        type: "path"
      }
    }
  },

  production: {
    name: "production",
    description: "Production environment",
    variables: {
      NODE_ENV: {
        value: "production",
        description: "Application environment mode",
        required: true,
        sensitive: false,
        type: "string"
      },
      PORT: {
        value: "8000",
        description: "Application server port",
        required: true,
        sensitive: false,
        type: "number"
      },
      HOST: {
        value: "0.0.0.0",
        description: "Application server host",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_HOST: {
        value: "localhost",
        description: "Database server host",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_PORT: {
        value: "3306",
        description: "Database server port",
        required: true,
        sensitive: false,
        type: "number"
      },
      DB_NAME: {
        value: "universal_db",
        description: "Database name",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_USER: {
        value: "webadmin",
        description: "Database username",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_PASSWORD: {
        value: "",
        description: "Database password (MUST be set)",
        required: true,
        sensitive: true,
        type: "string"
      },
      JWT_SECRET: {
        value: "",
        description: "JWT signing secret (MUST be set)",
        required: true,
        sensitive: true,
        type: "string"
      },
      SESSION_SECRET: {
        value: "",
        description: "Session encryption secret (MUST be set)",
        required: true,
        sensitive: true,
        type: "string"
      },
      LOG_LEVEL: {
        value: "info",
        description: "Application log level",
        required: false,
        sensitive: false,
        type: "string",
        validation: "^(error|warn|info|debug)$"
      },
      CORS_ORIGIN: {
        value: "https://yourdomain.com",
        description: "CORS allowed origins",
        required: false,
        sensitive: false,
        type: "url"
      },
      STATIC_FILES_PATH: {
        value: "./public",
        description: "Static files directory path",
        required: false,
        sensitive: false,
        type: "path"
      },
      SSL_CERT_PATH: {
        value: "/etc/ssl/certs/your-cert.pem",
        description: "SSL certificate file path",
        required: false,
        sensitive: false,
        type: "path"
      },
      SSL_KEY_PATH: {
        value: "/etc/ssl/private/your-key.pem",
        description: "SSL private key file path",
        required: false,
        sensitive: true,
        type: "path"
      }
    }
  },

  testing: {
    name: "testing",
    description: "Testing environment",
    variables: {
      NODE_ENV: {
        value: "test",
        description: "Application environment mode",
        required: true,
        sensitive: false,
        type: "string"
      },
      PORT: {
        value: "3001",
        description: "Application server port",
        required: true,
        sensitive: false,
        type: "number"
      },
      HOST: {
        value: "localhost",
        description: "Application server host",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_HOST: {
        value: "localhost",
        description: "Database server host",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_PORT: {
        value: "3306",
        description: "Database server port",
        required: true,
        sensitive: false,
        type: "number"
      },
      DB_NAME: {
        value: "universal_db_test",
        description: "Test database name",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_USER: {
        value: "webadmin",
        description: "Database username",
        required: true,
        sensitive: false,
        type: "string"
      },
      DB_PASSWORD: {
        value: "Password123!",
        description: "Database password",
        required: true,
        sensitive: true,
        type: "string"
      },
      JWT_SECRET: {
        value: "test-jwt-secret",
        description: "JWT signing secret for testing",
        required: true,
        sensitive: true,
        type: "string"
      },
      SESSION_SECRET: {
        value: "test-session-secret",
        description: "Session encryption secret for testing",
        required: true,
        sensitive: true,
        type: "string"
      },
      LOG_LEVEL: {
        value: "error",
        description: "Application log level",
        required: false,
        sensitive: false,
        type: "string"
      },
      TEST_TIMEOUT: {
        value: "5000",
        description: "Test timeout in milliseconds",
        required: false,
        sensitive: false,
        type: "number"
      }
    }
  }
};

// Validation functions for different variable types
function validateVariable(variable: EnvironmentVariable, value: string): boolean {
  if (variable.required && (!value || value.trim() === '')) {
    return false;
  }

  if (!value) return true; // Optional empty values are OK

  switch (variable.type) {
    case 'number':
      return !isNaN(Number(value));
    case 'boolean':
      return ['true', 'false', '1', '0'].includes(value.toLowerCase());
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    case 'path':
      return value.length > 0 && !value.includes('\0');
    case 'string':
    default:
      if (variable.validation) {
        const regex = new RegExp(variable.validation);
        return regex.test(value);
      }
      return true;
  }
}

// Generate a secure random string for secrets
function generateSecureSecret(length = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }

  return result;
}

// Load existing environment file if it exists
async function loadExistingEnvironment(filePath: string): Promise<Record<string, string>> {
  if (!await exists(filePath)) {
    return {};
  }

  try {
    const content = await Deno.readTextFile(filePath);
    const variables: Record<string, string> = {};

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          variables[key.trim()] = value;
        }
      }
    }

    return variables;
  } catch (error) {
    logWarning(`Failed to load existing environment file: ${error.message}`);
    return {};
  }
}

// Generate environment file content
function generateEnvironmentFile(config: EnvironmentConfig, existingVars: Record<string, string>): string {
  const lines = [
    `# Deno Genesis Environment Configuration`,
    `# Environment: ${config.name}`,
    `# Description: ${config.description}`,
    `# Generated: ${new Date().toISOString()}`,
    `# DO NOT COMMIT SENSITIVE VALUES TO VERSION CONTROL`,
    '',
  ];

  for (const [key, variable] of Object.entries(config.variables)) {
    // Use existing value if available, otherwise use default
    let value = existingVars[key] || variable.value;

    // Generate secure secrets for production if empty
    if (config.name === 'production' && variable.sensitive && !value) {
      if (key.includes('SECRET') || key.includes('JWT')) {
        value = generateSecureSecret();
        logInfo(`Generated secure ${key}`);
      }
    }

    lines.push(`# ${variable.description}`);
    if (variable.required) {
      lines.push(`# Required: true`);
    }
    if (variable.sensitive) {
      lines.push(`# Sensitive: true`);
    }
    if (variable.validation) {
      lines.push(`# Pattern: ${variable.validation}`);
    }

    // Quote values that contain spaces or special characters
    const needsQuotes = /[\s#"'\\]/.test(value);
    const quotedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;

    lines.push(`${key}=${quotedValue}`);
    lines.push('');
  }

  return lines.join('\n');
}

// Validate environment configuration
function validateEnvironment(config: EnvironmentConfig, variables: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, variable] of Object.entries(config.variables)) {
    const value = variables[key] || '';

    if (!validateVariable(variable, value)) {
      if (variable.required && !value) {
        errors.push(`${key}: Required variable is missing or empty`);
      } else if (value) {
        errors.push(`${key}: Invalid ${variable.type} value: "${value}"`);
      }
    }

    // Special validation for production sensitive variables
    if (config.name === 'production' && variable.sensitive && variable.required) {
      if (!value || value === variable.value) {
        errors.push(`${key}: Production sensitive variable must be set to a unique value`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Interactive prompt for missing or invalid variables
async function promptForVariable(key: string, variable: EnvironmentVariable, currentValue?: string): Promise<string> {
  const prompt = `${variable.description} (${key})`;
  const defaultValue = currentValue || variable.value;

  console.log(`\n${Colors.CYAN}${prompt}${Colors.RESET}`);
  if (variable.sensitive) {
    console.log(`${Colors.YELLOW}⚠️  This is a sensitive value${Colors.RESET}`);
  }
  if (variable.validation) {
    console.log(`${Colors.BLUE}Pattern: ${variable.validation}${Colors.RESET}`);
  }

  const input = globalThis.prompt(`Enter value [${defaultValue}]: `);
  return input?.trim() || defaultValue;
}

// Main setup function
async function setupEnvironment(options: SetupOptions): Promise<void> {
  logHeader(`Environment Setup - ${options.environment.toUpperCase()}`);

  // Load configuration template
  let config = DEFAULT_ENVIRONMENTS[options.environment];

  if (!config) {
    // Try to load from custom template file
    if (await exists(options.templatePath)) {
      try {
        const templateContent = await Deno.readTextFile(options.templatePath);
        config = JSON.parse(templateContent);
        logInfo(`Loaded custom template from ${options.templatePath}`);
      } catch (error) {
        logError(`Failed to load template: ${error.message}`);
        throw error;
      }
    } else {
      logError(`Unknown environment '${options.environment}' and no template found at ${options.templatePath}`);
      throw new Error(`Unknown environment: ${options.environment}`);
    }
  }

  // Ensure output directory exists
  await ensureDir(dirname(options.outputPath));

  // Load existing environment variables if file exists
  const existingVars = await loadExistingEnvironment(options.outputPath);
  const hasExistingFile = Object.keys(existingVars).length > 0;

  if (hasExistingFile) {
    logInfo(`Found existing environment file at ${options.outputPath}`);
  }

  // Validate existing configuration
  const validation = validateEnvironment(config, existingVars);

  if (options.validateOnly) {
    logInfo("Running validation-only mode");
    if (validation.valid) {
      logSuccess("Environment configuration is valid");
      return;
    } else {
      logError("Environment configuration has errors:");
      for (const error of validation.errors) {
        console.log(`  ${Colors.RED}✗${Colors.RESET} ${error}`);
      }
      throw new Error("Validation failed");
    }
  }

  let finalVars = { ...existingVars };

  // Interactive mode for fixing invalid variables
  if (options.interactive && !validation.valid) {
    logWarning("Environment has validation errors. Interactive mode enabled.");

    for (const error of validation.errors) {
      const key = error.split(':')[0];
      const variable = config.variables[key];

      if (variable) {
        try {
          const newValue = await promptForVariable(key, variable, finalVars[key]);
          finalVars[key] = newValue;
        } catch {
          logInfo("Interactive input not available, using defaults");
          break;
        }
      }
    }
  }

  // Generate environment file content
  const envContent = generateEnvironmentFile(config, finalVars);

  // Write environment file
  logInfo(`Writing environment file to ${options.outputPath}`);
  await Deno.writeTextFile(options.outputPath, envContent);

  // Set appropriate file permissions (Unix philosophy: secure by default)
  try {
    await Deno.chmod(options.outputPath, 0o600); // rw------- (owner only)
    logSuccess("Set secure file permissions (600)");
  } catch {
    logWarning("Could not set file permissions - ensure file is properly secured");
  }

  // Final validation
  const newVars = await loadExistingEnvironment(options.outputPath);
  const finalValidation = validateEnvironment(config, newVars);

  if (finalValidation.valid) {
    logSuccess(`Environment file created successfully: ${options.outputPath}`);

    if (options.verbose) {
      console.log(`\n${Colors.CYAN}Configuration Summary:${Colors.RESET}`);
      for (const [key, variable] of Object.entries(config.variables)) {
        const value = newVars[key];
        const displayValue = variable.sensitive ? '***HIDDEN***' : value;
        const status = value ? '✓' : '✗';
        console.log(`  ${status} ${key}: ${displayValue}`);
      }
    }

    logInfo(`Environment: ${config.name} (${config.description})`);
    logInfo(`Variables: ${Object.keys(config.variables).length} configured`);

  } else {
    logError("Final validation failed:");
    for (const error of finalValidation.errors) {
      console.log(`  ${Colors.RED}✗${Colors.RESET} ${error}`);
    }
    throw new Error("Environment setup failed validation");
  }
}

// Main execution function
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["validate-only", "interactive", "verbose", "help"],
    string: ["env", "output", "template"],
    default: {
      env: "development",
      output: "./.env",
      template: "./config/environment-template.json",
      "validate-only": false,
      interactive: false,
      verbose: false
    },
    alias: {
      e: "env",
      o: "output",
      t: "template",
      v: "verbose",
      i: "interactive",
      h: "help"
    }
  });

  if (args.help) {
    console.log(`
Deno Genesis Environment Setup Utility

USAGE:
  deno run --allow-read --allow-write --allow-env setup-env.ts [OPTIONS]

OPTIONS:
  -e, --env ENV          Environment type (development|production|testing)
  -o, --output FILE      Output file path (default: ./.env)
  -t, --template FILE    Custom template file path
  -i, --interactive      Interactive mode for missing values
  -v, --verbose          Enable verbose logging
      --validate-only    Only validate existing environment
  -h, --help             Show this help message

EXAMPLES:
  # Setup development environment
  deno run --allow-read --allow-write --allow-env setup-env.ts

  # Setup production environment with custom output
  deno run --allow-read --allow-write --allow-env setup-env.ts -e production -o .env.prod

  # Interactive setup
  deno run --allow-read --allow-write --allow-env setup-env.ts -e production -i

  # Validate existing environment
  deno run --allow-read --allow-write --allow-env setup-env.ts --validate-only

AVAILABLE ENVIRONMENTS:
  - development: Local development with debug settings
  - production:  Production-ready with security settings
  - testing:     Optimized for automated testing
    `);
    Deno.exit(0);
  }

  const options: SetupOptions = {
    environment: args.env,
    validateOnly: args["validate-only"],
    interactive: args.interactive,
    outputPath: args.output,
    templatePath: args.template,
    verbose: args.verbose
  };

  if (options.verbose) {
    logInfo(`Environment: ${options.environment}`);
    logInfo(`Output: ${options.outputPath}`);
    logInfo(`Template: ${options.templatePath}`);
    logInfo(`Interactive: ${options.interactive}`);
    logInfo(`Validate only: ${options.validateOnly}`);
  }

  await setupEnvironment(options);
}

// Unix philosophy: Explicit error handling and exit codes
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Environment setup failed: ${error.message}`);
    if (Deno.args.includes("--verbose") || Deno.args.includes("-v")) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}
