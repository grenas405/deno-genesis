// controllers/frontendController.ts
// ============================================
// 🎨 DenoGenesis Frontend Controller
// ============================================
// ✅ Handles frontend page serving with proper security
// ✅ Clean controller functions for router mapping
// ✅ Follows thin router → fat controller pattern
// ✅ Oak framework Context (ctx) handling
// ============================================

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ConsoleStyler } from "../mod.ts";

// ================================================================================
// 🎨 FRONTEND PAGE CONTROLLERS - DenoGenesis patterns
// ================================================================================

/**
 * Serve Home Page - Root route handler
 * Maps to: public/pages/home/index.html
 */
export const serveHome = async (ctx: Context) => {
  try {
    await send(ctx, "/pages/home/index.html", {
      root: "public",
      index: false, // Serve exact file
    });

    ConsoleStyler.logInfo("🏠 Served home page: /");
  } catch (error) {
    ConsoleStyler.logError(`❌ Home page serving failed: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error - Home page unavailable";
  }
};

/**
 * Serve About Page
 * Maps to: public/pages/about/about.html
 */
export const serveAbout = async (ctx: Context) => {
  try {
    await send(ctx, "/pages/about/about.html", {
      root: "public",
      index: false,
    });

    ConsoleStyler.logInfo("📄 Served about page: /about");
  } catch (error) {
    ConsoleStyler.logError(`❌ About page serving failed: ${error.message}`);
    ctx.response.status = 404;
    ctx.response.body = "About page not found";
  }
};

/**
 * Serve Services Page
 * Maps to: public/pages/services/services.html
 */
export const serveServices = async (ctx: Context) => {
  try {
    await send(ctx, "/pages/services/services.html", {
      root: "public",
      index: false,
    });

    ConsoleStyler.logInfo("🛠️ Served services page: /services");
  } catch (error) {
    ConsoleStyler.logError(`❌ Services page serving failed: ${error.message}`);
    ctx.response.status = 404;
    ctx.response.body = "Services page not found";
  }
};

/**
 * Serve Contact Page
 * Maps to: public/pages/contact/contact.html
 */
export const serveContact = async (ctx: Context) => {
  try {
    await send(ctx, "/pages/contact/contact.html", {
      root: "public",
      index: false,
    });

    ConsoleStyler.logInfo("📞 Served contact page: /contact");
  } catch (error) {
    ConsoleStyler.logError(`❌ Contact page serving failed: ${error.message}`);
    ctx.response.status = 404;
    ctx.response.body = "Contact page not found";
  }
};

/**
 * Serve Admin Login Page
 * Maps to: public/pages/admin/admin-login.html
 */
export const serveAdminLogin = async (ctx: Context) => {
  try {
    await send(ctx, "/pages/admin/admin-login.html", {
      root: "public",
      index: false,
    });

    ConsoleStyler.logInfo("🔐 Served admin login page: /admin/login");
  } catch (error) {
    ConsoleStyler.logError(
      `❌ Admin login page serving failed: ${error.message}`,
    );
    ctx.response.status = 404;
    ctx.response.body = "Admin login page not found";
  }
};

/**
 * Serve Create Admin Page - Only available on fresh installation
 * Maps to: public/pages/admin/create-admin.html
 * Security: Should be disabled after first admin is created
 */
export const serveCreateAdmin = async (ctx: Context) => {
  try {
    // TODO: Add check for existing admin users
    // If admin exists, redirect to login or show error
    // const adminExists = await AdminService.checkIfAdminExists();
    // if (adminExists) {
    //   ctx.response.status = 403;
    //   ctx.response.body = "Admin setup already completed";
    //   return;
    // }

    await send(ctx, "/pages/admin/create-admin.html", {
      root: "public",
      index: false,
    });

    ConsoleStyler.logInfo("👨‍💼 Served create admin page: /admin/create");
  } catch (error) {
    ConsoleStyler.logError(
      `❌ Create admin page serving failed: ${error.message}`,
    );
    ctx.response.status = 404;
    ctx.response.body = "Create admin page not found";
  }
};

/**
 * Handle 404 Not Found - Fallback controller
 * Serves custom 404 page or generic error
 */
export const serve404 = async (ctx: Context) => {
  try {
    // Try to serve custom 404 page
    await send(ctx, "/pages/error/404.html", {
      root: "public",
      index: false,
    });

    ctx.response.status = 404;
    ConsoleStyler.logWarning(`⚠️ Served 404 page: ${ctx.request.url.pathname}`);
  } catch (error) {
    // Fallback to plain text if no 404.html exists
    ctx.response.status = 404;
    ctx.response.headers.set("Content-Type", "text/html");
    ctx.response.body = `
      <!DOCTYPE html>
      <html>
        <head><title>404 - Page Not Found</title></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
          <a href="/">← Back to Home</a>
        </body>
      </html>
    `;

    ConsoleStyler.logWarning(
      `⚠️ Served fallback 404: ${ctx.request.url.pathname}`,
    );
  }
};
