// core/routes/index.ts
// ============================================
// 🗂️ DenoGenesis Master Router
// ============================================
// ✅ Thin router - only maps routes to controllers
// ✅ No business logic, middleware, or framework headers
// ✅ Clean, declarative route registration
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ConsoleStyler } from "../utils/consoleStyler.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/mod.ts";

import frontendRoutes from "./frontendRoutes.ts";
// Route module imports
// Import API routes from the /features directory
import authRoutes from "/../../features/routes/authRoutes.ts";
import appointmentRoutes from "../../../features/routes/appointmentRoutes.ts";
import contactRoutes from "../../../features/routes/contactRoutes.ts";
import dashboardRoutes from "../../../features/routes/dashboardRoutes.ts";

// === Initialize Master Router ===
const router = new Router();

// === ROUTES - Thin router pattern ===

// Frontend route registration
router.use("/", frontendRoutes.routes(), frontendRoutes.allowedMethods());

// In your router file
router.get("/", async (ctx) => {
  await send(ctx, "/pages/home/index.html", {
    root: `${Deno.cwd()}/public`,
  });
});

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
ConsoleStyler.logSuccess(
  `Registered  ${apiRoutes.length} API route groups`,
);

export default router;
