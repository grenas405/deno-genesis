// notificationsModel.ts → v1.2 → Includes site_key from env.ts

import { db } from "../config/db.ts";
import { SITE_KEY } from "../config/env.ts"; // ✅ import site key from env

// 📦 Notification Type Interface
export interface Notification {
  id: number;
  site_key: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
  created_at: string;
}

// 🎯 Insert a new notification
export async function insertNotification(
  message: string,
  type: Notification["type"]
): Promise<boolean> {
  const createdAt = new Date().toISOString();

  try {
    await db.query(
      `INSERT INTO notifications (site_key, message, type)
       VALUES (?, ?, ?)`,
      [SITE_KEY, message, type] // ✅ include site_key
    );
    return true;
  } catch (error) {
    console.error("❌ insertNotification failed:", error);
    return false;
  }
}

// 📥 Get recent notifications (per site)
export async function fetchRecentNotifications(
  limit = 20
): Promise<Notification[]> {
  try {
    const results = await db.query(
      `SELECT id, site_key, message, type, created_at
       FROM notifications
       WHERE site_key = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [SITE_KEY, limit]
    );

    return results.map(
      (row: [number, string, string, Notification["type"], string]) => ({
        id: row[0],
        site_key: row[1],
        message: row[2],
        type: row[3],
        created_at: row[4],
      })
    );
  } catch (error) {
    console.error("❌ fetchRecentNotifications failed:", error);
    return [];
  }
}
