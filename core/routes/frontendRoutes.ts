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

// === CORE APP ROUTES ===
router.get("", serveHome); // Home page (pages/home/index.html)

// === MAIN NAVIGATION ROUTES ===
router.get("/about", serveAbout); // About page (pages/about/about.html)
router.get("/services", serveServices); // Services page (pages/services/services.html)
router.get("/contact", serveContact); // Contact page (pages/contact/contact.html)

// === ADMIN ROUTES ===
router.get("/admin/login", serveAdminLogin); // Admin login (pages/admin/admin-login.html)
router.get("/admin/create", serveCreateAdmin); // Create admin (pages/admin/create-admin.html)

// === FALLBACK ROUTES ===
// Catch-all for unmatched routes - must be last
router.get("/(.*)", serve404); // 404 handler (pages/error/404.html)

// ================================================================================
// 📊 ROUTER EXPORT
// ================================================================================

export default router;
