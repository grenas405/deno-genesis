#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * CLI Test Utility
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Test CLI commands comprehensively
 * - Accept text input: Test specifications and configurations
 * - Produce text output: Structured test results and coverage
 * - Filter and transform: Execute tests → produce reports
 * - Composable: Integrates with CI/CD pipelines
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  basename,
  dirname,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/mod.ts";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface CLITestConfig {
  // Test target configuration
  target: {
    path: string; // Path to CLI file
    name?: string; // CLI name (defaults to filename)
    mainCommand?: string; // Main executable command
  };

  // Test execution configuration
  execution: {
    timeout?: number; // Timeout per test (ms)
    retries?: number; // Number of retries on failure
    parallel?: boolean; // Run tests in parallel
    coverage?: boolean; // Enable coverage collection
    verbose?: boolean; // Verbose output
  };

  // Environment configuration
  environment: {
    vars?: Record<string, string>; // Environment variables
    cwd?: string; // Working directory
    permissions?: string[]; // Deno permissions to test
  };

  // Output configuration
  output: {
    format?: "tap" | "json" | "pretty" | "junit";
    file?: string; // Output file path
    colors?: boolean; // Colored output
    summary?: boolean; // Show summary
  };
}

interface CommandTest {
  name: string;
  description: string;
  command: string[];
  input?: string;
  expectedOutput?: string | RegExp;
  expectedError?: string | RegExp;
  expectedExitCode?: number;
  timeout?: number;
  env?: Record<string, string>;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

interface TestSuite {
  name: string;
  description: string;
  beforeAll?: () => Promise<void>;
  afterAll?: () => Promise<void>;
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
  tests: CommandTest[];
}

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: Error;
  output?: string;
  exitCode?: number;
}

// ============================================================================
// CORE TEST ENGINE
// ============================================================================

class CLITestRunner {
  private config: CLITestConfig;
  private results: TestResult[] = [];

  constructor(config: CLITestConfig) {
    this.config = this.validateConfig(config);
  }

  /**
   * Validate and normalize configuration
   */
  private validateConfig(config: CLITestConfig): CLITestConfig {
    // Ensure target path exists
    if (!config.target?.path) {
      throw new Error("Target CLI path is required");
    }

    // Set defaults
    return {
      target: {
        ...config.target,
        name: config.target.name || basename(config.target.path, ".ts"),
      },
      execution: {
        timeout: 30000,
        retries: 0,
        parallel: false,
        coverage: false,
        verbose: false,
        ...config.execution,
      },
      environment: {
        vars: {},
        cwd: Deno.cwd(),
        permissions: [],
        ...config.environment,
      },
      output: {
        format: "pretty",
        colors: true,
        summary: true,
        ...config.output,
      },
    };
  }

