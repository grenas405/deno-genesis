// routes/index.ts
// ============================================
// 🗂️ Main Router Registry for Deno Genesis 
// Enhanced with Professional Console Styling
// ============================================
// ✅ Each module is self-contained: controller, service, model, types
// ✅ Keep this clean — new features should plug in without clutter
// ✅ Professional startup logging with ConsoleStyler integration
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/send.ts";

// Framework imports - Using centralized mod.ts
import { 
  ConsoleStyler, 
  DENO_ENV, 
  VERSION, 
  BUILD_DATE 
} from "../mod.ts";

// === Modular Route Imports ===
import authRoutes from "./authRoutes.ts";
import appointmentRoutes from "./appointmentRoutes.ts";
import contactRoutes from "./contactRoutes.ts";
import dashboardRoutes from "./dashboardRoutes.ts";

// === Initialize Master Router ===
const router = new Router();

// === Professional Route Registry Startup ===
ConsoleStyler.logSection('🗂️ DenoGenesis Route Registry', 'blue');

// === Serve Static Homepage ===
router.get("/", async (ctx) => {
  try {
    await send(ctx, "/public/pages/home/index.html", {
      root: Deno.cwd(),
      index: "index.html",
    });
  } catch (error) {
    ConsoleStyler.logError(`Homepage serving failed: ${error.message}`);
    throw error;
  }
});

// === Route Registration Configuration ===
const routeRegistrations = [
  { path: "/api/auth", router: authRoutes, description: "Authentication & authorization" },
  { path: "/api/appointments", router: appointmentRoutes, description: "Appointment management" },
  { path: "/api/contact", router: contactRoutes, description: "Contact form processing" },
  { path: "/api/dashboard", router: dashboardRoutes, description: "Dashboard data endpoints" },
];

// === Register Routes ===
let totalRoutes = 0;
routeRegistrations.forEach((registration) => {
  try {
    router.use(registration.path, registration.router.routes(), registration.router.allowedMethods());
    ConsoleStyler.logRoute(registration.path, registration.description);
    totalRoutes++;
  } catch (error) {
    ConsoleStyler.logError(`Failed to register ${registration.path}: ${error.message}`);
    throw error;
  }
});

// === Framework Middleware ===
router.use(async (ctx, next) => {
  // Framework identification headers
  ctx.response.headers.set('X-DenoGenesis-Version', VERSION);
  ctx.response.headers.set('X-Framework', 'DenoGenesis');
  ctx.response.headers.set('X-Local-First', 'Validated');
  ctx.response.headers.set('X-Build-Date', BUILD_DATE);

  // Performance timing
  const startTime = performance.now();
  await next();
  const responseTime = performance.now() - startTime;
  ctx.response.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);

  // Development logging
  if (DENO_ENV === "development") {
    const method = ctx.request.method;
    const url = ctx.request.url.pathname;
    const status = ctx.response.status;
    
    ConsoleStyler.logCustom(
      `${method} ${url} - ${status} (${responseTime.toFixed(2)}ms)`,
      responseTime < 10 ? "⚡" : responseTime < 50 ? "📊" : "⚠️",
      responseTime < 10 ? "success" : responseTime < 50 ? "info" : "warning"
    );
  }
});

// === Registration Summary ===
ConsoleStyler.logSuccess(`Successfully registered ${totalRoutes} API route groups`);

// === Framework Status ===
if (DENO_ENV === "development") {
  ConsoleStyler.logCustom("Development mode - Enhanced debugging enabled", "🛠️", "warning");
} else {
  ConsoleStyler.logCustom("Production mode - Performance optimized", "🚀", "success");
}

// === Export Router ===
export default router;

// === Export Framework Metadata ===
export const frameworkInfo = {
  name: "DenoGenesis",
  version: VERSION,
  buildDate: BUILD_DATE,
  environment: DENO_ENV,
  routeCount: totalRoutes,
  localFirstValidated: true,
  features: {
    multiTenant: true,
    realTimeSync: true,
    performanceMonitoring: true,
    businessSovereignty: true,
    developerAccessibility: true
  }
};