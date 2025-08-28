# 🚀 DenoGenesis Framework Distribution System

**Enterprise Multi-Site Framework Management**  
**Version:** 1.0  
**Author:** Pedro M. Dominguez - DenoGenesis Framework Team  
**Purpose:** Single source of truth for framework across multiple isolated sites

---

## 🎯 Problem Statement

**Current Issue:** Multiple DenoGenesis repositories with different framework versions
- ✅ **Isolated by ports** (3000, 3001, 3002, 3003, 3004) ✓
- ❌ **Different framework versions** across sites ✗
- ❌ **Duplicate framework code** in each repository ✗
- ❌ **Inconsistent updates** when framework evolves ✗

**Solution:** Centralized framework distribution with site-specific configurations

---

## 🏗️ Recommended Architecture

### Directory Structure Overview
```
/home/pedro/
├── denogenesis-framework/           # 📦 SINGLE SOURCE OF TRUTH
│   ├── core/                        # Framework core files
│   │   ├── middleware/
│   │   ├── database/
│   │   ├── config/
│   │   ├── utils/
│   │   └── types/
│   ├── templates/                   # Site templates
│   ├── shared-components/           # Reusable components
│   ├── VERSION                      # Framework version
│   └── distribution/                # Distribution scripts
├── sites/                          # 🎯 INDIVIDUAL SITES
│   ├── pedromdominguez-com/         # Port 3003
│   ├── domingueztechsolutions-com/  # Port 3000
│   ├── heavenlyroofingok-com/       # Port 3001
│   ├── okdevs-xyz/                  # Port 3002
│   └── efficientmoversllc-com/      # Port 3004
└── shared/                         # 🔗 SYMLINKS TO FRAMEWORK
    └── denogenesis -> ../denogenesis-framework/
```

---

## 📦 Framework Distribution Methods

### Method 1: Symbolic Links (Recommended)

#### **Setup Script**
```bash
#!/bin/bash
# setup-framework-links.sh

FRAMEWORK_PATH="/home/pedro/denogenesis-framework"
SITES_PATH="/home/pedro/sites"

echo "🚀 Setting up DenoGenesis Framework Links..."

# Create framework directory if it doesn't exist
mkdir -p "$FRAMEWORK_PATH"
mkdir -p "$SITES_PATH"

# List of your sites
SITES=(
    "pedromdominguez-com"
    "domingueztechsolutions-com" 
    "heavenlyroofingok-com"
    "okdevs-xyz"
    "efficientmoversllc-com"
)

# Create symbolic links for each site
for site in "${SITES[@]}"; do
    SITE_PATH="$SITES_PATH/$site"
    
    if [ -d "$SITE_PATH" ]; then
        echo "📁 Setting up links for: $site"
        
        # Remove existing framework directories if they exist
        rm -rf "$SITE_PATH/middleware"
        rm -rf "$SITE_PATH/database"
        rm -rf "$SITE_PATH/config"
        rm -rf "$SITE_PATH/utils"
        rm -rf "$SITE_PATH/types"
        
        # Create symbolic links to framework
        ln -sf "$FRAMEWORK_PATH/core/middleware" "$SITE_PATH/middleware"
        ln -sf "$FRAMEWORK_PATH/core/database" "$SITE_PATH/database" 
        ln -sf "$FRAMEWORK_PATH/core/config" "$SITE_PATH/config"
        ln -sf "$FRAMEWORK_PATH/core/utils" "$SITE_PATH/utils"
        ln -sf "$FRAMEWORK_PATH/core/types" "$SITE_PATH/types"
        
        # Link shared components
        ln -sf "$FRAMEWORK_PATH/shared-components" "$SITE_PATH/public/shared-components"
        
        echo "✅ Links created for $site"
    else
        echo "⚠️  Site directory not found: $site"
    fi
done

echo "🎯 Framework linking complete!"
echo "📍 Framework location: $FRAMEWORK_PATH"
echo "🔗 All sites now use centralized framework"
```

