// utils/authKey.ts
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

const env = await config();
const JWT_SECRET = env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not defined in .env");
}

const encoder = new TextEncoder();
export const jwtKey = await crypto.subtle.importKey(
  "raw",
  encoder.encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);