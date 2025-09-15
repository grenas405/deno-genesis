import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getDashboardOverview } from "../controllers/dashboardController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

// === ROUTES ===

// 🔒 Admin: Get dashboard overview
router.get("/", verifyAdminToken, getDashboardOverview);

export default router;