#### **Directory Structure After Linking**
```
/home/pedro/sites/pedromdominguez-com/
├── main.ts                    # Site-specific entry point
├── routes/                    # Site-specific routes
├── controllers/               # Site-specific controllers  
├── services/                  # Site-specific business logic
├── models/                    # Site-specific data models
├── public/                    # Site-specific assets
├── .env                       # Site-specific environment
├── deno.json                  # Site-specific Deno config
├── middleware -> /home/pedro/denogenesis-framework/core/middleware/     # 🔗 LINK
├── database -> /home/pedro/denogenesis-framework/core/database/         # 🔗 LINK  
├── config -> /home/pedro/denogenesis-framework/core/config/             # 🔗 LINK
├── utils -> /home/pedro/denogenesis-framework/core/utils/               # 🔗 LINK
└── types -> /home/pedro/denogenesis-framework/core/types/               # 🔗 LINK
```

### Method 2: NPM-Style Package Management

#### **Framework Package Structure**
```
denogenesis-framework/
├── package.json               # Framework metadata
├── mod.ts                     # Main framework export
├── core/                      # Framework core
├── VERSION                    # Version tracking
└── install.ts                 # Installation script
```

#### **Framework Installation Script**
```typescript
// denogenesis-framework/install.ts
import { copy, ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

interface InstallConfig {
  sitePath: string;
  port: number;
  siteKey: string;
  frameworkPath: string;
}

export async function installFramework(config: InstallConfig) {
  console.log(`🚀 Installing DenoGenesis Framework for port ${config.port}...`);
  
  const frameworkPath = config.frameworkPath;
  const sitePath = config.sitePath;
  
  try {
    // Read framework version
    const versionContent = await Deno.readTextFile(`${frameworkPath}/VERSION`);
    const [version] = versionContent.split('\n');
    
    console.log(`📦 Framework version: ${version}`);
    
    // Copy framework core files
    const coreDirectories = ['middleware', 'database', 'config', 'utils', 'types'];
    
    for (const dir of coreDirectories) {
      const srcPath = resolve(frameworkPath, 'core', dir);
      const destPath = resolve(sitePath, dir);
      
      console.log(`📁 Installing ${dir}...`);
      await copy(srcPath, destPath, { overwrite: true });
    }
    
    // Create site-specific configuration
    await createSiteConfig(sitePath, config);
    
    // Create framework version tracking
    await Deno.writeTextFile(
      `${sitePath}/FRAMEWORK_VERSION`,
      `${version}\nInstalled: ${new Date().toISOString()}\nPort: ${config.port}\nSite Key: ${config.siteKey}`
    );
    
    console.log(`✅ DenoGenesis Framework installed successfully!`);
    console.log(`📍 Site path: ${sitePath}`);
    console.log(`🔑 Port: ${config.port}`);
    
  } catch (error) {
    console.error('❌ Framework installation failed:', error);
    throw error;
  }
}

async function createSiteConfig(sitePath: string, config: InstallConfig) {
  const siteConfig = `// Site-specific configuration - Auto-generated
// DO NOT EDIT MANUALLY - Use 'deno task update-framework' to update

export const SITE_CONFIG = {
  port: ${config.port},
  siteKey: "${config.siteKey}",
  frameworkVersion: await getFrameworkVersion(),
  installedAt: "${new Date().toISOString()}"
};

async function getFrameworkVersion(): Promise<string> {
  try {
    const versionContent = await Deno.readTextFile("./FRAMEWORK_VERSION");
    return versionContent.split('\\n')[0];
  } catch {
    return "unknown";
  }
}
`;

  await Deno.writeTextFile(`${sitePath}/site-config.ts`, siteConfig);
}

// CLI Usage
if (import.meta.main) {
  const sitePath = Deno.args[0];
  const port = parseInt(Deno.args[1]);
  const siteKey = Deno.args[2];
  const frameworkPath = Deno.args[3] || "/home/pedro/denogenesis-framework";
  
  if (!sitePath || !port || !siteKey) {
    console.error("Usage: deno run install.ts <site-path> <port> <site-key> [framework-path]");
    Deno.exit(1);
  }
  
  await installFramework({
    sitePath,
    port, 
    siteKey,
    frameworkPath
  });
}
```

### Method 3: Git Submodules (Advanced)

