// =============================================================================
// CORRECT CONSOLESTYLER USAGE EXAMPLES
// =============================================================================

import { ConsoleStyler } from "./mod.ts";

// ✅ CORRECT: Static logging methods
ConsoleStyler.logInfo("🔧 Initializing Enterprise Middleware Stack...");
ConsoleStyler.logSuccess("✅ Framework loaded successfully!");
ConsoleStyler.logWarning("⚠️  Some optional features are disabled");
ConsoleStyler.logError("❌ Database connection failed");
ConsoleStyler.logDebug("🔍 Debug information");
ConsoleStyler.logCritical("🚨 Critical system error");

// ✅ CORRECT: Section headers and formatted output
ConsoleStyler.logSection("🚀 DENOGENESIS FRAMEWORK STARTUP", "cyan");
ConsoleStyler.logBanner("DenoGenesis Framework", "gold");

// ✅ CORRECT: Route logging
ConsoleStyler.logRoute("GET", "/api/users", "Fetch all users", 25.3);

// ✅ CORRECT: Feature announcements
ConsoleStyler.logFeature("WebSockets", "Real-time communication", "enabled");
ConsoleStyler.logFeature("Analytics", "Usage tracking", "disabled");

// ✅ CORRECT: Health checks
const healthData = {
  database: {
    status: 'healthy' as const,
    responseTime: 12.5,
    lastCheck: new Date(),
    details: 'Connection pool: 8/10 active'
  },
  redis: {
    status: 'degraded' as const,
    responseTime: 150.2,
    lastCheck: new Date(),
    details: 'High latency detected'
  }
};
ConsoleStyler.logHealthCheck(healthData);

// ✅ CORRECT: Performance metrics
const metrics = {
  successRate: "99.2",
  errorRate: 0.8,
  averageResponseTime: 45.6,
  totalRequests: 15420,
  peakMemoryUsage: "256 MB",
  uptime: "2d 14h 32m"
};
ConsoleStyler.logMetrics(metrics);

// ✅ CORRECT: Custom messages with icons and colors
ConsoleStyler.logCustom("Database migration completed", "🔄", "success");
ConsoleStyler.logCustom("Cache warming in progress", "🔥", "warning");

// ✅ CORRECT: Business events and integrations
ConsoleStyler.logBusinessEvent("Purchase", 299.99, "USD", { userId: "12345" });
ConsoleStyler.logIntegration("Stripe", "connected", "API v2024-06-20");

// ✅ CORRECT: Timestamped and categorized logging
ConsoleStyler.logTimestamped(
  "info",
  "User authentication successful",
  "req-abc123",
  "AUTH"
);

// ✅ CORRECT: Operation timing
const result = await ConsoleStyler.timeOperation(
  async () => {
    // Your async operation here
    await new Promise(resolve => setTimeout(resolve, 100));
    return "Operation complete";
  },
  "Database backup",
  "MAINTENANCE"
);

// =============================================================================
// COMMON PATTERNS FOR YOUR FRAMEWORK
// =============================================================================

// Startup sequence logging
ConsoleStyler.logSection("🚀 DENOGENESIS FRAMEWORK STARTUP", "cyan");
ConsoleStyler.logInfo(`📦 Version: ${VERSION}`);
ConsoleStyler.logInfo(`🏗️ Build: ${BUILD_HASH} (${BUILD_DATE})`);
ConsoleStyler.logInfo(`🌍 Environment: ${DENO_ENV}`);
ConsoleStyler.logInfo(`⚡ Deno: ${Deno.version.deno}`);

// Middleware initialization
ConsoleStyler.logInfo("🔧 Initializing Enterprise Middleware Stack...");
ConsoleStyler.logSuccess("✅ CORS middleware configured");
ConsoleStyler.logSuccess("✅ Static file serving enabled");
ConsoleStyler.logSuccess("✅ Request logging active");

// Database status
ConsoleStyler.logInfo("🗄️ Connecting to database...");
ConsoleStyler.logSuccess("✅ Database connection established");

// Route registration
ConsoleStyler.logInfo("🛣️ Registering application routes...");
ConsoleStyler.logSuccess(`✅ Registered ${apiRoutes.length} API route groups`);

// Server startup
ConsoleStyler.logSection("🌐 SERVER READY", "green");
ConsoleStyler.logInfo(`🚀 Server running on ${SERVER_HOST}:${PORT}`);
ConsoleStyler.logInfo(`🔗 Health check: http://${SERVER_HOST}:${PORT}/health`);

// Feature status display
ConsoleStyler.logFeature("WebSockets", "Real-time communication", "enabled");
ConsoleStyler.logFeature("Multi-tenant", "Multi-site support", "enabled");
ConsoleStyler.logFeature("Analytics", "Usage tracking", "disabled");
ConsoleStyler.logFeature("Notifications", "Push notifications", "enabled");

// Ready banner
ConsoleStyler.logBanner("Ready for Local-First Digital Sovereignty!", "gold");

// =============================================================================
// INCORRECT USAGE TO AVOID
// =============================================================================

// ❌ WRONG: These don't exist
// styler.info("message");
// ConsoleStyler.info("message");
// ConsoleStyler.log("message");

// ❌ WRONG: These are properties, not methods
// ConsoleStyler.colors.success("message");
// ConsoleStyler.bright("message");

// ❌ WRONG: Trying to instantiate the class
// const styler = new ConsoleStyler();
// styler.logInfo("message");