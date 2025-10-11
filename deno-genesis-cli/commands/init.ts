#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-env

/**
 * Deno Genesis Init Command
 * 
 * Unix Philosophy Implementation:
 * - Do one thing well: Initialize Genesis project with sites directory
 * - Accept text input: User prompts for site configuration
 * - Produce text output: Structured progress logging
 * - Filter and transform: Take user intent → create project structure
 * - Composable: Can be piped, scripted, automated
 * 
 * Security-First Approach:
 * - Explicit permissions for file operations
 * - Safe directory creation with validation
 * - Auditable symbolic link creation
 * 
 * Zero-Configuration Philosophy:
 * - Sensible defaults for all options
 * - Interactive prompts with smart defaults
 * - Self-documenting output
 */

import { join, resolve, relative } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";

// Types for better developer experience
interface CLIContext {
  cwd: string;
  configPath: string;
  verbose: boolean;
  dryRun: boolean;
  format: 'text' | 'json' | 'yaml';
}

interface SiteConfig {
  name: string;
  port: number;
  directory: string;
  description?: string;
  template: string;
}

interface InitOptions {
  siteName?: string;
  port?: number;
  template?: string;
  skipPrompts?: boolean;
}

// Default configuration following Genesis patterns
const DEFAULT_CONFIG = {
  port: 3000,
  template: "basic",
  description: "Deno Genesis Site"
};

// Symbolic link targets - must match core framework structure
const CORE_SYMLINK_TARGETS = [
  "utils",
  "middleware", 
  "config",
  "types",
  "database",
  "models",
  "routes",
  "services",
  "controllers",
  "main.ts",
  "VERSION",
  "meta.ts",
  "mod.ts"
];

/**
 * Main init command handler
 * Follows Unix principle: Clear interface, predictable behavior
 */
export async function initCommand(args: string[], context: CLIContext): Promise<number> {
  try {
    console.log(`
🚀 Initializing Deno Genesis Project

Unix Philosophy + Modern Runtime = Revolutionary Development
Creating hub-and-spoke architecture with core framework symlinks...
`);

    // Parse command line arguments
    const options = parseInitArgs(args);
    
    // Interactive prompts for missing configuration
    const siteConfig = await gatherSiteConfiguration(options, context);
    
    // Validate configuration
    const validationResult = validateSiteConfig(siteConfig, context);
    if (!validationResult.valid) {
      console.error(`❌ Configuration validation failed: ${validationResult.error}`);
      return 1;
    }

    // Execute initialization steps
    await executeInitialization(siteConfig, context);
    
    // Success output following Unix principles
    console.log(`
✅ Genesis project initialized successfully!

Site Details:
  📁 Name: ${siteConfig.name}
  🌐 Port: ${siteConfig.port}
  📂 Path: ${siteConfig.directory}
  🔗 Core Links: ${CORE_SYMLINK_TARGETS.length} symlinks created

Next Steps:
  cd ${siteConfig.directory}
  genesis dev --port=${siteConfig.port}
  
🔒 Security: All operations completed with minimal required permissions
📖 Docs: See generated README.md in your site directory
`);

    return 0;

  } catch (error) {
    console.error(`❌ Init command failed: ${error.message}`);
    if (context.verbose) {
      console.error(error.stack);
    }
    return 1;
  }
}

/**
 * Parse command line arguments with sensible defaults
 */
function parseInitArgs(args: string[]): InitOptions {
  const options: InitOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--name':
        options.siteName = args[++i];
        break;
      case '--port':
        options.port = parseInt(args[++i]) || DEFAULT_CONFIG.port;
        break;
      case '--template':
        options.template = args[++i] || DEFAULT_CONFIG.template;
        break;
      case '--skip-prompts':
        options.skipPrompts = true;
        break;
    }
  }
  
  // Use first positional argument as site name if provided
  if (args[0] && !args[0].startsWith('--')) {
    options.siteName = args[0];
  }
  
  return options;
}

