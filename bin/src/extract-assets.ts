#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * CSS and JavaScript Asset Extraction Utility
 *
 * Unix Philosophy Implementation:
 * 1. Do One Thing Well: Extracts embedded CSS/JS from HTML files
 * 2. Make Everything a Filter: Transforms HTML input to separated assets
 * 3. Avoid Captive UIs: Returns structured data for programmatic use
 * 4. Store Data in Flat Text Files: Works with plain text HTML/CSS/JS
 * 5. Leverage Software Leverage: Composable with other Unix tools
 *
 * Usage:
 *   extract-assets <html-file>
 *
 * Example:
 *   extract-assetst index.html
 *
 * Permissions Required:
 *   --allow-read: Read the source HTML file
 *   --allow-write: Create assets/ directory and write CSS/JS files
 *
 * Output:
 *   - assets/css/main.css (extracted CSS)
 *   - assets/js/main.js (extracted JavaScript)
 *
 * @module extract-assets
 * @author Pedro M. Dominguez
 * @version 1.0.0
 * @license AGPL-3.0
 */

// =============================================================================
// TYPE DEFINITIONS - Explicit Contracts
// =============================================================================

/**
 * Result of the extraction operation
 */
interface ExtractionResult {
  success: boolean;
  cssPath: string | null;
  jsPath: string | null;
  stats: ExtractionStats;
  errors: string[];
}

/**
 * Statistics about extracted content
 */
interface ExtractionStats {
  cssBytes: number;
  jsBytes: number;
  cssBlocks: number;
  jsBlocks: number;
}

/**
 * Extracted content with metadata
 */
interface ExtractedContent {
  content: string;
  blockCount: number;
  byteCount: number;
}

// =============================================================================
// CORE EXTRACTION FUNCTIONS - Pure, Testable Logic
// =============================================================================

/**
 * Extract all CSS from HTML <style> tags
 *
 * Matches all <style> tags regardless of attributes and extracts their content.
 * Preserves multiple style blocks by separating them with comments.
 *
 * @param html - The HTML content to parse
 * @returns Extracted CSS content with statistics
 *
 * @example
 * ```typescript
 * const html = '<style>body { margin: 0; }</style>';
 * const result = extractCSS(html);
 * console.log(result.content); // "body { margin: 0; }"
 * console.log(result.blockCount); // 1
 * ```
 */
function extractCSS(html: string): ExtractedContent {
  const cssBlocks: string[] = [];

  // Regular expression to match <style> tags with any attributes
  // [\s\S]*? does non-greedy match of any characters including newlines
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;

  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const cssContent = match[1].trim();
    if (cssContent.length > 0) {
      cssBlocks.push(cssContent);
    }
  }

  // Join blocks with separator comments for debugging
  const combinedCSS = cssBlocks.join(
    "\n\n/* ===== Next Style Block ===== */\n\n",
  );

  return {
    content: combinedCSS,
    blockCount: cssBlocks.length,
    byteCount: new TextEncoder().encode(combinedCSS).length,
  };
}

/**
 * Extract all inline JavaScript from HTML <script> tags
 *
 * Matches <script> tags WITHOUT src attribute (inline scripts only).
 * External scripts (with src) are intentionally ignored.
 * Preserves multiple script blocks by separating them with comments.
 *
 * @param html - The HTML content to parse
 * @returns Extracted JavaScript content with statistics
 *
 * @example
 * ```typescript
 * const html = '<script>console.log("Hello");</script>';
 * const result = extractJS(html);
 * console.log(result.content); // "console.log("Hello");"
 * console.log(result.blockCount); // 1
 * ```
 */
function extractJS(html: string): ExtractedContent {
  const jsBlocks: string[] = [];

  // Regular expression to match <script> tags WITHOUT src attribute
  // (?![^>]*\bsrc=) is negative lookahead to exclude external scripts
  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const jsContent = match[1].trim();
    if (jsContent.length > 0) {
      jsBlocks.push(jsContent);
    }
  }

  // Join blocks with separator comments for debugging
  const combinedJS = jsBlocks.join("\n\n// ===== Next Script Block =====\n\n");

  return {
    content: combinedJS,
    blockCount: jsBlocks.length,
    byteCount: new TextEncoder().encode(combinedJS).length,
  };
}

// =============================================================================
// FILE SYSTEM OPERATIONS - Side Effects Isolated
// =============================================================================

