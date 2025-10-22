// routes/frontendRoutes.ts
// =============================================================
// 🧭 Minimal Frontend Router - Only Homepage
// =============================================================
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { serveHome } from "../controllers/frontendController.ts";

const router = new Router();

// === HOME PAGE ONLY ===
router.get("/", serveHome);

export default router;