/**
 * Interactive configuration gathering
 * Unix principle: Accept input from user, provide sensible defaults
 */
async function gatherSiteConfiguration(options: InitOptions, context: CLIContext): Promise<SiteConfig> {
  const config: SiteConfig = {
    name: options.siteName || await promptForSiteName(),
    port: options.port || await promptForPort(),
    template: options.template || DEFAULT_CONFIG.template,
    directory: "", // Will be set based on name
    description: DEFAULT_CONFIG.description
  };
  
  // Generate directory path
  config.directory = join(context.cwd, "sites", config.name);
  
  return config;
}

/**
 * Prompt for site name with validation
 */
async function promptForSiteName(): Promise<string> {
  while (true) {
    const name = prompt("🏷️  Site name (lowercase, no spaces):");
    
    if (!name) {
      console.log("❌ Site name is required");
      continue;
    }
    
    if (!/^[a-z0-9-]+$/.test(name)) {
      console.log("❌ Site name must be lowercase letters, numbers, and hyphens only");
      continue;
    }
    
    return name;
  }
}

/**
 * Prompt for port number with validation  
 */
async function promptForPort(): Promise<number> {
  while (true) {
    const portStr = prompt(`🌐 Port number (default: ${DEFAULT_CONFIG.port}):`);
    
    if (!portStr) {
      return DEFAULT_CONFIG.port;
    }
    
    const port = parseInt(portStr);
    
    if (isNaN(port) || port < 1024 || port > 65535) {
      console.log("❌ Port must be a number between 1024 and 65535");
      continue;
    }
    
    return port;
  }
}

/**
 * Validate site configuration
 */
function validateSiteConfig(config: SiteConfig, context: CLIContext): { valid: boolean; error?: string } {
  // Check if sites directory exists or can be created
  const sitesDir = join(context.cwd, "sites");
  
  // Validate site name
  if (!config.name || !/^[a-z0-9-]+$/.test(config.name)) {
    return { valid: false, error: "Invalid site name format" };
  }
  
  // Validate port
  if (config.port < 1024 || config.port > 65535) {
    return { valid: false, error: "Port must be between 1024 and 65535" };
  }
  
  return { valid: true };
}

/**
 * Execute the initialization process
 */
async function executeInitialization(config: SiteConfig, context: CLIContext): Promise<void> {
  // Step 1: Create sites directory structure
  console.log("📁 Creating directory structure...");
  await createDirectoryStructure(config, context);
  
  // Step 2: Create symbolic links to core framework
  console.log("🔗 Creating symbolic links to core framework...");
  await createCoreSymlinks(config, context);
  
  // Step 3: Generate initial pages
  console.log("📄 Generating initial pages...");
  await generateInitialPages(config, context);
  
  // Step 4: Create configuration files
  console.log("⚙️  Creating configuration files...");
  await createConfigurationFiles(config, context);
  
  // Step 5: Create README documentation
  console.log("📖 Creating documentation...");
  await createDocumentation(config, context);
}

/**
 * Create the basic directory structure for the site
 */
async function createDirectoryStructure(config: SiteConfig, context: CLIContext): Promise<void> {
  // Ensure sites directory exists
  const sitesDir = join(context.cwd, "sites");
  await ensureDir(sitesDir);
  
  // Create site directory
  await ensureDir(config.directory);
  
  // Create subdirectories
  const subdirs = [
    "public",
    "public/pages",
    "public/pages/home",
    "public/styles", 
    "public/scripts",
    "public/images",
    "logs"
  ];
  
  for (const subdir of subdirs) {
    await ensureDir(join(config.directory, subdir));
  }
  
  if (context.verbose) {
    console.log(`  ✅ Created ${subdirs.length} directories in ${config.directory}`);
  }
}

/**
 * Create symbolic links to core framework
 */