/**
 * Ensure asset directories exist
 *
 * Creates the following structure if it doesn't exist:
 * - assets/
 *   - css/
 *   - js/
 *
 * Uses recursive flag so it's idempotent (won't fail if dirs exist).
 *
 * @throws {Deno.errors.PermissionDenied} If write permission is denied
 */
async function ensureDirectories(): Promise<void> {
  await Deno.mkdir("assets/css", { recursive: true });
  await Deno.mkdir("assets/js", { recursive: true });
}

/**
 * Write extracted assets to files
 *
 * Creates:
 * - assets/css/main.css with extracted CSS
 * - assets/js/main.js with extracted JavaScript
 *
 * @param css - CSS content to write
 * @param js - JavaScript content to write
 * @returns Result object with file paths and statistics
 *
 * @throws {Deno.errors.PermissionDenied} If write permission is denied
 */
async function writeAssets(
  css: string,
  js: string,
): Promise<ExtractionResult> {
  await ensureDirectories();

  const cssPath = "assets/css/main.css";
  const jsPath = "assets/js/main.js";

  // Write CSS file
  await Deno.writeTextFile(cssPath, css);

  // Write JS file
  await Deno.writeTextFile(jsPath, js);

  // Calculate final statistics
  const cssBytes = new TextEncoder().encode(css).length;
  const jsBytes = new TextEncoder().encode(js).length;

  return {
    success: true,
    cssPath,
    jsPath,
    stats: {
      cssBytes,
      jsBytes,
      cssBlocks: countBlocks(css, "/* ===== Next Style Block ===== */"),
      jsBlocks: countBlocks(js, "// ===== Next Script Block ====="),
    },
    errors: [],
  };
}

/**
 * Count the number of blocks in content by separator
 *
 * @param content - The content to analyze
 * @param separator - The separator string between blocks
 * @returns Number of blocks (minimum 1 if content exists)
 */
function countBlocks(content: string, separator: string): number {
  if (content.length === 0) return 0;
  return content.split(separator).length;
}

// =============================================================================
// MAIN EXTRACTION ORCHESTRATION
// =============================================================================

/**
 * Main extraction function that orchestrates the entire process
 *
 * Process flow:
 * 1. Read HTML file from disk
 * 2. Extract CSS from <style> tags
 * 3. Extract JS from inline <script> tags
 * 4. Write extracted content to assets/ directory
 * 5. Return structured result with statistics
 *
 * @param htmlPath - Path to the HTML file to process
 * @returns Extraction result with success status, paths, and statistics
 *
 * @example
 * ```typescript
 * const result = await extractAssets('index.html');
 * if (result.success) {
 *   console.log(`CSS written to: ${result.cssPath}`);
 *   console.log(`JS written to: ${result.jsPath}`);
 * }
 * ```
 */
async function extractAssets(htmlPath: string): Promise<ExtractionResult> {
  try {
    // Step 1: Read the HTML file
    const html = await Deno.readTextFile(htmlPath);

    // Validate that we have actual content
    if (html.trim().length === 0) {
      return {
        success: false,
        cssPath: null,
        jsPath: null,
        stats: { cssBytes: 0, jsBytes: 0, cssBlocks: 0, jsBlocks: 0 },
        errors: ["HTML file is empty"],
      };
    }

    // Step 2: Extract CSS content
    const cssResult = extractCSS(html);

    // Step 3: Extract JavaScript content
    const jsResult = extractJS(html);

    // Step 4: Write assets to disk
    const result = await writeAssets(cssResult.content, jsResult.content);

    return result;
  } catch (error) {
    // Handle errors gracefully with informative messages
    return handleError(error, htmlPath);
  }
}

// =============================================================================
// ERROR HANDLING - Graceful Degradation
// =============================================================================

/**
 * Handle errors and return structured error result
 *
 * Categorizes errors and provides helpful suggestions for resolution.
 *
 * @param error - The error that occurred
 * @param htmlPath - Path to the HTML file being processed
 * @returns ExtractionResult with error details
 */