  /**
   * Run a single command test
   */
  async runCommandTest(test: CommandTest): Promise<TestResult> {
    const startTime = performance.now();
    const result: TestResult = {
      name: test.name,
      passed: false,
      duration: 0,
    };

    try {
      // Setup phase
      if (test.setup) {
        await test.setup();
      }

      // Build command
      const cmd = [
        Deno.execPath(),
        "run",
        ...this.buildPermissions(),
        this.config.target.path,
        ...test.command,
      ];

      // Execute command
      const process = new Deno.Command(cmd[0], {
        args: cmd.slice(1),
        cwd: this.config.environment.cwd,
        env: {
          ...this.config.environment.vars,
          ...test.env,
        },
        stdin: test.input ? "piped" : "null",
        stdout: "piped",
        stderr: "piped",
      });

      const child = process.spawn();

      // Provide input if needed
      if (test.input) {
        const writer = child.stdin.getWriter();
        await writer.write(new TextEncoder().encode(test.input));
        await writer.close();
      }

      // Set timeout
      const timeoutId = setTimeout(() => {
        child.kill();
      }, test.timeout || this.config.execution.timeout);

      // Wait for completion
      const output = await child.output();
      clearTimeout(timeoutId);

      // Decode output
      const stdout = new TextDecoder().decode(output.stdout);
      const stderr = new TextDecoder().decode(output.stderr);
      const fullOutput = stdout + stderr;

      result.output = fullOutput;
      result.exitCode = output.code;

      // Validate output
      if (test.expectedOutput !== undefined) {
        if (test.expectedOutput instanceof RegExp) {
          assert(
            test.expectedOutput.test(stdout),
            `Output does not match pattern: ${test.expectedOutput}`,
          );
        } else {
          assertStringIncludes(stdout, test.expectedOutput);
        }
      }

      // Validate error output
      if (test.expectedError !== undefined) {
        if (test.expectedError instanceof RegExp) {
          assert(
            test.expectedError.test(stderr),
            `Error output does not match pattern: ${test.expectedError}`,
          );
        } else {
          assertStringIncludes(stderr, test.expectedError);
        }
      }

      // Validate exit code
      if (test.expectedExitCode !== undefined) {
        assertEquals(
          output.code,
          test.expectedExitCode,
          `Exit code mismatch: expected ${test.expectedExitCode}, got ${output.code}`,
        );
      }

      result.passed = true;
    } catch (error) {
      result.error = error;
      result.passed = false;
    } finally {
      // Teardown phase
      if (test.teardown) {
        await test.teardown();
      }

      result.duration = performance.now() - startTime;
    }

    return result;
  }

  /**
   * Build permission flags from config
   */
  private buildPermissions(): string[] {
    const perms: string[] = [];

    // Default permissions for testing
    perms.push("--allow-read");
    perms.push("--allow-env");

    // Add configured permissions
    for (const perm of this.config.environment.permissions || []) {
      if (!perms.includes(perm)) {
        perms.push(perm);
      }
    }

    return perms;
  }

  /**
   * Run a test suite
   */
  async runSuite(suite: TestSuite): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      // Suite setup
      if (suite.beforeAll) {
        await suite.beforeAll();
      }

      // Run tests
      for (const test of suite.tests) {
        // Test setup
        if (suite.beforeEach) {
          await suite.beforeEach();
        }

        // Run test with retries
        let result: TestResult | null = null;
        let attempts = 0;
        const maxAttempts = this.config.execution.retries! + 1;

        while (attempts < maxAttempts) {
          result = await this.runCommandTest(test);
          attempts++;

          if (result.passed || attempts >= maxAttempts) {
            break;
          }

          // Log retry
          if (this.config.execution.verbose) {
            console.log(
              `Retrying test "${test.name}" (attempt ${
                attempts + 1
              }/${maxAttempts})`,
            );
          }
        }

        results.push(result!);

        // Test teardown
        if (suite.afterEach) {
          await suite.afterEach();
        }
      }
    } finally {
      // Suite teardown
      if (suite.afterAll) {
        await suite.afterAll();
      }
    }

    return results;
  }

  /**
   * Generate test report
   */
  generateReport(results: TestResult[]): void {
    const reporter = new TestReporter(this.config.output);
    reporter.report(results);
  }
}

// ============================================================================
// TEST ASSERTIONS
// ============================================================================

class CLIAssertions {
  /**
   * Assert command executes successfully
   */
  static async assertCommandSuccess(
    cliPath: string,
    args: string[],
    options?: { timeout?: number; env?: Record<string, string> },
  ): Promise<void> {
    const result = await executeCommand(cliPath, args, options);
    assertEquals(result.code, 0, "Command should exit with code 0");
  }

  /**
   * Assert command fails with specific exit code
   */
  static async assertCommandFailure(
    cliPath: string,
    args: string[],
    expectedCode: number,
    options?: { timeout?: number; env?: Record<string, string> },
  ): Promise<void> {
    const result = await executeCommand(cliPath, args, options);
    assertEquals(
      result.code,
      expectedCode,
      `Command should exit with code ${expectedCode}`,
    );
  }