#### **Framework as Git Submodule**
```bash
# Add framework as submodule to each site
cd /home/pedro/sites/pedromdominguez-com
git submodule add https://github.com/xtcedro/denogenesis-framework.git framework

# Update all sites to use latest framework
git submodule update --remote --merge

# In main.ts, import from submodule
# import { createMiddlewareStack } from "./framework/core/middleware/index.ts";
```

---

## 🔧 Implementation Strategy (Recommended)

### Step 1: Create Centralized Framework

#### **Framework Repository Structure**
```
/home/pedro/denogenesis-framework/
├── VERSION                           # v2.1.0
├── core/                            # 🎯 CORE FRAMEWORK
│   ├── middleware/
│   │   ├── index.ts                 # Your existing middleware/index.ts
│   │   ├── performanceMonitor.ts
│   │   ├── security.ts
│   │   ├── logging.ts
│   │   ├── errorHandler.ts
│   │   └── healthCheck.ts
│   ├── database/
│   │   └── client.ts                # Your existing database/client.ts
│   ├── config/
│   │   └── env.ts                   # Your existing config/env.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   └── types/
│       ├── interfaces.ts
│       └── auth.d.ts
├── templates/                       # 🏗️ SITE TEMPLATES
│   ├── portfolio/
│   ├── business-service/
│   └── ecommerce/
├── shared-components/               # 🧩 SHARED COMPONENTS
│   ├── notifications/
│   ├── footer/
│   ├── chatbot/
│   └── search-widget/
└── scripts/                        # 🛠️ DISTRIBUTION SCRIPTS
    ├── install-framework.ts
    ├── update-framework.ts
    └── create-site.ts
```

#### **Framework Core Export**
```typescript
// denogenesis-framework/mod.ts
// Main framework export file

// Core middleware system
export { 
  createMiddlewareStack, 
  MiddlewareManager,
  type MiddlewareConfig 
} from "./core/middleware/index.ts";

// Database system
export { 
  db, 
  databaseManager, 
  executeQuery, 
  getDatabaseStatus,
  closeDatabaseConnection 
} from "./core/database/client.ts";

// Configuration system
export {
  PORT,
  DENO_ENV,
  SITE_KEY,
  SERVER_HOST,
  CORS_ORIGINS,
  VERSION,
  BUILD_DATE,
  BUILD_HASH,
  frameworkConfig,
  dbConfig,
  getEnvironmentInfo
} from "./core/config/env.ts";

// Framework metadata
export { getFrameworkVersion, validateFrameworkIntegrity } from "./core/meta.ts";

// Site creation utilities
export { createNewSite, updateSiteFramework } from "./scripts/site-management.ts";
```

### Step 2: Site Migration Script