function handleError(error: unknown, htmlPath: string): ExtractionResult {
  let errorMessage: string;

  if (error instanceof Deno.errors.NotFound) {
    errorMessage = `File not found: ${htmlPath}
💡 Suggestion: Check that the file exists and the path is correct`;
  } else if (error instanceof Deno.errors.PermissionDenied) {
    errorMessage = `Permission denied accessing: ${htmlPath}
💡 Suggestion: Run with --allow-read and --allow-write permissions:
   deno run --allow-read --allow-write extract-assets.ts ${htmlPath}`;
  } else if (error instanceof Error) {
    errorMessage = `Error: ${error.message}`;
  } else {
    errorMessage = "Unknown error occurred during extraction";
  }

  return {
    success: false,
    cssPath: null,
    jsPath: null,
    stats: { cssBytes: 0, jsBytes: 0, cssBlocks: 0, jsBlocks: 0 },
    errors: [errorMessage],
  };
}

// =============================================================================
// CLI INTERFACE - User Interaction
// =============================================================================

/**
 * Display usage information
 */
function displayUsage(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║          CSS & JavaScript Asset Extraction Utility v1.0.0                 ║
║                                                                            ║
║  Extracts embedded CSS and JavaScript from HTML files into separate       ║
║  asset files following Unix Philosophy principles.                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

📖 USAGE:
   extract-assets <html-file>

📝 EXAMPLE:
   deno run --allow-read --allow-write extract-assets.ts index.html

🔒 REQUIRED PERMISSIONS:
   --allow-read   : Read the source HTML file
   --allow-write  : Create assets/ directory and write CSS/JS files

📤 OUTPUT:
   assets/css/main.css  : Extracted CSS from <style> tags
   assets/js/main.js    : Extracted JavaScript from inline <script> tags

📚 MORE INFO:
   - External scripts (<script src="...">) are intentionally ignored
   - Multiple <style> blocks are combined with separator comments
   - Multiple inline <script> blocks are combined with separator comments
   - Output files overwrite existing files at the same paths

💻 AUTHOR:
   Pedro M. Dominguez
   
📄 LICENSE:
   AGPL-3.0
  `);
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "2.3 KB")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Display success result to user
 *
 * @param result - The successful extraction result
 */
function displaySuccess(result: ExtractionResult): void {
  console.log(`
✅ Assets extracted successfully!

📄 CSS Output:
   Path:   ${result.cssPath}
   Size:   ${formatBytes(result.stats.cssBytes)}
   Blocks: ${result.stats.cssBlocks}

📄 JavaScript Output:
   Path:   ${result.jsPath}
   Size:   ${formatBytes(result.stats.jsBytes)}
   Blocks: ${result.stats.jsBlocks}

💡 Next Steps:
   1. Review the extracted files in the assets/ directory
   2. Update your HTML to reference the external files:
      <link rel="stylesheet" href="assets/css/main.css">
      <script src="assets/js/main.js"></script>
   3. Remove the inline <style> and <script> tags from your HTML
  `);
}

/**
 * Display error result to user
 *
 * @param result - The failed extraction result
 */
function displayError(result: ExtractionResult): void {
  console.log(`
❌ Extraction failed!

`);
  result.errors.forEach((error) => {
    console.log(`   ${error}\n`);
  });
}

// =============================================================================
// CLI ENTRY POINT - Main Execution
// =============================================================================

/**
 * Main CLI execution function
 *
 * Handles argument parsing, validation, and orchestrates the extraction.
 * Always exits with appropriate status code.
 */
async function main(): Promise<void> {
  // Parse command line arguments (skip first two: deno and script path)
  const args = Deno.args;

  // Check for help flag
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    displayUsage();
    Deno.exit(0);
  }

  // Get HTML file path from first argument
  const htmlPath = args[0];

  // Validate file path
  if (!htmlPath.endsWith(".html") && !htmlPath.endsWith(".htm")) {
    console.log(`
⚠️  Warning: File does not have .html or .htm extension
    File: ${htmlPath}
    
    Continuing anyway...
    `);
  }

  console.log(`
🔍 Processing: ${htmlPath}
   Extracting CSS and JavaScript assets...
  `);

  // Execute extraction
  const result = await extractAssets(htmlPath);

  // Display results
  if (result.success) {
    displaySuccess(result);
    Deno.exit(0);
  } else {
    displayError(result);
    Deno.exit(1);
  }
}

// =============================================================================
// EXPORTS - For Programmatic Use
// =============================================================================

// Export functions for use as a module
export {
  extractAssets,
  extractCSS,
  type ExtractedContent,
  type ExtractionResult,
  type ExtractionStats,
  extractJS,
};

// =============================================================================
// EXECUTION - Run if called as script
// =============================================================================

// Only run main() if this file is executed directly (not imported)
if (import.meta.main) {
  main();
}