  /**
   * Assert command output contains text
   */
  static async assertOutputContains(
    cliPath: string,
    args: string[],
    expected: string,
    options?: { timeout?: number; env?: Record<string, string> },
  ): Promise<void> {
    const result = await executeCommand(cliPath, args, options);
    const output = new TextDecoder().decode(result.stdout);
    assertStringIncludes(output, expected);
  }

  /**
   * Assert command produces valid JSON
   */
  static async assertJSONOutput(
    cliPath: string,
    args: string[],
    validator?: (json: any) => void,
    options?: { timeout?: number; env?: Record<string, string> },
  ): Promise<void> {
    const result = await executeCommand(cliPath, args, options);
    const output = new TextDecoder().decode(result.stdout);

    let json: any;
    try {
      json = JSON.parse(output);
    } catch {
      throw new Error("Output is not valid JSON");
    }

    if (validator) {
      validator(json);
    }
  }

  /**
   * Assert help text contains required sections
   */
  static async assertHelpText(
    cliPath: string,
    requiredSections: string[],
  ): Promise<void> {
    const result = await executeCommand(cliPath, ["--help"]);
    const output = new TextDecoder().decode(result.stdout);

    for (const section of requiredSections) {
      assertStringIncludes(
        output.toLowerCase(),
        section.toLowerCase(),
        `Help text missing section: ${section}`,
      );
    }
  }
}

// ============================================================================
// MOCK FACTORIES
// ============================================================================

class CLIMocks {
  /**
   * Create mock filesystem
   */
  static createMockFS(): MockFileSystem {
    return new MockFileSystem();
  }

  /**
   * Create mock stdin
   */
  static createMockStdin(inputs: string[]): MockStdin {
    return new MockStdin(inputs);
  }

  /**
   * Create mock environment
   */
  static createMockEnv(vars: Record<string, string>): MockEnvironment {
    return new MockEnvironment(vars);
  }
}

class MockFileSystem {
  private files = new Map<string, string>();

  addFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  async setup(): Promise<void> {
    for (const [path, content] of this.files) {
      await Deno.mkdir(dirname(path), { recursive: true });
      await Deno.writeTextFile(path, content);
    }
  }

  async cleanup(): Promise<void> {
    for (const path of this.files.keys()) {
      try {
        await Deno.remove(path);
      } catch {
        // Ignore errors
      }
    }
  }
}

class MockStdin {
  private inputs: string[];
  private index = 0;

  constructor(inputs: string[]) {
    this.inputs = inputs;
  }

  getNext(): string {
    if (this.index >= this.inputs.length) {
      throw new Error("No more inputs available");
    }
    return this.inputs[this.index++];
  }

  reset(): void {
    this.index = 0;
  }
}

class MockEnvironment {
  private original: Record<string, string> = {};

  constructor(private vars: Record<string, string>) {}

  setup(): void {
    for (const [key, value] of Object.entries(this.vars)) {
      this.original[key] = Deno.env.get(key) || "";
      Deno.env.set(key, value);
    }
  }

  cleanup(): void {
    for (const key of Object.keys(this.vars)) {
      if (this.original[key]) {
        Deno.env.set(key, this.original[key]);
      } else {
        Deno.env.delete(key);
      }
    }
  }
}

// ============================================================================
// TEST REPORTERS
// ============================================================================

class TestReporter {
  constructor(private config: any) {}

  report(results: TestResult[]): void {
    switch (this.config.format) {
      case "tap":
        this.reportTAP(results);
        break;
      case "json":
        this.reportJSON(results);
        break;
      case "junit":
        this.reportJUnit(results);
        break;
      default:
        this.reportPretty(results);
    }

    if (this.config.summary) {
      this.printSummary(results);
    }
  }

