// controllers/pageController.ts
// ============================================
// 📄 DenoGenesis Static Page Controller
// ============================================
// ✅ Handles static page serving with proper security
// ✅ Clean controller functions for router mapping
// ✅ Follows thin router → fat controller pattern
// ✅ Deno-compatible with Oak framework
// ============================================

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { ConsoleStyler } from "../mod.ts";

// ================================================================================
// 📱 STATIC PAGE CONTROLLERS - following DenoGenesis patterns
// ================================================================================

/**
 * Serve Homepage - Root route handler
 * Maps to: public/pages/home/index.html
 */
export const serveHomepage = async (ctx: Context) => {
  try {
    // Serve the homepage file - security headers handled by middleware
    await send(ctx, "/pages/home/index.html", {
      root: "public",
      index: false // We're specifying the exact file
    });
    
    ConsoleStyler.logInfo("🏠 Served homepage: /");
    
  } catch (error) {
    ConsoleStyler.logError(`❌ Homepage serving failed: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error - Homepage unavailable";
  }
};

/**
 * Serve About Page
 * Maps to: public/pages/about/about.html
 */
export const serveAbout = async (ctx: Context) => {
  try {
    // Serve the about page file - security headers handled by middleware
    await send(ctx, "/pages/about/about.html", {
      root: "public",
      index: false
    });
    
    ConsoleStyler.logInfo("📄 Served about page: /about");
    
  } catch (error) {
    ConsoleStyler.logError(`❌ About page serving failed: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error - About page unavailable";
  }
};

/**
 * Serve Contact Page
 * Maps to: public/pages/contact/contact.html
 */
export const serveContact = async (ctx: Context) => {
  try {
    // Serve the contact page file - security headers handled by middleware
    await send(ctx, "/pages/contact/contact.html", {
      root: "public",
      index: false
    });
    
    ConsoleStyler.logInfo("📞 Served contact page: /contact");
    
  } catch (error) {
    ConsoleStyler.logError(`❌ Contact page serving failed: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error - Contact page unavailable";
  }
};

/**
 * Serve Services Page
 * Maps to: public/pages/services/services.html
 */
export const serveServices = async (ctx: Context) => {
  try {
    // Serve the services page file - security headers handled by middleware
    await send(ctx, "/pages/services/services.html", {
      root: "public",
      index: false
    });
    
    ConsoleStyler.logInfo("🛠️ Served services page: /services");
    
  } catch (error) {
    ConsoleStyler.logError(`❌ Services page serving failed: ${error.message}`);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error - Services page unavailable";
  }
};

/**
 * Health Check Endpoint
 * System route for monitoring and uptime checks
 */
export const serveHealth = async (ctx: Context) => {
  try {
    // Simple health check response
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "DenoGenesis Static Pages",
      uptime: Math.floor(performance.now() / 1000), // seconds since start
      environment: Deno.env.get("DENO_ENV") || "development"
    };
    
    ctx.response.status = 200;
    ctx.response.body = healthData;
    
    // Only log in development to avoid log spam
    if (Deno.env.get("DENO_ENV") === "development") {
      ConsoleStyler.logInfo("💚 Health check requested");
    }
    
  } catch (error) {
    ConsoleStyler.logError(`❌ Health check failed: ${error.message}`);
    ctx.response.status = 503; // Service Unavailable
    ctx.response.body = {
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 404 Not Found Handler
 * Catch-all for unmatched routes - should be registered last
 */
export const serve404 = async (ctx: Context) => {
  try {
    // Check if this is an API route that should return JSON
    const isApiRoute = ctx.request.url.pathname.startsWith('/api/');
    
    if (isApiRoute) {
      // JSON 404 for API routes
      ctx.response.headers.set('Content-Type', 'application/json; charset=utf-8');
      ctx.response.status = 404;
      ctx.response.body = {
        error: "API endpoint not found",
        path: ctx.request.url.pathname,
        method: ctx.request.method,
        timestamp: new Date().toISOString()
      };
    } else {
      // Try to serve a custom 404.html page first
      try {
        ctx.response.headers.set('Content-Type', 'text/html; charset=utf-8');
        ctx.response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
        
        // Try to serve custom 404 page
        await send(ctx, "/pages/error/404.html", {
          root: "public",
          index: false
        });
        
        ctx.response.status = 404;
        
      } catch (fileError) {
        // Fall back to simple HTML if no custom 404 page exists
        ctx.response.status = 404;
        ctx.response.headers.set('Content-Type', 'text/html; charset=utf-8');
        ctx.response.body = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Page Not Found</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 2rem; background: #f5f5f5; }
              .container { max-width: 600px; margin: 4rem auto; text-align: center; background: white; padding: 3rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #d32f2f; margin-bottom: 1rem; }
              p { color: #666; margin-bottom: 2rem; }
              a { color: #1976d2; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <p><a href="/">← Back to Homepage</a></p>
            </div>
          </body>
          </html>
        `;
      }
    }
    
    ConsoleStyler.logWarning(`🚫 404 Not Found: ${ctx.request.method} ${ctx.request.url.pathname}`);
    
  } catch (error) {
    ConsoleStyler.logError(`❌ 404 handler failed: ${error.message}`);
    
    // Last resort fallback
    ctx.response.status = 404;
    ctx.response.headers.set('Content-Type', 'text/plain; charset=utf-8');
    ctx.response.body = "404 - Page Not Found";
  }
};

// ================================================================================
// 🔧 UTILITY FUNCTIONS (simplified since middleware handles headers)
// ================================================================================

/**
 * Generic static page server function
 * Can be used to create additional page controllers easily
 */
export const createStaticPageController = (filePath: string, pageName: string) => {
  return async (ctx: Context) => {
    try {
      // Serve the file - middleware handles all headers and security
      await send(ctx, filePath, {
        root: "public",
        index: false
      });
      
      ConsoleStyler.logInfo(`📄 Served ${pageName}: ${ctx.request.url.pathname}`);
      
    } catch (error) {
      ConsoleStyler.logError(`❌ ${pageName} serving failed: ${error.message}`);
      ctx.response.status = 500;
      ctx.response.body = `Internal Server Error - ${pageName} unavailable`;
    }
  };
};