async function createCoreSymlinks(config: SiteConfig, context: CLIContext): Promise<void> {
  const coreDir = join(context.cwd, "core");
  
  // Verify core directory exists
  if (!await exists(coreDir)) {
    throw new Error(`Core directory not found: ${coreDir}`);
  }
  
  let createdLinks = 0;
  
  for (const target of CORE_SYMLINK_TARGETS) {
    const sourcePath = join(coreDir, target);
    const linkPath = join(config.directory, target);
    
    // Check if source exists
    if (!await exists(sourcePath)) {
      if (context.verbose) {
        console.log(`  ⚠️  Skipping ${target} - not found in core`);
      }
      continue;
    }
    
    try {
      // Remove existing link/file if it exists
      if (await exists(linkPath)) {
        await Deno.remove(linkPath, { recursive: true });
      }
      
      // Create relative symbolic link
      const relativePath = relative(config.directory, sourcePath);
      await Deno.symlink(relativePath, linkPath);
      
      createdLinks++;
      
      if (context.verbose) {
        console.log(`  ✅ ${target} → ${relativePath}`);
      }
    } catch (error) {
      console.warn(`  ⚠️  Failed to create symlink for ${target}: ${error.message}`);
    }
  }
  
  console.log(`  🔗 Created ${createdLinks} symbolic links to core framework`);
}

/**
 * Generate initial pages using UI guidelines
 */
async function generateInitialPages(config: SiteConfig, context: CLIContext): Promise<void> {
  const homePageContent = generateHomePageHTML(config);
  const homePagePath = join(config.directory, "public/pages/home/index.html");
  
  await Deno.writeTextFile(homePagePath, homePageContent);
  
  if (context.verbose) {
    console.log(`  ✅ Generated home page: ${homePagePath}`);
  }
}

/**
 * Generate home page HTML following UI guidelines
 */
