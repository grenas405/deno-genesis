import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getSiteAnalytics } from "../controllers/analyticsController.ts";

const router = new Router();

// === ROUTES ===
// 🔓 Public: Get site analytics
router.get("/", getSiteAnalytics);

export default router;