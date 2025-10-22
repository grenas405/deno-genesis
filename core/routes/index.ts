import { Router, send } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { ConsoleStyler } from "../utils/consoleStyler.ts";
import {
  BUILD_DATE,
  DENO_ENV,
  frameworkConfig,
  SITE_KEY,
  VERSION,
} from "../config/env.ts";

// === Modular Route Imports ===
import authRoutes from "../../../features/routes/authRoutes.ts";
import appointmentRoutes from "../../../features/routes/appointmentRoutes.ts";
import aiAssistantRoutes from "../../../features/routes/aiAssistantRoutes.ts";
import contactRoutes from "../../../features/routes/contactRoutes.ts";

// === Initialize Router ===
const router = new Router();

ConsoleStyler.logSection("🗂️ DenoGenesis Route Registry", "blue");
ConsoleStyler.logInfo(`Framework Version: ${VERSION}`);
ConsoleStyler.logInfo(`Environment: ${DENO_ENV}`);
ConsoleStyler.logInfo(`Site Key: ${SITE_KEY}`);

// === Serve Static Homepage ===
router.get("/", async (ctx) => {
  try {
    await send(ctx, "/public/pages/home/index.html", {
      root: Deno.cwd(),
      index: "index.html",
    });
    ConsoleStyler.logSuccess("✅ Homepage served successfully");
  } catch (error) {
    ConsoleStyler.logError(`❌ Homepage error: ${error.message}`);
  }
});

// === Active Feature Routes ===
const routeRegistrations = [
  {
    path: "/api/auth",
    routes: authRoutes.routes(),
    methods: authRoutes.allowedMethods(),
    description: "Authentication & authorization endpoints",
  },
  {
    path: "/api/appointments",
    routes: appointmentRoutes.routes(),
    methods: appointmentRoutes.allowedMethods(),
    description: "Appointment booking and management",
  },
  {
    path: "/api/ai-assistant",
    routes: aiAssistantRoutes.routes(),
    methods: aiAssistantRoutes.allowedMethods(),
    description: "AI assistant chat and automation",
  },
  {
    path: "/api/contact",
    routes: contactRoutes.routes(),
    methods: contactRoutes.allowedMethods(),
    description: "Contact form and communication",
  },
];

// === Register Routes ===
ConsoleStyler.logSection("📡 Registering API Routes", "cyan");

let totalRoutes = 0;
for (const reg of routeRegistrations) {
  router.use(reg.path, reg.routes, reg.methods);
  ConsoleStyler.logRoute(reg.path, reg.description);
  totalRoutes++;
}

ConsoleStyler.logSuccess(`✅ Registered ${totalRoutes} active API groups`);
ConsoleStyler.logSection("✨ Framework Ready", "green");
ConsoleStyler.logInfo(`${frameworkConfig.description} ${VERSION}`);

// === Add Framework Metadata Headers ===
router.use(async (ctx, next) => {
  const start = performance.now();
  await next();
  const duration = performance.now() - start;

  ctx.response.headers.set("X-DenoGenesis-Version", VERSION);
  ctx.response.headers.set("X-Response-Time", `${duration.toFixed(2)}ms`);
});

// === Export ===
export default router;

export const frameworkInfo = {
  name: "DenoGenesis",
  version: VERSION,
  environment: DENO_ENV,
  siteKey: SITE_KEY,
  activeRoutes: totalRoutes,
  features: ["auth", "appointments", "contact", "ai-assistant"],
};
