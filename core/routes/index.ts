// routes/index.ts
// ============================================
// 🗂️ DenoGenesis Master Router
// ============================================
// ✅ Thin router - only maps routes to controllers
// ✅ No business logic, middleware, or framework headers
// ✅ Clean, declarative route registration
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ConsoleStyler } from "../mod.ts";

// Route module imports
//import pageRoutes from "./pageRoutes.ts";
import authRoutes from "./authRoutes.ts";
import appointmentRoutes from "./appointmentRoutes.ts";
import contactRoutes from "./contactRoutes.ts";
import dashboardRoutes from "./dashboardRoutes.ts";

// === Initialize Master Router ===
const router = new Router();

// === ROUTES - Thin router pattern ===

// Static pages (no prefix needed)
router.use(pageRoutes.routes(), pageRoutes.allowedMethods());

// API route registration - Clean, declarative mapping
const apiRoutes = [
  { path: "/api/auth", routes: authRoutes },
  { path: "/api/appointments", routes: appointmentRoutes },
  { path: "/api/contact", routes: contactRoutes },
  { path: "/api/dashboard", routes: dashboardRoutes },
] as const;

// Register API routes
apiRoutes.forEach(({ path, routes }) => {
  router.use(path, routes.routes(), routes.allowedMethods());
});

// === Startup Logging ===
ConsoleStyler.logSuccess(`Registered page routes + ${apiRoutes.length} API route groups`);

export default router;
