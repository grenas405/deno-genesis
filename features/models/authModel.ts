// /models/authModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { AdminUserRecord } from "../types/auth.d.ts";

export class AuthModel {
  static async findAdminByUsername(username: string): Promise<AdminUserRecord | null> {
    const result = await db.query(
      "SELECT id, username, password_hash, site_key FROM admin_users WHERE username = ? AND site_key = ?",
      [username, SITE_KEY],
    );

    if (result.length === 0) return null;

    return result[0] as AdminUserRecord;
  }
}
