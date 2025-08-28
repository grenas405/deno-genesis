 
// controllers/notificationsController.ts ─ v1.0  
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";  
import {  
  createNotification,  
  getNotificationHistory,  
} from "../services/notificationsService.ts";  
  
/** POST /api/notifications/broadcast */  
export async function broadcastNotification(ctx: Context) {  
  try {  
    const { message, type } = await ctx.request.body({ type: "json" }).value;  
  
    if (!message || !type) {  
      ctx.response.status = 400;  
      ctx.response.body = { error: "Missing message or type." };  
      return;  
    }  
  
    const record = await createNotification(message, type, true);  
  
    if (!record) {  
      ctx.response.status = 500;  
      ctx.response.body = { error: "Failed to store notification." };  
      return;  
    }  
  
    ctx.response.status = 200;  
    ctx.response.body = { success: true, notification: record };  
  } catch (err) {  
    console.error("❌ Broadcast error:", err);  
    ctx.response.status = 500;  
    ctx.response.body = { error: "Internal server error." };  
  }  
}  
  
/** GET /api/notifications/history?limit=30 */  
export async function fetchNotificationHistory(ctx: Context) {  
  try {  
    const limit = Number(ctx.request.url.searchParams.get("limit") ?? 20);  
    const history = await getNotificationHistory(Math.min(limit, 100));  
    ctx.response.status = 200;  
    ctx.response.body = history;  
  } catch (err) {  
    console.error("❌ Fetch history error:", err);  
    ctx.response.status = 500;  
    ctx.response.body = { error: "Unable to fetch notification history." };  
  }  
}