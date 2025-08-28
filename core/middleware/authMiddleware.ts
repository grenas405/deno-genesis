// middleware/verifyAdminToken.ts
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { jwtKey } from "../utils/authKey.ts";

export async function verifyAdminToken(ctx: Context, next: () => Promise<unknown>) {
  const authHeader = ctx.request.headers.get("Authorization");
  console.log("[AUTH] Incoming header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized. No token provided." };
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verify(token, jwtKey, "HS256");
    console.log("[AUTH] Token verified:", payload);
    ctx.state.admin = payload;
    await next();
  } catch (error) {
    console.error("[AUTH] Token verification failed:", error.message);
    ctx.response.status = 403;
    ctx.response.body = { error: "Invalid or expired token." };
  }
}