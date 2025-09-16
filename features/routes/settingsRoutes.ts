import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  getSiteSettings,
  updateSiteSettings,
} from "../controllers/settingsController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

// === ROUTES ===

// 🔓 Public: Get site settings
router.get("/", getSiteSettings);

// 🔒 Admin: Update site settings
router.post("/", verifyAdminToken, updateSiteSettings);

export default router;