#### **Automated Migration Tool**
```typescript
// denogenesis-framework/scripts/migrate-existing-sites.ts

interface SiteInfo {
  name: string;
  path: string;
  port: number;
  siteKey: string;
  domain: string;
}

const EXISTING_SITES: SiteInfo[] = [
  {
    name: "Pedro M. Dominguez Portfolio",
    path: "/home/pedro/sites/pedromdominguez-com",
    port: 3003,
    siteKey: "pedromdominguez",
    domain: "pedromdominguez.com"
  },
  {
    name: "Dominguez Tech Solutions", 
    path: "/home/pedro/sites/domingueztechsolutions-com",
    port: 3000,
    siteKey: "domtech",
    domain: "domingueztechsolutions.com"
  },
  {
    name: "Heavenly Roofing Oklahoma",
    path: "/home/pedro/sites/heavenlyroofingok-com", 
    port: 3001,
    siteKey: "heavenlyroofing",
    domain: "heavenlyroofingok.com"
  },
  {
    name: "OK Devs Community",
    path: "/home/pedro/sites/okdevs-xyz",
    port: 3002, 
    siteKey: "okdevs",
    domain: "okdevs.xyz"
  },
  {
    name: "Efficient Movers LLC",
    path: "/home/pedro/sites/efficientmoversllc-com",
    port: 3004,
    siteKey: "efficientmovers", 
    domain: "efficientmoversllc.com"
  }
];

export async function migrateAllSites() {
  console.log("🔄 Starting DenoGenesis Framework Migration...");
  console.log("========================================");
  
  for (const site of EXISTING_SITES) {
    console.log(`\n📁 Migrating: ${site.name}`);
    console.log(`   Path: ${site.path}`);
    console.log(`   Port: ${site.port}`);
    
    try {
      await migrateSite(site);
      console.log(`✅ ${site.name} migration complete`);
    } catch (error) {
      console.error(`❌ ${site.name} migration failed:`, error.message);
    }
  }
  
  console.log("\n🎯 Migration Summary Complete!");
}

async function migrateSite(site: SiteInfo) {
  const frameworkPath = "/home/pedro/denogenesis-framework";
  
  // 1. Backup existing framework files
  await backupExistingFiles(site.path);
  
  // 2. Remove old framework files
  await removeOldFrameworkFiles(site.path);
  
  // 3. Create symbolic links to centralized framework
  await createFrameworkLinks(site.path, frameworkPath);
  
  // 4. Create site-specific configuration
  await createSiteConfiguration(site);
  
  // 5. Update main.ts to use centralized imports
  await updateMainFile(site);
  
  // 6. Validate migration
  await validateMigration(site);
}

async function backupExistingFiles(sitePath: string) {
  const backupPath = `${sitePath}/backup-${Date.now()}`;
  await Deno.mkdir(backupPath, { recursive: true });
  
  const frameworkDirs = ['middleware', 'database', 'config', 'utils', 'types'];
  
  for (const dir of frameworkDirs) {
    const srcPath = `${sitePath}/${dir}`;
    const destPath = `${backupPath}/${dir}`;
    
    try {
      await Deno.stat(srcPath);
      await copy(srcPath, destPath);
      console.log(`📦 Backed up: ${dir}`);
    } catch {
      console.log(`⏭️  No existing ${dir} directory`);
    }
  }
}

async function removeOldFrameworkFiles(sitePath: string) {
  const frameworkDirs = ['middleware', 'database', 'config', 'utils', 'types'];
  
  for (const dir of frameworkDirs) {
    try {
      await Deno.remove(`${sitePath}/${dir}`, { recursive: true });
      console.log(`🗑️ Removed old ${dir}`);
    } catch {
      console.log(`⏭️ No ${dir} to remove`);
    }
  }
}

async function createFrameworkLinks(sitePath: string, frameworkPath: string) {
  const links = [
    { src: `${frameworkPath}/core/middleware`, dest: `${sitePath}/middleware` },
    { src: `${frameworkPath}/core/database`, dest: `${sitePath}/database` },
    { src: `${frameworkPath}/core/config`, dest: `${sitePath}/config` },
    { src: `${frameworkPath}/core/utils`, dest: `${sitePath}/utils` },
    { src: `${frameworkPath}/core/types`, dest: `${sitePath}/types` }
  ];
  
  for (const link of links) {
    await Deno.symlink(link.src, link.dest);
    console.log(`🔗 Linked: ${link.dest} -> ${link.src}`);
  }
}

async function createSiteConfiguration(site: SiteInfo) {
  const configContent = `// ${site.name} - Site Configuration
// Auto-generated by DenoGenesis Framework Migration
// Last Updated: ${new Date().toISOString()}

import { config as loadEnv } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";

const env = await loadEnv();

// Site-specific overrides for framework configuration
export const SITE_CONFIG = {
  name: "${site.name}",
  port: ${site.port},
  siteKey: "${site.siteKey}", 
  domain: "${site.domain}",
  
  // Environment overrides
  PORT: ${site.port},
  SITE_KEY: "${site.siteKey}",
  SERVER_HOST: env.SERVER_HOST || "localhost",
  
  // Site-specific CORS origins
  CORS_ORIGINS: [
    "http://localhost:${site.port}",
    "https://${site.domain}",
    "https://www.${site.domain}"
  ],
  
  // Framework metadata
  frameworkVersion: await getFrameworkVersion(),
  migratedAt: "${new Date().toISOString()}"
};

async function getFrameworkVersion(): Promise<string> {
  try {
    const versionPath = new URL("../VERSION", import.meta.url);
    const versionContent = await Deno.readTextFile(versionPath);
    return versionContent.split('\\n')[0];
  } catch {
    return "unknown";
  }
}

