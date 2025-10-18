// utils/authKey.ts
// ============================================================================
// 🔐 JWT Secret Key Management (Auto-Generate if Missing)
// ----------------------------------------------------------------------------
// This utility loads the JWT_SECRET from .env or generates one automatically
// if missing, then writes it back to the .env file for persistence.
// ============================================================================

import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

// Load or initialize environment variables
const env = await config();
let JWT_SECRET = env.JWT_SECRET;

// ============================================================================
// 🧩 Generate Secret if Missing
// ============================================================================
if (!JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not found in .env — generating a new one...");

  // Generate a secure random 256-bit (32-byte) secret and encode in base64
  const randomKey = crypto.getRandomValues(new Uint8Array(32));
  JWT_SECRET = btoa(String.fromCharCode(...randomKey));

  // Check if .env file exists, otherwise create it
  const envPath = ".env";
  let existingEnv = "";
  try {
    existingEnv = await Deno.readTextFile(envPath);
  } catch {
    console.log("🆕 No existing .env file found. Creating one...");
  }

  // Append or update JWT_SECRET in .env
  const updatedEnv = existingEnv.includes("JWT_SECRET=")
    ? existingEnv.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${JWT_SECRET}`)
    : `${existingEnv.trim()}\nJWT_SECRET=${JWT_SECRET}\n`;

  await Deno.writeTextFile(envPath, updatedEnv);
  console.log("✅ New JWT_SECRET generated and written to .env");
}

// ============================================================================
// 🔑 Import Key for Crypto Operations
// ============================================================================
const encoder = new TextEncoder();
export const jwtKey = await crypto.subtle.importKey(
  "raw",
  encoder.encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

// Optional: Export the secret for reference (non-production)
export { JWT_SECRET };