  private reportPretty(results: TestResult[]): void {
    const colors = this.config.colors ? COLORS : NO_COLORS;

    for (const result of results) {
      const status = result.passed
        ? `${colors.green}✓${colors.reset}`
        : `${colors.red}✗${colors.reset}`;

      const duration = `${colors.dim}(${
        result.duration.toFixed(2)
      }ms)${colors.reset}`;

      console.log(`${status} ${result.name} ${duration}`);

      if (!result.passed && result.error) {
        console.log(
          `  ${colors.red}Error: ${result.error.message}${colors.reset}`,
        );
        if (this.config.verbose) {
          console.log(`  ${colors.dim}${result.error.stack}${colors.reset}`);
        }
      }

      if (this.config.verbose && result.output) {
        console.log(`  Output:\n${indent(result.output, 4)}`);
      }
    }
  }

  private reportTAP(results: TestResult[]): void {
    console.log(`TAP version 13`);
    console.log(`1..${results.length}`);

    results.forEach((result, index) => {
      if (result.passed) {
        console.log(`ok ${index + 1} - ${result.name}`);
      } else {
        console.log(`not ok ${index + 1} - ${result.name}`);
        if (result.error) {
          console.log(`  ---`);
          console.log(`  message: ${result.error.message}`);
          console.log(`  ...`);
        }
      }
    });
  }

