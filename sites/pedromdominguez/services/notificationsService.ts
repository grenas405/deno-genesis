// services/notificationsService.ts — v1.1 ✅
// High-level business logic for notifications

import { broadcast } from "./wsService.ts";
import {
  insertNotification,
  fetchRecentNotifications,
  Notification,
} from "../models/notificationsModel.ts";

/**
 * Create a new notification, optionally broadcast over WebSocket,
 * then return the stored record.
 */
export async function createNotification(
  message: string,
  type: Notification["type"],
  doBroadcast = true,
): Promise<Notification | null> {
  // 1️⃣ Insert notification in DB
  const ok = await insertNotification(message, type);
  if (!ok) return null;

  // 2️⃣ Fetch the latest record
  const [latest] = await fetchRecentNotifications(1);

  // 3️⃣ Broadcast over WebSocket — use JSON.stringify!
  if (doBroadcast && latest) {
    const payload = {
      message: latest.message,
      type: latest.type,
      id: latest.id,
      created_at: latest.created_at,
    };
    broadcast(payload); // ✅ Send the object — wsService will JSON.stringify it
  }

  return latest ?? null;
}

/**
 * Get the N most-recent notifications (default 20).
 */
export async function getNotificationHistory(
  limit = 20,
): Promise<Notification[]> {
  return await fetchRecentNotifications(limit);
}