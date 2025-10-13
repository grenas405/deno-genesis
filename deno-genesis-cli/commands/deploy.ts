#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-env

/**
 * Deno Genesis Dev Command
 * 
 * Unix Philosophy Implementation:
 * - Do one thing well: Generate infrastructure configuration files
 * - Accept text input: Domain names and configuration parameters
 * - Produce text output: Nginx and SystemD configuration files
 * - Filter and transform: Take user intent → create deployment configs
 * - Composable: Can be piped, scripted, automated
 * 
 * Security-First Approach:
 * - Explicit permissions for file operations
 * - Safe directory creation with validation
 * - Auditable configuration generation
 * 
 * Zero-Configuration Philosophy:
 * - Sensible defaults for all options
 * - Interactive prompts with smart defaults
 * - Self-documenting output
 */

import { join, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";

// Types for better developer experience
interface CLIContext {
  cwd: string;
  configPath: string;
  verbose: boolean;
  dryRun: boolean;
  format: 'text' | 'json' | 'yaml';
}

interface DevConfig {
  domain: string;
  siteName: string;
  siteKey: string;
  port: number;
  workingDirectory: string;
  businessDescription: string;
  restartDelay: number;
}

interface DevOptions {
  domain?: string;
  port?: number;
  skipPrompts?: boolean;
  nginxOnly?: boolean;
  systemdOnly?: boolean;
}

// Default configuration following Genesis patterns
const DEFAULT_CONFIG = {
  basePort: 3000,
  restartDelayBase: 10,
  workingDirBase: "/home/admin/deno-genesis/sites",
  dbHost: "localhost",
  dbUser: "webadmin",
  dbPassword: "Password123!",
  dbName: "universal_db"
};

// Port range for Deno Genesis services
const PORT_RANGE = {
  min: 3000,
  max: 3010
};

/**
 * Main dev command handler
 * Follows Unix principle: Clear interface, predictable behavior
 */
export async function devCommand(args: string[], context: CLIContext): Promise<number> {
  try {
    console.log(`
🔧 Deno Genesis Dev Configuration Generator

Unix Philosophy + Infrastructure as Code = Reliable Deployments
Generating nginx and systemd configuration files...
`);

    // Parse command line arguments
    const options = parseDevArgs(args);
    
    // Interactive prompts for missing configuration
    const devConfig = await gatherDevConfiguration(options, context);
    
    // Validate configuration
    const validationResult = validateDevConfig(devConfig, context);
    if (!validationResult.valid) {
      console.error(`❌ Configuration validation failed: ${validationResult.error}`);
      return 1;
    }

    // Execute configuration generation
    await executeConfigGeneration(devConfig, options, context);
    
    // Success output following Unix principles
    console.log(`
✅ Infrastructure configuration generated successfully!

Configuration Details:
  🌐 Domain: ${devConfig.domain}
  📁 Site Name: ${devConfig.siteName}
  🔑 Site Key: ${devConfig.siteKey}
  🚪 Port: ${devConfig.port}
  📂 Working Directory: ${devConfig.workingDirectory}

Generated Files:
  ${!options.systemdOnly ? `📄 Nginx: config/nginx/sites-available/${devConfig.siteName}.conf` : ''}
  ${!options.nginxOnly ? `📄 SystemD: config/systemd/active/${devConfig.siteName}.service` : ''}

Next Steps:
  1. Review generated configuration files
  2. Copy nginx config: sudo cp config/nginx/sites-available/${devConfig.siteName}.conf /etc/nginx/sites-available/
  3. Enable nginx site: sudo ln -s /etc/nginx/sites-available/${devConfig.siteName}.conf /etc/nginx/sites-enabled/
  4. Test nginx: sudo nginx -t
  5. Reload nginx: sudo systemctl reload nginx
  6. Copy systemd service: sudo cp config/systemd/active/${devConfig.siteName}.service /etc/systemd/system/
  7. Enable service: sudo systemctl enable ${devConfig.siteName}.service
  8. Start service: sudo systemctl start ${devConfig.siteName}.service
  
🔒 Security: All configurations follow DenoGenesis security patterns
📖 Docs: See docs/07-deployment/ for deployment guides
`);

    return 0;

  } catch (error) {
    console.error(`❌ Dev command failed: ${error.message}`);
    if (context.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

/**
 * Parse command line arguments with sensible defaults
 */
function parseDevArgs(args: string[]): DevOptions {
  const options: DevOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--domain':
      case '-d':
        options.domain = args[++i];
        break;
      case '--port':
      case '-p':
        options.port = parseInt(args[++i]) || DEFAULT_CONFIG.basePort;
        break;
      case '--skip-prompts':
      case '-y':
        options.skipPrompts = true;
        break;
      case '--nginx-only':
        options.nginxOnly = true;
        break;
      case '--systemd-only':
        options.systemdOnly = true;
        break;
    }
  }
  
  // Use first positional argument as domain if provided
  if (args[0] && !args[0].startsWith('--') && !args[0].startsWith('-')) {
    options.domain = args[0];
  }
  
  return options;
}

/**
 * Interactive configuration gathering
 * Unix principle: Accept input from user, provide sensible defaults
 */
async function gatherDevConfiguration(options: DevOptions, context: CLIContext): Promise<DevConfig> {
  const domain = options.domain || await promptForDomain();
  const siteName = deriveSiteName(domain);
  const siteKey = deriveSiteKey(siteName);
  
  const config: DevConfig = {
    domain: domain,
    siteName: siteName,
    siteKey: siteKey,
    port: options.port || await promptForPort(),
    workingDirectory: join(DEFAULT_CONFIG.workingDirBase, siteName),
    businessDescription: await promptForDescription(domain),
    restartDelay: calculateRestartDelay(options.port || DEFAULT_CONFIG.basePort)
  };
  
  return config;
}

/**
 * Prompt for domain name with validation
 */
async function promptForDomain(): Promise<string> {
  console.log("\n📝 Enter the domain name for this site:");
  console.log("   Example: example.com or subdomain.example.com");
  
  const input = prompt("Domain:") || "";
  const cleaned = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  if (!cleaned || !isValidDomain(cleaned)) {
    console.error("❌ Invalid domain name. Please use format: example.com");
    return await promptForDomain();
  }
  
  return cleaned;
}

/**
 * Prompt for port number with validation
 */
async function promptForPort(): Promise<number> {
  console.log(`\n🚪 Enter the port number (${PORT_RANGE.min}-${PORT_RANGE.max}):`);
  console.log(`   Default: ${DEFAULT_CONFIG.basePort}`);
  
  const input = prompt(`Port [${DEFAULT_CONFIG.basePort}]:`) || "";
  
  if (!input.trim()) {
    return DEFAULT_CONFIG.basePort;
  }
  
  const port = parseInt(input);
  
  if (isNaN(port) || port < PORT_RANGE.min || port > PORT_RANGE.max) {
    console.error(`❌ Invalid port. Must be between ${PORT_RANGE.min} and ${PORT_RANGE.max}`);
    return await promptForPort();
  }
  
  return port;
}

/**
 * Prompt for business description
 */
async function promptForDescription(domain: string): Promise<string> {
  console.log("\n📝 Enter a brief business description:");
  console.log(`   This will appear in systemd service metadata`);
  
  const input = prompt("Description:") || "";
  
  if (!input.trim()) {
    return `${domain} - Deno Genesis Site`;
  }
  
  return input.trim();
}

/**
 * Validate domain format
 */
function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Derive site name from domain
 * example.com -> example-com
 * subdomain.example.com -> subdomain-example-com
 */
function deriveSiteName(domain: string): string {
  return domain.replace(/\./g, '-');
}

/**
 * Derive site key from site name
 * example-com -> example
 * subdomain-example-com -> subdomain-example
 */
function deriveSiteKey(siteName: string): string {
  // Remove common TLD suffixes
  return siteName
    .replace(/-com$/, '')
    .replace(/-org$/, '')
    .replace(/-net$/, '')
    .replace(/-xyz$/, '')
    .replace(/-io$/, '')
    .replace(/-dev$/, '');
}

/**
 * Calculate staggered restart delay based on port
 * Prevents all services from restarting simultaneously
 */
function calculateRestartDelay(port: number): number {
  const offset = port - PORT_RANGE.min;
  return DEFAULT_CONFIG.restartDelayBase + (offset * 3);
}

/**
 * Validate configuration
 */
function validateDevConfig(config: DevConfig, context: CLIContext): { valid: boolean; error?: string } {
  if (!config.domain) {
    return { valid: false, error: "Domain is required" };
  }
  
  if (!isValidDomain(config.domain)) {
    return { valid: false, error: "Invalid domain format" };
  }
  
  if (config.port < PORT_RANGE.min || config.port > PORT_RANGE.max) {
    return { valid: false, error: `Port must be between ${PORT_RANGE.min} and ${PORT_RANGE.max}` };
  }
  
  return { valid: true };
}

/**
 * Execute configuration generation
 */
async function executeConfigGeneration(
  config: DevConfig,
  options: DevOptions,
  context: CLIContext
): Promise<void> {
  // Ensure output directories exist
  const nginxDir = join(context.cwd, "config", "nginx", "sites-available");
  const systemdDir = join(context.cwd, "config", "systemd", "active");
  
  await ensureDir(nginxDir);
  await ensureDir(systemdDir);
  
  // Generate nginx configuration
  if (!options.systemdOnly) {
    await generateNginxConfig(config, nginxDir, context);
  }
  
  // Generate systemd service
  if (!options.nginxOnly) {
    await generateSystemdService(config, systemdDir, context);
  }
}

/**
 * Generate nginx configuration file
 */
async function generateNginxConfig(
  config: DevConfig,
  outputDir: string,
  context: CLIContext
): Promise<void> {
  const nginxConfig = `# =============================================================================
# NGINX CONFIGURATION - ${config.domain.toUpperCase()}
# =============================================================================
# Generated by: Deno Genesis CLI (dev command)
# Generated on: ${new Date().toISOString()}
# Site: ${config.domain}
# Backend Port: ${config.port}
# =============================================================================

# =============================================================================
# Upstream Configuration
# =============================================================================
upstream ${config.siteKey}_backend {
    server 127.0.0.1:${config.port};
    keepalive 32;
}

# =============================================================================
# HTTPS Server Block
# =============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name www.${config.domain} ${config.domain};

    # ==========================================================================
    # SSL Configuration (Use Certbot to generate certificates)
    # ==========================================================================
    # ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;
    # ssl_trusted_certificate /etc/letsencrypt/live/${config.domain}/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # ==========================================================================
    # Security Headers
    # ==========================================================================
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # ==========================================================================
    # Logging Configuration
    # ==========================================================================
    access_log /var/log/nginx/${config.siteName}_access.log;
    error_log /var/log/nginx/${config.siteName}_error.log;

    # ==========================================================================
    # Root and Index
    # ==========================================================================
    root ${config.workingDirectory}/public;
    index index.html;

    # ==========================================================================
    # Client Upload Limits
    # ==========================================================================
    client_max_body_size 10M;
    client_body_timeout 60s;

    # ==========================================================================
    # Static File Serving with Caching
    # ==========================================================================
    location /public/ {
        alias ${config.workingDirectory}/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        
        # Security: Prevent script execution in upload directories
        location ~* \\.(php|py|js|sh|pl|rb)$ {
            deny all;
        }
    }

    # ==========================================================================
    # API and Dynamic Content - Reverse Proxy to Deno Backend
    # ==========================================================================
    location / {
        proxy_pass http://${config.siteKey}_backend;
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # ==========================================================================
    # Security: Deny Access to Sensitive Files
    # ==========================================================================
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(?:\\.git|\\.htaccess|\\.env|config\\.json|package\\.json|deno\\.lock)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # ==========================================================================
    # Health Check Endpoint
    # ==========================================================================
    location /nginx-health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # ==========================================================================
    # Framework Documentation (Optional - Remove in production)
    # ==========================================================================
    location /docs/ {
        proxy_pass http://${config.siteKey}_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Optional: Add basic auth for documentation in production
        # auth_basic "DenoGenesis Documentation";
        # auth_basic_user_file /etc/nginx/.htpasswd;
    }
}

# =============================================================================
# HTTP to HTTPS Redirect
# =============================================================================
server {
    listen 80;
    listen [::]:80;

    server_name www.${config.domain} ${config.domain};

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# =============================================================================
# WWW to Non-WWW Redirect (Optional)
# =============================================================================
# Uncomment if you want to enforce non-www
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name www.${config.domain};
#     return 301 https://${config.domain}$request_uri;
# }
`;

  const outputPath = join(outputDir, `${config.siteName}.conf`);
  await Deno.writeTextFile(outputPath, nginxConfig);
  
  if (context.verbose) {
    console.log(`✅ Generated nginx configuration: ${outputPath}`);
  }
}

/**
 * Generate systemd service file
 */
async function generateSystemdService(
  config: DevConfig,
  outputDir: string,
  context: CLIContext
): Promise<void> {
  const systemdService = `# =============================================================================
# ${config.siteName.toUpperCase()} - SYSTEMD SERVICE UNIT
# =============================================================================
# Generated by: Deno Genesis CLI (dev command)
# Generated on: ${new Date().toISOString()}
# Site: ${config.domain}
# Port: ${config.port}
# =============================================================================

[Unit]
Description=${config.businessDescription}
Documentation=https://${config.domain}
After=network.target mariadb.service nginx.service
Wants=network-online.target
Requires=mariadb.service nginx.service

[Service]
Type=simple
User=admin
Group=admin

# Site-specific working directory
WorkingDirectory=${config.workingDirectory}

# Standard DenoGenesis environment variables
Environment=DENO_ENV=production
Environment=PORT=${config.port}
Environment=DB_HOST=${DEFAULT_CONFIG.dbHost}
Environment=DB_USER=${DEFAULT_CONFIG.dbUser}
Environment=DB_PASSWORD=${DEFAULT_CONFIG.dbPassword}
Environment=DB_NAME=${DEFAULT_CONFIG.dbName}
Environment=SITE_KEY=${config.siteKey}

# Deno execution with comprehensive permissions for DenoGenesis framework
ExecStart=/home/admin/.deno/bin/deno run \\
  --allow-net \\
  --allow-read \\
  --allow-write \\
  --allow-env \\
  --allow-run \\
  --unstable \\
  --lock=deno.lock \\
  --cached-only \\
  main.ts

# Failure recovery configuration
Restart=on-failure
RestartSec=${config.restartDelay}
StartLimitBurst=3
StartLimitInterval=60

# Resource limits for production stability
LimitNOFILE=65536
LimitNPROC=4096

# Security hardening measures
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes

# File system access permissions
ReadWritePaths=${config.workingDirectory}
ReadWritePaths=/tmp
ReadWritePaths=/var/log

# Process management configuration
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30
TimeoutStartSec=60

# Logging configuration for systemd journal
StandardOutput=journal
StandardError=journal
SyslogIdentifier=denogenesis-${config.siteKey}

[Install]
WantedBy=multi-user.target
Alias=${config.siteName}.service

# =============================================================================
# DenoGenesis Framework Service - End
# =============================================================================

# DEPLOYMENT COMMANDS:
# 1. sudo cp ${config.siteName}.service /etc/systemd/system/
# 2. sudo systemctl daemon-reload
# 3. sudo systemctl enable ${config.siteName}.service
# 4. sudo systemctl start ${config.siteName}.service
# 5. sudo systemctl status ${config.siteName}.service
#
# LOG MONITORING:
# sudo journalctl -u ${config.siteName}.service -f
#
# HEALTH CHECK:
# curl https://${config.domain}/nginx-health
`;

  const outputPath = join(outputDir, `${config.siteName}.service`);
  await Deno.writeTextFile(outputPath, systemdService);
  
  if (context.verbose) {
    console.log(`✅ Generated systemd service: ${outputPath}`);
  }
}

/**
 * Show help for dev command
 */
export function showDevHelp(): void {
  console.log(`
🔧 Deno Genesis Dev Command - Infrastructure Configuration Generator

USAGE:
  genesis dev [domain] [options]

DESCRIPTION:
  Generate nginx and systemd configuration files for a Deno Genesis site.
  Follows Unix Philosophy and DenoGenesis security patterns.

ARGUMENTS:
  domain              Domain name for the site (e.g., example.com)

OPTIONS:
  -d, --domain        Specify domain name
  -p, --port          Specify port number (${PORT_RANGE.min}-${PORT_RANGE.max})
  -y, --skip-prompts  Skip interactive prompts and use defaults
  --nginx-only        Generate only nginx configuration
  --systemd-only      Generate only systemd service configuration
  -v, --verbose       Enable verbose output
  -h, --help          Show this help message

EXAMPLES:
  # Interactive mode
  genesis dev
  
  # Generate configs for specific domain
  genesis dev example.com
  
  # Specify domain and port
  genesis dev example.com --port 3005
  
  # Generate only nginx config
  genesis dev example.com --nginx-only
  
  # Generate only systemd service
  genesis dev example.com --systemd-only --port 3003
  
  # Skip prompts with defaults
  genesis dev example.com --skip-prompts

OUTPUT:
  Generated files will be placed in:
  - config/nginx/sites-available/[site-name].conf
  - config/systemd/active/[site-name].service

DEPLOYMENT:
  After generating configurations:
  1. Review the generated files
  2. Copy nginx config to /etc/nginx/sites-available/
  3. Create symlink in /etc/nginx/sites-enabled/
  4. Test nginx configuration: sudo nginx -t
  5. Reload nginx: sudo systemctl reload nginx
  6. Copy systemd service to /etc/systemd/system/
  7. Enable and start the service

PHILOSOPHY:
  This command follows the Unix Philosophy:
  - Do one thing well: Generate infrastructure configs
  - Composable: Output can be piped to other tools
  - Explicit: All parameters are clearly specified
  - Secure: Follows DenoGenesis security patterns

For more information, see docs/07-deployment/
`);
}
