// tests/genesis-cli.test.ts

import { CLIAssertions, CLITestRunner, TestSuiteBuilder } from "../cli.ts";

// Create test configuration
const config = {
  target: {
    path: "./home/ubuntu/.local/src/deno-genesis/deno-genesis-cli/cli.ts",
    name: "genesis",
  },
  execution: {
    verbose: true,
    coverage: true,
  },
  environment: {
    permissions: ["--allow-read", "--allow-write", "--allow-run"],
  },
  output: {
    format: "pretty",
    colors: true,
    summary: true,
  },
};

// Build test suite
const suite = new TestSuiteBuilder()
  .name("Genesis CLI Test Suite")
  .description("Comprehensive tests for Deno Genesis CLI")
  // Setup/teardown
  .beforeAll(async () => {
    // Create test directory
    await Deno.mkdir("./test-workspace", { recursive: true });
  })
  .afterAll(async () => {
    // Cleanup
    await Deno.remove("./test-workspace", { recursive: true });
  })
  // Test help command
  .test({
    name: "Help command displays all subcommands",
    description: "Verify help output contains all required sections",
    command: ["--help"],
    expectedOutput: /CORE COMMANDS:/,
    expectedExitCode: 0,
  })
  // Test version command
  .test({
    name: "Version command shows version info",
    description: "Verify version output format",
    command: ["--version"],
    expectedOutput: /Deno Genesis CLI v\d+\.\d+\.\d+/,
    expectedExitCode: 0,
  })
  // Test init command
  .test({
    name: "Init command with project name",
    description: "Test project initialization",
    command: ["init", "test-project", "--dry-run"],
    expectedOutput: /Initializing Deno Genesis Project/,
    expectedExitCode: 0,
    env: {
      GENESIS_TEST_MODE: "true",
    },
  })
  // Test dev command
  .test({
    name: "Dev command help",
    description: "Test dev command help output",
    command: ["dev", "--help"],
    expectedOutput: /Start development server with hot reload/,
    expectedExitCode: 0,
  })
  // Test deploy command
  .test({
    name: "Deploy command validation",
    description: "Test deploy command with dry run",
    command: ["deploy", "example.com", "--dry-run"],
    expectedOutput: /Generating deployment configuration/,
    expectedExitCode: 0,
  })
  // Test invalid command
  .test({
    name: "Invalid command handling",
    description: "Test error handling for unknown commands",
    command: ["invalid-command"],
    expectedError: /Unknown command/,
    expectedExitCode: 1,
  })
  // Test permission boundaries
  .test({
    name: "Permission validation",
    description: "Test that CLI requests appropriate permissions",
    command: ["init", "test-project", "--verbose"],
    expectedOutput: /Required permissions/,
    expectedExitCode: 0,
    setup: async () => {
      // Ensure clean state
      await Deno.remove("./test-workspace/test-project", { recursive: true })
        .catch(() => {});
    },
  })
  .build();

// Run tests
const runner = new CLITestRunner(config);
const results = await runner.runSuite(suite);
runner.generateReport(results);