// Export environment with site overrides
export function getEnvironmentWithSiteConfig() {
  return {
    ...env,
    PORT: SITE_CONFIG.port.toString(),
    SITE_KEY: SITE_CONFIG.siteKey,
    CORS_ORIGINS: SITE_CONFIG.CORS_ORIGINS.join(',')
  };
}
`;

  await Deno.writeTextFile(`${site.path}/site-config.ts`, configContent);
  console.log(`📝 Created site configuration for ${site.name}`);
}

async function updateMainFile(site: SiteInfo) {
  const mainContent = `// ${site.name} - Main Application Entry Point
// Framework: DenoGenesis v2.1+ (Centralized)
// Auto-updated: ${new Date().toISOString()}

import { Application, send } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import router from "./routes/index.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

// Import centralized framework
import {
  createMiddlewareStack,
  MiddlewareManager,
  type MiddlewareConfig
} from "./middleware/index.ts";

import { db, getDatabaseStatus } from "./database/client.ts";

// Import site-specific configuration
import { SITE_CONFIG, getEnvironmentWithSiteConfig } from "./site-config.ts";

// Import shared framework environment
import {
  VERSION,
  BUILD_DATE, 
  BUILD_HASH,
  frameworkConfig
} from "./config/env.ts";

const env = getEnvironmentWithSiteConfig();
const app = new Application();

// ===================================================================
// 🎯 SITE-SPECIFIC FRAMEWORK BOOTUP - ${site.name}
// ===================================================================

console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");
console.log("\\x1b[36m%s\\x1b[0m", \`         \${SITE_CONFIG.name}\`);
console.log("\\x1b[33m%s\\x1b[0m", \`         ⚙️  Framework: DenoGenesis \${VERSION}\`);
console.log("\\x1b[33m%s\\x1b[0m", \`         📅 Build: \${BUILD_DATE}\`);
console.log("\\x1b[33m%s\\x1b[0m", \`         🚀 Port: \${SITE_CONFIG.port}\`);
console.log("\\x1b[33m%s\\x1b[0m", \`         🔑 Site: \${SITE_CONFIG.siteKey}\`);
console.log("\\x1b[33m%s\\x1b[0m", \`         🌍 Domain: \${SITE_CONFIG.domain}\`);
console.log("\\x1b[35m%s\\x1b[0m", "✨========================================================✨");

// Use centralized middleware configuration
const middlewareConfig: MiddlewareConfig = {
  environment: env.DENO_ENV || "development",
  port: SITE_CONFIG.port,
  staticFiles: {
    root: \`\${Deno.cwd()}/public\`,
    enableCaching: env.DENO_ENV === 'production',
    maxAge: env.DENO_ENV === 'production' ? 86400 : 300
  },
  cors: {
    allowedOrigins: SITE_CONFIG.CORS_ORIGINS,
    developmentOrigins: SITE_CONFIG.CORS_ORIGINS.filter(origin => origin.includes('localhost')),
    credentials: true,
    maxAge: env.DENO_ENV === 'production' ? 86400 : 300
  },
  security: {
    enableHSTS: env.DENO_ENV === 'production',
    contentSecurityPolicy: env.DENO_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.skypack.dev https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self';",
    frameOptions: 'SAMEORIGIN'
  },
  logging: {
    logLevel: env.DENO_ENV === 'development' ? 'debug' : 'info',
    logRequests: true,
    logResponses: env.DENO_ENV === 'development'
  },
  healthCheck: {
    endpoint: '/health',
    includeMetrics: true,
    includeEnvironment: true
  }
};

// Create middleware stack using centralized framework
const { monitor, middlewares } = createMiddlewareStack(middlewareConfig);

// Apply middleware
middlewares.forEach(middleware => {
  app.use(middleware);
});

// Site-specific routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
console.log(\`🚀 \${SITE_CONFIG.name} running on port \${SITE_CONFIG.port}\`);
console.log(\`🌐 Framework version: \${VERSION}\`);

await app.listen({
  port: SITE_CONFIG.port,
  hostname: "0.0.0.0"
});
`;

  await Deno.writeTextFile(`${site.path}/main.ts`, mainContent);
  console.log(`📝 Updated main.ts for ${site.name}`);
}

async function validateMigration(site: SiteInfo) {
  // Check that symbolic links exist and are valid
  const frameworkDirs = ['middleware', 'database', 'config', 'utils', 'types'];