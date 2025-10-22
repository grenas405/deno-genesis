// routes/masterRouter.ts
// =============================================================
// 🗂️ DenoGenesis Master Router (Minimal Boot Mode)
// =============================================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import frontendRoutes from "./frontendRoutes.ts";
import { ConsoleStyler } from "../utils/consoleStyler.ts"; // optional logging

const router = new Router();

ConsoleStyler?.logSection?.("🗂️ DenoGenesis Route Registry", "blue");
ConsoleStyler?.logInfo?.("Mode: Minimal - Only Homepage Active");

// === REGISTER FRONTEND ROUTES ===
router.use(frontendRoutes.routes());
router.use(frontendRoutes.allowedMethods());

// === FALLBACK HANDLER (optional) ===
router.all("/(.*)", (ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "404 | Page Not Found";
});

export default router;
