import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  broadcastNotification,
  fetchNotificationHistory,
} from "../controllers/notificationsController.ts";

const notificationsRoutes = new Router();

notificationsRoutes
  .post("/broadcast", broadcastNotification)   // 🔒 can add auth middleware
  .get("/history", fetchNotificationHistory);  // ✅ public or protected

export default notificationsRoutes;
