#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-net

/**
 * Deno Genesis Nginx Setup Utility
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Configure Nginx for Deno Genesis applications
 * - Accept text input: Domain names, SSL settings, app configurations
 * - Produce text output: Nginx config files, SSL setup scripts
 * - Filter and transform: App config → Nginx virtual host
 * - Composable: Works with SSL utilities, deployment scripts
 *
 * Usage:
 *   deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts --domain example.com
 *   deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts --domain example.com --ssl
 *   deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts --remove example.com
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists, ensureDir } from "https://deno.land/std@0.204.0/fs/mod.ts";
import { join, basename } from "https://deno.land/std@0.204.0/path/mod.ts";

// Configuration types
interface NginxSiteConfig {
  domain: string;
  subdomain?: string;
  port: number;
  ssl: boolean;
  sslCertPath?: string;
  sslKeyPath?: string;
  staticPath?: string;
  clientMaxBodySize?: string;
  accessLog?: boolean;
  errorLog?: boolean;
  gzipEnabled?: boolean;
  cacheEnabled?: boolean;
  securityHeaders?: boolean;
  rateLimiting?: boolean;
}

interface SetupOptions {
  domain: string;
  subdomain?: string;
  port: number;
  ssl: boolean;
  remove: boolean;
  enable: boolean;
  disable: boolean;
  testConfig: boolean;
  verbose: boolean;
  dryRun: boolean;
  configPath: string;
  sitesAvailable: string;
  sitesEnabled: string;
}

// ANSI color codes
const Colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
} as const;

// Unix-style logging functions
function logInfo(message: string): void {
  console.log(`${Colors.BLUE}[INFO]${Colors.RESET} ${message}`);
}

function logSuccess(message: string): void {
  console.log(`${Colors.GREEN}[SUCCESS]${Colors.RESET} ${message}`);
}

function logWarning(message: string): void {
  console.log(`${Colors.YELLOW}[WARNING]${Colors.RESET} ${message}`);
}

function logError(message: string): void {
  console.error(`${Colors.RED}[ERROR]${Colors.RESET} ${message}`);
}

function logHeader(message: string): void {
  const border = '='.repeat(50);
  console.log(`\n${Colors.CYAN}${border}`);
  console.log(`${Colors.BOLD}${Colors.CYAN} ${message}`);
  console.log(`${border}${Colors.RESET}\n`);
}

// Check if Nginx is installed and running
async function checkNginxInstalled(): Promise<boolean> {
  try {
    const command = new Deno.Command("nginx", {
      args: ["-v"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
}

async function checkNginxRunning(): Promise<boolean> {
  try {
    const command = new Deno.Command("systemctl", {
      args: ["is-active", "nginx"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
}

// Install Nginx if not present
async function installNginx(): Promise<boolean> {
  logHeader("Installing Nginx");

  try {
    logInfo("Updating package list...");
    const updateCmd = new Deno.Command("sudo", {
      args: ["apt", "update"],
      stdout: "inherit",
      stderr: "inherit",
    });
    await updateCmd.output();

    logInfo("Installing Nginx...");
    const installCmd = new Deno.Command("sudo", {
      args: ["apt", "install", "-y", "nginx"],
      stdout: "inherit",
      stderr: "inherit",
    });
    const { success } = await installCmd.output();

    if (!success) {
      logError("Failed to install Nginx");
      return false;
    }

    logInfo("Starting and enabling Nginx service...");
    const startCmd = new Deno.Command("sudo", {
      args: ["systemctl", "start", "nginx"],
    });
    await startCmd.output();

    const enableCmd = new Deno.Command("sudo", {
      args: ["systemctl", "enable", "nginx"],
    });
    await enableCmd.output();

    logSuccess("Nginx installation completed");
    return true;

  } catch (error) {
    logError(`Installation failed: ${error.message}`);
    return false;
  }
}

// Generate Nginx configuration for a site
function generateNginxConfig(config: NginxSiteConfig): string {
  const fullDomain = config.subdomain
    ? `${config.subdomain}.${config.domain}`
    : config.domain;

  const lines = [
    `# Deno Genesis Nginx Configuration`,
    `# Site: ${fullDomain}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Port: ${config.port}`,
    `# SSL: ${config.ssl ? 'enabled' : 'disabled'}`,
    ``,
  ];

  if (config.rateLimiting) {
    lines.push(
      `# Rate limiting zone`,
      `limit_req_zone $binary_remote_addr zone=${fullDomain.replace(/\./g, '_')}_limit:10m rate=10r/s;`,
      ``
    );
  }

  // HTTP server block (always present for redirects or non-SSL)
  lines.push(`server {`);
  lines.push(`    listen 80;`);
  lines.push(`    listen [::]:80;`);
  lines.push(`    server_name ${fullDomain} www.${fullDomain};`);

  if (config.ssl) {
    // Redirect HTTP to HTTPS
    lines.push(`    return 301 https://$server_name$request_uri;`);
    lines.push(`}`);
    lines.push(``);

    // HTTPS server block
    lines.push(`server {`);
    lines.push(`    listen 443 ssl http2;`);
    lines.push(`    listen [::]:443 ssl http2;`);
    lines.push(`    server_name ${fullDomain} www.${fullDomain};`);
    lines.push(``);

    // SSL configuration
    lines.push(`    # SSL Configuration`);
    lines.push(`    ssl_certificate ${config.sslCertPath || `/etc/letsencrypt/live/${fullDomain}/fullchain.pem`};`);
    lines.push(`    ssl_certificate_key ${config.sslKeyPath || `/etc/letsencrypt/live/${fullDomain}/privkey.pem`};`);
    lines.push(`    ssl_session_timeout 1d;`);
    lines.push(`    ssl_session_cache shared:MozTLS:10m;`);
    lines.push(`    ssl_session_tickets off;`);
    lines.push(``);

    lines.push(`    # Modern SSL configuration`);
    lines.push(`    ssl_protocols TLSv1.2 TLSv1.3;`);
    lines.push(`    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;`);
    lines.push(`    ssl_prefer_server_ciphers off;`);
    lines.push(``);

    // HSTS and security headers
    if (config.securityHeaders) {
      lines.push(`    # Security Headers`);
      lines.push(`    add_header Strict-Transport-Security "max-age=63072000" always;`);
      lines.push(`    add_header X-Content-Type-Options "nosniff" always;`);
      lines.push(`    add_header X-Frame-Options "DENY" always;`);
      lines.push(`    add_header X-XSS-Protection "1; mode=block" always;`);
      lines.push(`    add_header Referrer-Policy "no-referrer-when-downgrade" always;`);
      lines.push(`    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;`);
      lines.push(``);
    }
  }

  // Common server configuration
  lines.push(`    # Basic Configuration`);
  lines.push(`    root ${config.staticPath || '/var/www/html'};`);
  lines.push(`    index index.html index.htm;`);
  lines.push(`    client_max_body_size ${config.clientMaxBodySize || '10M'};`);
  lines.push(``);

  // Logging configuration
  if (config.accessLog) {
    lines.push(`    access_log /var/log/nginx/${fullDomain}.access.log;`);
  }
  if (config.errorLog) {
    lines.push(`    error_log /var/log/nginx/${fullDomain}.error.log;`);
  }
  lines.push(``);

  // Gzip configuration
  if (config.gzipEnabled) {
    lines.push(`    # Gzip Configuration`);
    lines.push(`    gzip on;`);
    lines.push(`    gzip_vary on;`);
    lines.push(`    gzip_min_length 1024;`);
    lines.push(`    gzip_proxied expired no-cache no-store private must-revalidate auth;`);
    lines.push(`    gzip_types`);
    lines.push(`        text/plain`);
    lines.push(`        text/css`);
    lines.push(`        text/xml`);
    lines.push(`        text/javascript`);
    lines.push(`        application/javascript`);
    lines.push(`        application/xml+rss`);
    lines.push(`        application/json;`);
    lines.push(``);
  }

  // Rate limiting
  if (config.rateLimiting) {
    lines.push(`    # Rate limiting`);
    lines.push(`    limit_req zone=${fullDomain.replace(/\./g, '_')}_limit burst=20 nodelay;`);
    lines.push(``);
  }

  // Static file handling
  lines.push(`    # Static file handling`);
  lines.push(`    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {`);
  lines.push(`        expires 1y;`);
  lines.push(`        add_header Cache-Control "public, immutable";`);
  lines.push(`        try_files $uri =404;`);
  lines.push(`    }`);
  lines.push(``);

  // Main application proxy
  lines.push(`    # Deno Genesis Application Proxy`);
  lines.push(`    location / {`);
  lines.push(`        proxy_pass http://127.0.0.1:${config.port};`);
  lines.push(`        proxy_http_version 1.1;`);
  lines.push(`        proxy_set_header Upgrade $http_upgrade;`);
  lines.push(`        proxy_set_header Connection 'upgrade';`);
  lines.push(`        proxy_set_header Host $host;`);
  lines.push(`        proxy_set_header X-Real-IP $remote_addr;`);
  lines.push(`        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
  lines.push(`        proxy_set_header X-Forwarded-Proto $scheme;`);
  lines.push(`        proxy_cache_bypass $http_upgrade;`);
  lines.push(`        proxy_read_timeout 300s;`);
  lines.push(`        proxy_connect_timeout 75s;`);
  lines.push(`        proxy_send_timeout 300s;`);
  lines.push(`    }`);
  lines.push(``);

  // Health check endpoint
  lines.push(`    # Health check endpoint`);
  lines.push(`    location /nginx-health {`);
  lines.push(`        access_log off;`);
  lines.push(`        return 200 "healthy\\n";`);
  lines.push(`        add_header Content-Type text/plain;`);
  lines.push(`    }`);
  lines.push(``);

  // Security locations
  lines.push(`    # Security - deny access to sensitive files`);
  lines.push(`    location ~ /\\. {`);
  lines.push(`        deny all;`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    location ~ ~$ {`);
  lines.push(`        deny all;`);
  lines.push(`    }`);
  lines.push(``);

  lines.push(`}`);

  return lines.join('\n');
}

// Create SSL certificate using Let's Encrypt
async function setupSSL(domain: string, subdomain?: string): Promise<boolean> {
  const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

  logHeader(`Setting up SSL for ${fullDomain}`);

  try {
    // Check if certbot is installed
    const certbotCheck = new Deno.Command("certbot", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });
    const { success: certbotInstalled } = await certbotCheck.output();

    if (!certbotInstalled) {
      logInfo("Installing Certbot...");
      const installCertbot = new Deno.Command("sudo", {
        args: ["apt", "install", "-y", "certbot", "python3-certbot-nginx"],
        stdout: "inherit",
        stderr: "inherit",
      });
      await installCertbot.output();
    }

    logInfo(`Obtaining SSL certificate for ${fullDomain}...`);

    const domains = [fullDomain, `www.${fullDomain}`];
    const certbotArgs = [
      "certonly",
      "--nginx",
      "--non-interactive",
      "--agree-tos",
      "--email", "admin@" + domain, // You might want to make this configurable
      ...domains.flatMap(d => ["-d", d])
    ];

    const certbotCmd = new Deno.Command("sudo", {
      args: ["certbot", ...certbotArgs],
      stdout: "inherit",
      stderr: "inherit",
    });

    const { success } = await certbotCmd.output();

    if (success) {
      logSuccess(`SSL certificate obtained for ${fullDomain}`);

      // Setup auto-renewal cron job
      logInfo("Setting up SSL certificate auto-renewal...");
      const cronEntry = "0 12 * * * /usr/bin/certbot renew --quiet";
      const cronCmd = new Deno.Command("sudo", {
        args: ["sh", "-c", `(crontab -l 2>/dev/null; echo "${cronEntry}") | crontab -`],
      });
      await cronCmd.output();

      return true;
    } else {
      logError("Failed to obtain SSL certificate");
      return false;
    }

  } catch (error) {
    logError(`SSL setup failed: ${error.message}`);
    return false;
  }
}

// Test Nginx configuration
async function testNginxConfig(): Promise<boolean> {
  try {
    logInfo("Testing Nginx configuration...");
    const command = new Deno.Command("sudo", {
      args: ["nginx", "-t"],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout, stderr } = await command.output();

    if (success) {
      logSuccess("Nginx configuration test passed");
      return true;
    } else {
      const errorText = new TextDecoder().decode(stderr);
      logError(`Nginx configuration test failed: ${errorText}`);
      return false;
    }
  } catch (error) {
    logError(`Configuration test error: ${error.message}`);
    return false;
  }
}

// Reload Nginx configuration
async function reloadNginx(): Promise<boolean> {
  try {
    logInfo("Reloading Nginx configuration...");
    const command = new Deno.Command("sudo", {
      args: ["systemctl", "reload", "nginx"],
    });

    const { success } = await command.output();

    if (success) {
      logSuccess("Nginx configuration reloaded");
      return true;
    } else {
      logError("Failed to reload Nginx");
      return false;
    }
  } catch (error) {
    logError(`Reload failed: ${error.message}`);
    return false;
  }
}

// Enable or disable a site
async function toggleSite(siteName: string, enable: boolean, sitesAvailable: string, sitesEnabled: string): Promise<boolean> {
  const availablePath = join(sitesAvailable, siteName);
  const enabledPath = join(sitesEnabled, siteName);

  try {
    if (enable) {
      logInfo(`Enabling site: ${siteName}`);

      if (!await exists(availablePath)) {
        logError(`Site configuration not found: ${availablePath}`);
        return false;
      }

      // Create symbolic link
      const linkCmd = new Deno.Command("sudo", {
        args: ["ln", "-sf", availablePath, enabledPath],
      });
      const { success } = await linkCmd.output();

      if (success) {
        logSuccess(`Site enabled: ${siteName}`);
        return true;
      } else {
        logError(`Failed to enable site: ${siteName}`);
        return false;
      }

    } else {
      logInfo(`Disabling site: ${siteName}`);

      if (await exists(enabledPath)) {
        const unlinkCmd = new Deno.Command("sudo", {
          args: ["rm", enabledPath],
        });
        const { success } = await unlinkCmd.output();

        if (success) {
          logSuccess(`Site disabled: ${siteName}`);
          return true;
        } else {
          logError(`Failed to disable site: ${siteName}`);
          return false;
        }
      } else {
        logWarning(`Site was not enabled: ${siteName}`);
        return true;
      }
    }
  } catch (error) {
    logError(`Toggle site failed: ${error.message}`);
    return false;
  }
}

// Remove a site configuration
async function removeSite(siteName: string, sitesAvailable: string, sitesEnabled: string): Promise<boolean> {
  const availablePath = join(sitesAvailable, siteName);
  const enabledPath = join(sitesEnabled, siteName);

  try {
    logInfo(`Removing site configuration: ${siteName}`);

    // Disable site first
    if (await exists(enabledPath)) {
      await toggleSite(siteName, false, sitesAvailable, sitesEnabled);
    }

    // Remove configuration file
    if (await exists(availablePath)) {
      const removeCmd = new Deno.Command("sudo", {
        args: ["rm", availablePath],
      });
      const { success } = await removeCmd.output();

      if (success) {
        logSuccess(`Site configuration removed: ${siteName}`);
        return true;
      } else {
        logError(`Failed to remove site configuration: ${siteName}`);
        return false;
      }
    } else {
      logWarning(`Site configuration not found: ${siteName}`);
      return true;
    }
  } catch (error) {
    logError(`Remove site failed: ${error.message}`);
    return false;
  }
}

// Main setup function
async function setupNginxSite(options: SetupOptions): Promise<void> {
  const fullDomain = options.subdomain
    ? `${options.subdomain}.${options.domain}`
    : options.domain;
  const siteName = fullDomain;

  logHeader(`Nginx Site Setup - ${fullDomain}`);

  // Check if Nginx is installed
  if (!await checkNginxInstalled()) {
    logWarning("Nginx not found. Installing...");
    if (!await installNginx()) {
      throw new Error("Nginx installation failed");
    }
  } else {
    logSuccess("Nginx is installed");
  }

  // Check if Nginx is running
  if (!await checkNginxRunning()) {
    logInfo("Starting Nginx service...");
    const startCmd = new Deno.Command("sudo", {
      args: ["systemctl", "start", "nginx"],
    });
    await startCmd.output();

    if (!await checkNginxRunning()) {
      throw new Error("Failed to start Nginx service");
    }
  }

  // Handle removal
  if (options.remove) {
    const removed = await removeSite(siteName, options.sitesAvailable, options.sitesEnabled);
    if (removed) {
      await testNginxConfig() && await reloadNginx();
    }
    return;
  }

  // Handle enable/disable
  if (options.enable || options.disable) {
    const toggled = await toggleSite(siteName, options.enable, options.sitesAvailable, options.sitesEnabled);
    if (toggled) {
      await testNginxConfig() && await reloadNginx();
    }
    return;
  }

  // Ensure directories exist
  await ensureDir(options.sitesAvailable);
  await ensureDir(options.sitesEnabled);

  // Create site configuration
  const siteConfig: NginxSiteConfig = {
    domain: options.domain,
    subdomain: options.subdomain,
    port: options.port,
    ssl: options.ssl,
    accessLog: true,
    errorLog: true,
    gzipEnabled: true,
    cacheEnabled: true,
    securityHeaders: options.ssl, // Only add security headers for HTTPS
    rateLimiting: true,
  };

  const configContent = generateNginxConfig(siteConfig);
  const configPath = join(options.sitesAvailable, siteName);

  if (options.dryRun) {
    logInfo("Dry run mode - configuration would be written to:");
    logInfo(configPath);
    console.log(configContent);
    return;
  }

  // Write configuration file
  logInfo(`Writing Nginx configuration to ${configPath}`);
  await Deno.writeTextFile(configPath, configContent);

  // Set appropriate permissions
  try {
    const chmodCmd = new Deno.Command("sudo", {
      args: ["chmod", "644", configPath],
    });
    await chmodCmd.output();

    const chownCmd = new Deno.Command("sudo", {
      args: ["chown", "root:root", configPath],
    });
    await chownCmd.output();
  } catch {
    logWarning("Could not set file permissions - configuration may need manual adjustment");
  }

  // Enable the site
  logInfo("Enabling site...");
  await toggleSite(siteName, true, options.sitesAvailable, options.sitesEnabled);

  // Setup SSL if requested
  if (options.ssl) {
    const sslSuccess = await setupSSL(options.domain, options.subdomain);
    if (sslSuccess) {
      // Regenerate config with SSL paths
      siteConfig.ssl = true;
      const sslConfig = generateNginxConfig(siteConfig);
      await Deno.writeTextFile(configPath, sslConfig);
      logInfo("Updated configuration with SSL settings");
    } else {
      logWarning("SSL setup failed - site configured for HTTP only");
    }
  }

  // Test and reload configuration
  if (options.testConfig || !options.dryRun) {
    const testPassed = await testNginxConfig();
    if (testPassed) {
      await reloadNginx();
      logSuccess(`Site ${fullDomain} configured successfully!`);

      console.log(`\n${Colors.CYAN}Configuration Summary:${Colors.RESET}`);
      console.log(`  🌐 Domain: ${fullDomain}`);
      console.log(`  🚀 Port: ${options.port}`);
      console.log(`  🔒 SSL: ${options.ssl ? 'enabled' : 'disabled'}`);
      console.log(`  📂 Config: ${configPath}`);
      console.log(`  📊 Logs: /var/log/nginx/${fullDomain}.*.log`);

      if (options.ssl) {
        console.log(`  🔐 Certificate: /etc/letsencrypt/live/${fullDomain}/`);
      }

    } else {
      throw new Error("Nginx configuration test failed");
    }
  }
}

// Main execution function
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["ssl", "remove", "enable", "disable", "test", "verbose", "dry-run", "help"],
    string: ["domain", "subdomain", "port", "sites-available", "sites-enabled"],
    default: {
      port: "3000",
      ssl: false,
      remove: false,
      enable: false,
      disable: false,
      test: false,
      verbose: false,
      "dry-run": false,
      "sites-available": "/etc/nginx/sites-available",
      "sites-enabled": "/etc/nginx/sites-enabled",
    },
    alias: {
      d: "domain",
      s: "subdomain",
      p: "port",
      h: "help",
      v: "verbose",
      t: "test"
    }
  });

  if (args.help) {
    console.log(`
Deno Genesis Nginx Setup Utility

USAGE:
  deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts [OPTIONS]

OPTIONS:
  -d, --domain DOMAIN        Domain name (required)
  -s, --subdomain SUB        Subdomain (optional)
  -p, --port PORT            Application port (default: 3000)
      --ssl                  Enable SSL with Let's Encrypt
      --remove               Remove site configuration
      --enable               Enable existing site
      --disable              Disable existing site
  -t, --test                 Test Nginx configuration only
      --dry-run              Show what would be done without executing
  -v, --verbose              Enable verbose logging
      --sites-available DIR  Sites available directory
      --sites-enabled DIR    Sites enabled directory
  -h, --help                 Show this help message

EXAMPLES:
  # Basic site setup
  deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts -d example.com

  # Site with SSL
  deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts -d example.com --ssl

  # Subdomain with custom port
  deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts -d example.com -s api -p 8080

  # Remove site
  deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts -d example.com --remove

  # Test configuration
  deno run --allow-run --allow-read --allow-write --allow-net setup-nginx.ts --test

REQUIREMENTS:
  - sudo privileges for Nginx configuration
  - Domain must point to this server for SSL setup
  - Deno Genesis application running on specified port
    `);
    Deno.exit(0);
  }

  if (!args.domain && !args.test) {
    logError("Domain is required (use --domain or -d)");
    Deno.exit(1);
  }

  const options: SetupOptions = {
    domain: args.domain,
    subdomain: args.subdomain,
    port: parseInt(args.port) || 3000,
    ssl: args.ssl,
    remove: args.remove,
    enable: args.enable,
    disable: args.disable,
    testConfig: args.test,
    verbose: args.verbose,
    dryRun: args["dry-run"],
    configPath: "",
    sitesAvailable: args["sites-available"],
    sitesEnabled: args["sites-enabled"],
  };

  // Test configuration only
  if (args.test) {
    const testPassed = await testNginxConfig();
    Deno.exit(testPassed ? 0 : 1);
  }

  if (options.verbose) {
    logInfo(`Domain: ${options.domain}`);
    if (options.subdomain) logInfo(`Subdomain: ${options.subdomain}`);
    logInfo(`Port: ${options.port}`);
    logInfo(`SSL: ${options.ssl}`);
    logInfo(`Sites available: ${options.sitesAvailable}`);
    logInfo(`Sites enabled: ${options.sitesEnabled}`);
  }

  await setupNginxSite(options);
}

// Unix philosophy: Clear error handling and exit codes
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Nginx setup failed: ${error.message}`);
    if (Deno.args.includes("--verbose") || Deno.args.includes("-v")) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}
