// /config/env.ts
// ================================================================================
// 🚀 DenoGenesis Framework - Environment Configuration
// Centralized environment variable management with interactive fallback
// ================================================================================

import { config as loadEnv } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load environment variables
const env = await loadEnv();
const envPath = ".env";

// ================================================================================
// 📦 INTERACTIVE PROMPT FOR MISSING VARIABLES
// ================================================================================

/**
 * Prompt user for input in the terminal.
 */
async function promptInput(message: string, hidden = false): Promise<string> {
  if (hidden) {
    const { readKeypress } = await import("https://deno.land/x/keypress@0.0.11/mod.ts");
    let input = "";
    console.log(`${message} (input hidden):`);
    for await (const keypress of readKeypress()) {
      if (keypress.key === "return") break;
      if (keypress.key === "backspace") {
        input = input.slice(0, -1);
      } else if (keypress.key && keypress.key.length === 1) {
        input += keypress.key;
      }
    }
    console.log();
    return input.trim();
  } else {
    const buf = new Uint8Array(1024);
    await Deno.stdout.write(new TextEncoder().encode(`${message}: `));
    const n = <number>await Deno.stdin.read(buf);
    return new TextDecoder().decode(buf.subarray(0, n)).trim();
  }
}

/**
 * Prompt user for any missing required environment variables and persist them.
 */
async function ensureEnvVariables(requiredVars: string[], env: Record<string, string>) {
  const missingVars: Record<string, string> = {};
  const sensitiveKeys = ["PASSWORD", "SECRET", "API_KEY"];

  for (const key of requiredVars) {
    if (!env[key]) {
      const hidden = sensitiveKeys.some(s => key.includes(s));
      const value = await promptInput(`⚙️  Enter value for ${key}`, hidden);
      missingVars[key] = value;
      env[key] = value;
    }
  }

  if (Object.keys(missingVars).length > 0) {
    let existingEnv = "";
    try {
      existingEnv = await Deno.readTextFile(envPath);
    } catch {
      console.warn("📝 .env file not found — creating a new one...");
    }

    const newEntries = Object.entries(missingVars)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const updatedContent = existingEnv.trim()
      ? `${existingEnv.trim()}\n${newEntries}\n`
      : `${newEntries}\n`;

    await Deno.writeTextFile(envPath, updatedContent);
    console.log("✅ Missing environment variables added to .env file.\n");
  }
}

// ================================================================================
// 🌍 REQUIRED VARIABLES & VALIDATION
// ================================================================================

const requiredVars = ['SITE_KEY', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
await ensureEnvVariables(requiredVars, env);

// ================================================================================
// 📊 LOAD VERSION FILE
// (Same implementation as before)
// ================================================================================

interface VersionInfo {
  version: string;
  buildDate: string;
  buildHash?: string;
}

async function getVersionInfo(): Promise<VersionInfo> {
  try {
    const versionContent = await Deno.readTextFile("./VERSION");
    const lines = versionContent.trim().split('\n');
    const version = lines[0]?.trim() || "v1.0.0-development";
    const buildDateLine = lines.find(l => l.includes("Build Date:"));
    const hashLine = lines.find(l => l.includes("Git Hash:"));
    const buildDate = buildDateLine
      ? buildDateLine.replace("Build Date:", "").trim()
      : new Date().toISOString();
    const buildHash = hashLine?.replace("Git Hash:", "").trim();
    return { version, buildDate, buildHash };
  } catch {
    return { version: "v1.0.0-development", buildDate: new Date().toISOString() };
  }
}

const versionInfo = await getVersionInfo();

// ================================================================================
// 💾 EXPORT ENVIRONMENT CONFIGURATION
// ================================================================================

export const VERSION = versionInfo.version;
export const BUILD_DATE = versionInfo.buildDate;
export const BUILD_HASH = versionInfo.buildHash;

export const SITE_KEY = env.SITE_KEY;
export const DB_HOST = env.DB_HOST;
export const DB_USER = env.DB_USER;
export const DB_PASSWORD = env.DB_PASSWORD;
export const DB_NAME = env.DB_NAME;
export const DENO_ENV = env.DENO_ENV || "development";
export const PORT = parseInt(env.PORT || "3000");

// ================================================================================
// ✅ LOG ENV STATUS
// ================================================================================

console.log(`🌍 Environment Loaded`);
console.log(`   Version: ${VERSION}`);
console.log(`   Site Key: ${SITE_KEY}`);
console.log(`   Database: ${DB_USER}@${DB_HOST}/${DB_NAME}`);
console.log(`   Mode: ${DENO_ENV}`);
console.log(`   Port: ${PORT}`);