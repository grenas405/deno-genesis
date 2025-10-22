// routes/frontendRoutes.ts
// ============================================
// 🎨 DenoGenesis Frontend Routes
// ============================================
// ✅ Thin router - only maps routes to controllers
// ✅ Uses only exports from frontendController.ts
// ✅ Clean, declarative route registration
// ✅ Follows established DenoGenesis patterns
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  serve404,
  serveAbout,
  serveAdminLogin,
  serveContact,
  serveCreateAdmin,
  serveHome,
  serveServices,
} from "../controllers/frontendController.ts";

// === Initialize Frontend Router ===
const router = new Router();

// ================================================================================
// 🎨 FRONTEND ROUTES - Thin router pattern
// ================================================================================
// Route priority: Most specific → Least specific
// Static routes first, then admin routes, finally fallbacks
// core/routes/frontendRoutes.ts
router
  .get("", serveHome) // was "/"
  .get("about", serveAbout) // was "/about"
  .get("services", serveServices)
  .get("contact", serveContact)
  .get("admin/login", serveAdminLogin)
  .get("admin/create", serveCreateAdmin)
  .get("(.*)", serve404); // catch-all

// ================================================================================
// 📊 ROUTER EXPORT
// ================================================================================

export default router;
