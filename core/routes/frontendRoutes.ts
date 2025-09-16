// routes/frontendRoutes.ts
// ============================================
// 🎨 DenoGenesis Frontend Routes
// ============================================
// ✅ Thin router - only maps routes to controllers
// ✅ No business logic, middleware, or framework headers
// ✅ Clean, declarative route registration
// ✅ Follows established DenoGenesis patterns
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  serve404,
  serveAbout,
  serveApp,
  serveContact,
  serveDashboard,
  serveGenericPage,
  serveHelp,
  serveLogin,
  serveSettings,
  serveSignup,
} from "../controllers/frontendController.ts";

// === Initialize Frontend Router ===
const router = new Router();

// ================================================================================
// 🎨 FRONTEND ROUTES - Thin router pattern
// ================================================================================
// Route priority: Most specific → Least specific
// Static routes first, then dynamic routes, finally fallbacks

// === CORE APP ROUTES ===
router.get("/", serveApp); // Main application
router.get("/app", serveApp); // Alternative app route
router.get("/home", serveApp); // Alternative home route

// === AUTH ROUTES ===
router.get("/login", serveLogin); // User login page
router.get("/signin", serveLogin); // Alternative login route
router.get("/signup", serveSignup); // User registration page
router.get("/register", serveSignup); // Alternative signup route

// === MAIN NAVIGATION ROUTES ===
router.get("/dashboard", serveDashboard); // User dashboard
router.get("/about", serveAbout); // About page
router.get("/contact", serveContact); // Contact page
router.get("/settings", serveSettings); // User settings
router.get("/profile", serveSettings); // Alternative settings route
router.get("/help", serveHelp); // Help/documentation
router.get("/docs", serveHelp); // Alternative help route
router.get("/support", serveHelp); // Alternative support route

// === DYNAMIC ROUTES ===
// Generic page handler for custom pages
// Must be after specific routes to avoid conflicts
router.get("/:page", serveGenericPage); // Dynamic page serving

// === FALLBACK ROUTES ===
// Catch-all for unmatched routes - must be last
router.get("/(.*)", serve404); // 404 handler

// ================================================================================
// 📊 ROUTER EXPORT
// ================================================================================

export default router;