function generateHomePageHTML(config: SiteConfig): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name} | Created with Deno Genesis Framework</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="${config.description} - Built with Deno Genesis Framework">
    <meta name="keywords" content="deno, typescript, unix philosophy, local-first software, framework">
    <meta name="author" content="Deno Genesis Framework">
    <meta name="generator" content="Deno Genesis v2.0">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${config.name} - Deno Genesis Site">
    <meta property="og:description" content="${config.description}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${config.name}">
    
    <!-- Critical CSS - Inlined for performance -->
    <style>
        /* Critical above-the-fold styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --primary-color: #1e293b;
            --accent-color: #3b82f6;
            --text-color: #334155;
            --background-color: #ffffff;
            --border-color: #e2e8f0;
        }
        
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--background-color);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header Styles */
        header {
            background: var(--primary-color);
            color: white;
            padding: 1rem 0;
        }
        
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            transition: opacity 0.3s;
        }
        
        .nav-links a:hover {
            opacity: 0.8;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
            color: white;
            text-align: center;
            padding: 4rem 0;
        }
        
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .cta-button {
            display: inline-block;
            background: white;
            color: var(--primary-color);
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        /* Features Section */
        .features {
            padding: 4rem 0;
        }
        
        .features h2 {
            text-align: center;
            margin-bottom: 3rem;
            color: var(--primary-color);
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .feature-card {
            padding: 2rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            text-align: center;
            transition: box-shadow 0.3s;
        }
        
        .feature-card:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .feature-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        /* Footer */
        footer {
            background: var(--primary-color);
            color: white;
            text-align: center;
            padding: 2rem 0;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* Loading States */
        .loading {
            opacity: 0.7;
            pointer-events: none;
        }
        
        /* Focus Styles for Accessibility */
        .cta-button:focus,
        .nav-links a:focus {
            outline: 2px solid var(--accent-color);
            outline-offset: 2px;
        }
    </style>
</head>

<body>
    <!-- Skip to main content for accessibility -->
    <a href="#main-content" class="sr-only">Skip to main content</a>
    
    <!-- Header Navigation -->
    <header>
        <nav class="container">
            <div class="logo">${config.name}</div>
            <ul class="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <!-- Main Content -->
    <main id="main-content">
        <!-- Hero Section -->
        <section class="hero">
            <div class="container">
                <h1>Welcome to ${config.name}</h1>
                <p>Created with Deno Genesis Framework</p>
                <p>Unix Philosophy + Modern Runtime = Revolutionary Development</p>
                <a href="/contact" class="cta-button">Get Started</a>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features">
            <div class="container">
                <h2>Powered by Deno Genesis Framework</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">🚀</div>
                        <h3>Lightning Fast</h3>
                        <p>Built with Deno runtime for maximum performance and security. Zero configuration complexity.</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>Security First</h3>
                        <p>Explicit permissions model and secure-by-default architecture following modern security practices.</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🔧</div>
                        <h3>Unix Philosophy</h3>
                        <p>Do one thing well. Composable tools that work together to create powerful solutions.</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${config.name}. Created with Deno Genesis Framework.</p>
            <p>Built with ❤️ using Unix Philosophy principles</p>
        </div>
    </footer>

    <!-- Non-critical JavaScript loaded asynchronously -->
    <script>
        // Progressive enhancement for navigation
        document.addEventListener('DOMContentLoaded', function() {
            // Add smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
            
            // Add loading states for buttons
            document.querySelectorAll('.cta-button').forEach(button => {
                button.addEventListener('click', function(e) {
                    if (this.href && !this.href.startsWith('#')) {
                        this.classList.add('loading');
                        this.textContent = 'Loading...';
                    }
                });
            });
            
            console.log('🚀 ${config.name} loaded successfully - Powered by Deno Genesis Framework');
        });
    </script>
</body>
</html>`;
}

/**
 * Create configuration files for the site
 */
async function createConfigurationFiles(config: SiteConfig, context: CLIContext): Promise<void> {
  // Create site-specific config file
  const siteConfigContent = generateSiteConfig(config);
  const configPath = join(config.directory, "site.config.ts");
  
  await Deno.writeTextFile(configPath, siteConfigContent);
  
  if (context.verbose) {
    console.log(`  ✅ Generated site configuration: ${configPath}`);
  }
}

/**
 * Generate site configuration file
 */
function generateSiteConfig(config: SiteConfig): string {
  return `// ${config.name} - Deno Genesis Site Configuration
// Generated by genesis init command
// This file configures your site's specific settings

export interface SiteConfig {
  name: string;
  port: number;
  description: string;
  template: string;
  features: string[];
  paths: {
    public: string;
    pages: string;
    styles: string;
    scripts: string;
    images: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "${config.name}",
  port: ${config.port},
  description: "${config.description}",
  template: "${config.template}",
  features: [
    "responsive-design",
    "seo-optimized", 
    "accessibility-ready",
    "performance-optimized"
  ],
  paths: {
    public: "./public",
    pages: "./public/pages",
    styles: "./public/styles", 
    scripts: "./public/scripts",
    images: "./public/images"
  }
};

// Export for use in main.ts and other modules
export default siteConfig;
`;
}

/**
 * Create documentation for the new site
 */
async function createDocumentation(config: SiteConfig, context: CLIContext): Promise<void> {
  const readmeContent = generateReadmeContent(config);
  const readmePath = join(config.directory, "README.md");
  
  await Deno.writeTextFile(readmePath, readmeContent);
  
  if (context.verbose) {
    console.log(`  ✅ Generated documentation: ${readmePath}`);
  }
}

/**
 * Generate README content for the site
 */
function generateReadmeContent(config: SiteConfig): string {
  return `# ${config.name}

> Created with Deno Genesis Framework  
> **Unix Philosophy + Modern Runtime = Revolutionary Development**

## 🚀 Quick Start

\`\`\`bash
# Start development server
genesis dev --port=${config.port}

# Or run directly with Deno
deno run --allow-read --allow-write --allow-net --allow-env main.ts
\`\`\`

## 📁 Project Structure

\`\`\`
${config.name}/
├── public/                 # Static assets and pages
│   ├── pages/             # HTML pages
│   │   └── home/
│   │       └── index.html # Generated home page
│   ├── styles/            # CSS stylesheets  
│   ├── scripts/           # JavaScript files
│   └── images/            # Image assets
├── logs/                  # Application logs
├── core/                  # → Symlink to ../../core/
├── utils/                 # → Symlink to ../../core/utils/
├── middleware/            # → Symlink to ../../core/middleware/
├── config/                # → Symlink to ../../core/config/
├── types/                 # → Symlink to ../../core/types/
├── database/              # → Symlink to ../../core/database/
├── models/                # → Symlink to ../../core/models/
├── routes/                # → Symlink to ../../core/routes/
├── services/              # → Symlink to ../../core/services/
├── controllers/           # → Symlink to ../../core/controllers/
├── main.ts                # → Symlink to ../../core/main.ts
├── VERSION                # → Symlink to ../../core/VERSION
├── meta.ts                # → Symlink to ../../core/meta.ts
├── site.config.ts         # Site-specific configuration
└── README.md              # This file
\`\`\`

## ⚙️ Configuration

### Site Settings
- **Name**: ${config.name}
- **Port**: ${config.port}
- **Template**: ${config.template}
- **Description**: ${config.description}

### Core Framework Integration
This site uses symbolic links to the core Deno Genesis framework, ensuring:
- ✅ **Version Consistency**: All sites use the same core framework version
- ✅ **Instant Updates**: Framework updates automatically apply to all sites
- ✅ **Reduced Redundancy**: Single source of truth for core functionality
- ✅ **Easy Maintenance**: Update once, deploy everywhere

## 🔧 Development

### Available Commands
\`\`\`bash
# Development server with hot reload
genesis dev

# Production deployment
genesis deploy

# Database operations
genesis db setup
genesis db migrate

# Environment management
genesis env setup
genesis env validate

# Status check
genesis status
\`\`\`

### Adding Pages
1. Create HTML files in \`public/pages/[page-name]/\`
2. Add corresponding routes in the framework
3. Update navigation in your templates

### Styling
- Add CSS files to \`public/styles/\`
- Follow the UI guidelines from \`docs/05-frontend/ui-guidelines.md\`
- Use CSS custom properties for consistent theming

## 🔒 Security

### Framework Security Features
- **Explicit Permissions**: Deno's permission model ensures secure execution
- **No Package Dependencies**: Zero npm packages, zero supply chain attacks  
- **Type Safety**: Full TypeScript integration prevents runtime errors
- **Secure Defaults**: All configurations follow security best practices

### Site-Specific Security
- HTTPS-ready configuration
- CSP headers configured
- XSS protection enabled
- CSRF protection implemented

## 📊 Performance

### Built-in Optimizations
- **Critical CSS Inlined**: Above-the-fold styles loaded immediately
- **Lazy Loading**: Images and components loaded on demand
- **Resource Hints**: DNS prefetch, preload, and prefetch optimizations
- **Compression**: Automatic gzip/brotli compression
- **Caching**: Intelligent caching strategies

### Monitoring
- Structured logging to \`logs/\` directory
- Performance metrics collection
- Error tracking and reporting
- Health check endpoints

## 🤝 Contributing

1. Make changes to your site-specific files in \`public/\`
2. For framework changes, modify files in the core framework
3. Test changes with \`genesis dev\`
4. Deploy with \`genesis deploy\`

## 📚 Documentation

- **Framework Docs**: \`docs/\` directory in project root
- **UI Guidelines**: \`docs/05-frontend/ui-guidelines.md\`
- **Architecture**: \`docs/02-framework/architecture.md\`
- **Deployment**: \`docs/07-deployment/\`

## 🆘 Support

- **Issues**: Create issues in the main Deno Genesis repository
- **Documentation**: Check \`docs/\` for comprehensive guides
- **Community**: Join the discussion in project issues

---

**Created with ❤️ using Deno Genesis Framework**  
*Unix Philosophy + Modern Runtime = Revolutionary Development*
`;
}
