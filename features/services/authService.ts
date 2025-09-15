// /services/authService.ts
import { compare } from "https://deno.land/x/bcrypt/mod.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";
import { AuthModel } from "../models/authModel.ts";
import { jwtKey } from "../utils/authKey.ts";
import { SITE_KEY } from "../config/env.ts";
import { AuthLoginInput, AuthTokenPayload } from "../types/auth.d.ts";

export class AuthService {
  static async login(input: AuthLoginInput): Promise<string | null> {
    const user = await AuthModel.findAdminByUsername(input.username);
    if (!user) return null;

    const match = await compare(input.password, user.password_hash);
    if (!match) return null;

    const payload: AuthTokenPayload = {
      id: user.id,
      username: user.username,
      siteKey: SITE_KEY,
      exp: getNumericDate(60 * 60 * 24 * 7), // 7 days
    };

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, jwtKey);

    return token;
  }
}