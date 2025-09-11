// routes/pageRoutes.ts
// ============================================
// 📄 DenoGenesis Static Page Router
// ============================================
// ✅ Handles static page routes (homepage, about, etc.)
// ✅ Thin router - delegates to page controller
// ✅ Clean, declarative route registration
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { 
  serveHomepage, 
  serveAbout, 
  serveContact,
  serveServices,
  serve404,
  serveHealth
} from "../controllers/pageController.ts";
import { ConsoleStyler } from "../mod.ts";

// === Initialize Page Router ===
const router = new Router();

// === STATIC PAGE ROUTES ===

// 🏠 Homepage - Root route
router.get("/", serveHomepage);

// 📄 Static pages
router.get("/about", serveAbout);
router.get("/contact", serveContact);
router.get("/services", serveServices);

// 🔧 System routes
router.get("/health", serveHealth);

// 🚫 Catch-all for 404 - Must be last
router.get("/(.*)", serve404);

// === Startup Logging ===
ConsoleStyler.logSuccess("Static page routes registered: /, /about, /contact, /services, /health");

export default router;