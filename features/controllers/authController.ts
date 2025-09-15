// /controllers/authController.ts
import { Context } from "https://deno.land/x/oak/mod.ts";
import { AuthService } from "../services/authService.ts";

export async function authLogin(ctx: Context): Promise<void> {
  try {
    if (!ctx.request.hasBody) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Request body is required" };
      return;
    }

    const body = ctx.request.body({ type: "json" });
    const value = await body.value;

    const username = value.username;
    const password = value.password;

    if (typeof username !== "string" || typeof password !== "string") {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: "Username and password are required" };
      return;
    }

    const token = await AuthService.login({ username, password });

    if (!token) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: "Invalid username or password" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: "Authentication successful",
      token,
    };
  } catch (err) {
    console.error("authLogin: Error:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { success: false, message: "Internal server error" };
  }
}