  private reportJSON(results: TestResult[]): void {
    const output = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        name: r.name,
        passed: r.passed,
        duration: r.duration,
        error: r.error
          ? {
            message: r.error.message,
            stack: r.error.stack,
          }
          : undefined,
        output: r.output,
        exitCode: r.exitCode,
      })),
      summary: this.generateSummary(results),
    };

    if (this.config.file) {
      Deno.writeTextFileSync(this.config.file, JSON.stringify(output, null, 2));
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
  }

  private reportJUnit(results: TestResult[]): void {
    const xml = this.generateJUnitXML(results);

    if (this.config.file) {
      Deno.writeTextFileSync(this.config.file, xml);
    } else {
      console.log(xml);
    }
  }

  private generateJUnitXML(results: TestResult[]): string {
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0) / 1000;
    const failures = results.filter((r) => !r.passed).length;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml +=
      `<testsuites name="CLI Tests" tests="${results.length}" failures="${failures}" time="${
        totalTime.toFixed(3)
      }">\n`;
    xml +=
      `  <testsuite name="CLI Test Suite" tests="${results.length}" failures="${failures}" time="${
        totalTime.toFixed(3)
      }">\n`;

    for (const result of results) {
      xml += `    <testcase name="${result.name}" time="${
        (result.duration / 1000).toFixed(3)
      }">\n`;

      if (!result.passed && result.error) {
        xml += `      <failure message="${escapeXML(result.error.message)}">\n`;
        xml += `        ${escapeXML(result.error.stack || "")}\n`;
        xml += `      </failure>\n`;
      }

      if (result.output) {
        xml += `      <system-out>${escapeXML(result.output)}</system-out>\n`;
      }

      xml += `    </testcase>\n`;
    }

    xml += `  </testsuite>\n`;
    xml += `</testsuites>\n`;

    return xml;
  }

  private printSummary(results: TestResult[]): void {
    const colors = this.config.colors ? COLORS : NO_COLORS;
    const summary = this.generateSummary(results);

    console.log("\n" + "=".repeat(60));
    console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
    console.log("=".repeat(60));

    console.log(`Total:   ${summary.total}`);
    console.log(`${colors.green}Passed:  ${summary.passed}${colors.reset}`);
    console.log(`${colors.red}Failed:  ${summary.failed}${colors.reset}`);
    console.log(`Duration: ${summary.duration.toFixed(2)}ms`);

    if (summary.failed === 0) {
      console.log(
        `\n${colors.green}${colors.bright}✅ All tests passed!${colors.reset}`,
      );
    } else {
      console.log(
        `\n${colors.red}${colors.bright}❌ ${summary.failed} test(s) failed${colors.reset}`,
      );
    }
  }

  private generateSummary(results: TestResult[]) {
    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function executeCommand(
  cliPath: string,
  args: string[],
  options?: { timeout?: number; env?: Record<string, string> },
): Promise<Deno.CommandOutput> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-all", cliPath, ...args],
    env: options?.env,
    stdout: "piped",
    stderr: "piped",
  });

  const child = cmd.spawn();

  if (options?.timeout) {
    const timeoutId = setTimeout(() => child.kill(), options.timeout);
    const output = await child.output();
    clearTimeout(timeoutId);
    return output;
  }

  return await child.output();
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function indent(text: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return text.split("\n").map((line) => padding + line).join("\n");
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Color definitions
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const NO_COLORS = {
  reset: "",
  bright: "",
  dim: "",
  red: "",
  green: "",
  yellow: "",
  cyan: "",
};

// ============================================================================
// TEST SUITE BUILDER
// ============================================================================

class TestSuiteBuilder {
  private suite: TestSuite = {
    name: "",
    description: "",
    tests: [],
  };

  name(name: string): this {
    this.suite.name = name;
    return this;
  }

  description(desc: string): this {
    this.suite.description = desc;
    return this;
  }

  beforeAll(fn: () => Promise<void>): this {
    this.suite.beforeAll = fn;
    return this;
  }

  afterAll(fn: () => Promise<void>): this {
    this.suite.afterAll = fn;
    return this;
  }

  beforeEach(fn: () => Promise<void>): this {
    this.suite.beforeEach = fn;
    return this;
  }

  afterEach(fn: () => Promise<void>): this {
    this.suite.afterEach = fn;
    return this;
  }

  test(test: CommandTest): this {
    this.suite.tests.push(test);
    return this;
  }

  build(): TestSuite {
    return this.suite;
  }
}

// ============================================================================
// EXPORT PUBLIC API
// ============================================================================

export {
  CLIAssertions,
  CLIMocks,
  CLITestRunner,
  TestReporter,
  TestSuiteBuilder,
};

export type { CLITestConfig, CommandTest, TestResult, TestSuite };

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (import.meta.main) {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
CLI Test Utility - Test CLI commands comprehensively

USAGE:
  cli-test.ts <cli-path> [options]

OPTIONS:
  --config <path>      Path to test configuration file
  --suite <path>       Path to test suite file
  --timeout <ms>       Timeout per test (default: 30000)
  --parallel          Run tests in parallel
  --coverage          Enable coverage collection
  --format <type>     Output format: tap, json, junit, pretty
  --output <path>     Write results to file
  --verbose           Verbose output
  --help, -h          Show this help message

EXAMPLES:
  # Run tests for a CLI
  cli-test.ts ./my-cli.ts

  # Run with configuration
  cli-test.ts ./my-cli.ts --config test.config.ts

  # Generate JUnit report
  cli-test.ts ./my-cli.ts --format junit --output results.xml

  # Run tests in parallel with coverage
  cli-test.ts ./my-cli.ts --parallel --coverage
`);
    Deno.exit(0);
  }

  // Parse arguments and run tests
  const cliPath = args[0];
  if (!cliPath) {
    console.error("Error: CLI path required");
    Deno.exit(1);
  }

  // Load configuration
  const config: CLITestConfig = {
    target: { path: cliPath },
    execution: {
      parallel: args.includes("--parallel"),
      coverage: args.includes("--coverage"),
      verbose: args.includes("--verbose"),
    },
    environment: {},
    output: {
      format: "pretty",
    },
  };

  // Run tests
  const runner = new CLITestRunner(config);
  console.log("Starting CLI tests...\n");

  // Example test suite (replace with actual tests)
  const suite = new TestSuiteBuilder()
    .name("CLI Basic Tests")
    .description("Test basic CLI functionality")
    .test({
      name: "Help command",
      description: "Test help output",
      command: ["--help"],
      expectedExitCode: 0,
    })
    .test({
      name: "Version command",
      description: "Test version output",
      command: ["--version"],
      expectedExitCode: 0,
    })
    .build();

  const results = await runner.runSuite(suite);
  runner.generateReport(results);

  // Exit with appropriate code
  const failed = results.filter((r) => !r.passed).length;
  Deno.exit(failed > 0 ? 1 : 0);
}
