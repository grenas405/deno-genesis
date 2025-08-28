// File: setup-symbolic-links.ts
// Run with: deno run --allow-read --allow-write setup_framework_links.ts

const FRAMEWORK_PATH = "/home/admin/deno-genesis";
const SITES_PATH = "/home/admin/deno-genesis/sites";

console.log("🚀 Setting up DenoGenesis Framework Links with Auto-Detection...");

// Ensure directories exist
await Deno.mkdir(FRAMEWORK_PATH, { recursive: true });
await Deno.mkdir(SITES_PATH, { recursive: true });

/**
 * Auto-detect site directories in the sites folder
 * @returns Array of valid site directory names
 */
async function autoDetectSites(): Promise<string[]> {
  const detectedSites: string[] = [];
  
  console.log("🔍 Auto-detecting site directories...");
  
  try {
    // Read all entries in the sites directory
    for await (const entry of Deno.readDir(SITES_PATH)) {
      if (entry.isDirectory) {
        const sitePath = `${SITES_PATH}/${entry.name}`;
        
        // Validate that this is a legitimate site directory
        const isValidSite = await validateSiteDirectory(sitePath, entry.name);
        
        if (isValidSite) {
          detectedSites.push(entry.name);
          console.log(`✅ Detected valid site: ${entry.name}`);
        } else {
          console.log(`⚠️  Skipping invalid directory: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading sites directory: ${error.message}`);
    return [];
  }
  
  console.log(`📊 Total sites detected: ${detectedSites.length}`);
  return detectedSites;
}

/**
 * Validate if a directory is a legitimate site directory
 * @param sitePath Full path to the site directory
 * @param siteName Name of the site directory
 * @returns true if valid site, false otherwise
 */
async function validateSiteDirectory(sitePath: string, siteName: string): Promise<boolean> {
  try {
    // Check for common site structure indicators
    const indicators = [
      'main.ts',           // Deno entry point
      'deno.json',         // Deno configuration
      'routes',            // Routes directory
      'public',            // Public assets
      'package.json',      // Node.js projects
      'index.html',        // Static sites
      '.git',              // Git repository
      'README.md'          // Documentation
    ];
    
    let indicatorCount = 0;
    const foundIndicators: string[] = [];
    
    // Check for each indicator
    for (const indicator of indicators) {
      try {
        const indicatorPath = `${sitePath}/${indicator}`;
        const stat = await Deno.stat(indicatorPath);
        
        if (stat.isFile || stat.isDirectory) {
          indicatorCount++;
          foundIndicators.push(indicator);
        }
      } catch {
        // Indicator doesn't exist, continue
      }
    }
    
    // Additional validation rules
    const validationRules = {
      // Must have at least 2 indicators
      hasMinimumIndicators: indicatorCount >= 2,
      
      // Must not be system/hidden directory (starts with .)
      isNotHiddenDir: !siteName.startsWith('.'),
      
      // Must not be common non-site directories
      isNotSystemDir: ![
        'node_modules', 'dist', 'build', '.git', 
        'logs', 'tmp', 'temp', '.cache'
      ].includes(siteName.toLowerCase()),
      
      // Should have reasonable directory name length
      hasReasonableName: siteName.length >= 2 && siteName.length <= 50,
      
      // Should not contain invalid characters for web projects
      hasValidCharacters: /^[a-zA-Z0-9_\-\.]+$/.test(siteName)
    };
    
    const isValid = Object.values(validationRules).every(rule => rule);
    
    if (isValid) {
      console.log(`   📋 ${siteName} validation:`, {
        indicators: foundIndicators.length,
        found: foundIndicators.join(', ')
      });
    }
    
    return isValid;
    
  } catch (error) {
    console.error(`❌ Error validating ${siteName}: ${error.message}`);
    return false;
  }
}

/**
 * Setup framework links for a specific site
 * @param siteName Name of the site to setup
 */
async function setupSiteLinks(siteName: string): Promise<boolean> {
  const SITE_PATH = `${SITES_PATH}/${siteName}`;
  
  try {
    console.log(`📁 Setting up links for: ${siteName}`);

    // Framework directories to link
    const frameworkDirs = ["middleware", "database", "config", "utils", "types"];
    
    // Remove old framework directories
    for (const dir of frameworkDirs) {
      try {
        await Deno.remove(`${SITE_PATH}/${dir}`, { recursive: true });
        console.log(`   🗑️  Removed old ${dir} directory`);
      } catch {
        // Ignore if doesn't exist
      }
    }

    // Create symbolic links to framework core
    const linkPromises = frameworkDirs.map(async (dir) => {
      try {
        const sourcePath = `${FRAMEWORK_PATH}/core/${dir}`;
        const targetPath = `${SITE_PATH}/${dir}`;
        
        // Check if source exists
        await Deno.stat(sourcePath);
        
        // Create the symlink
        await Deno.symlink(sourcePath, targetPath, { type: "dir" });
        console.log(`   🔗 Linked ${dir}`);
        return { dir, success: true };
      } catch (error) {
        console.warn(`   ⚠️  Failed to link ${dir}: ${error.message}`);
        return { dir, success: false, error: error.message };
      }
    });

    const linkResults = await Promise.all(linkPromises);

    // Link shared components
    try {
      await Deno.mkdir(`${SITE_PATH}/public`, { recursive: true });
      
      const sharedComponentsSource = `${FRAMEWORK_PATH}/shared-components`;
      const sharedComponentsTarget = `${SITE_PATH}/public/shared-components`;
      
      // Remove old shared-components link
      try {
        await Deno.remove(sharedComponentsTarget, { recursive: true });
      } catch {
        // Ignore if doesn't exist
      }
      
      await Deno.symlink(sharedComponentsSource, sharedComponentsTarget, { type: "dir" });
      console.log(`   🔗 Linked shared-components`);
    } catch (error) {
      console.warn(`   ⚠️  Failed to link shared-components: ${error.message}`);
    }

    // Summary for this site
    const successCount = linkResults.filter(r => r.success).length;
    const totalLinks = linkResults.length + 1; // +1 for shared-components
    
    console.log(`✅ Links created for ${siteName} (${successCount}/${frameworkDirs.length} framework dirs + shared-components)`);
    
    return successCount === frameworkDirs.length;

  } catch (error) {
    console.error(`❌ Failed to setup links for ${siteName}: ${error.message}`);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log("🎯 Starting DenoGenesis Framework Auto-Setup...\n");
  
  // Step 1: Auto-detect sites
  const detectedSites = await autoDetectSites();
  
  if (detectedSites.length === 0) {
    console.log("❌ No valid sites detected in the sites directory!");
    console.log(`📍 Checked directory: ${SITES_PATH}`);
    console.log("💡 Make sure your sites have at least 2 of these indicators:");
    console.log("   - main.ts, deno.json, routes/, public/, package.json, index.html, .git/, README.md");
    return;
  }
  
  console.log(`\n🚀 Proceeding with ${detectedSites.length} detected sites...\n`);
  
  // Step 2: Setup links for each detected site
  const setupResults = [];
  
  for (const siteName of detectedSites) {
    const success = await setupSiteLinks(siteName);
    setupResults.push({ siteName, success });
    console.log(""); // Add spacing between sites
  }
  
  // Step 3: Final summary
  console.log("=" .repeat(60));
  console.log("🎯 Framework linking complete!");
  console.log(`📍 Framework location: ${FRAMEWORK_PATH}`);
  console.log(`📁 Sites location: ${SITES_PATH}`);
  console.log("");
  
  const successfulSites = setupResults.filter(r => r.success);
  const failedSites = setupResults.filter(r => !r.success);
  
  console.log("📊 Setup Summary:");
  console.log(`   ✅ Successful: ${successfulSites.length}/${detectedSites.length} sites`);
  
  if (successfulSites.length > 0) {
    console.log("   🔗 Successfully linked sites:");
    successfulSites.forEach(site => {
      console.log(`      • ${site.siteName}`);
    });
  }
  
  if (failedSites.length > 0) {
    console.log("   ❌ Failed sites:");
    failedSites.forEach(site => {
      console.log(`      • ${site.siteName}`);
    });
    console.log("   💡 Check the error messages above for details");
  }
  
  console.log("\n🔗 All valid sites now use centralized framework");
  
  if (successfulSites.length === detectedSites.length) {
    console.log("🎉 Perfect! All sites successfully configured!");
  }
}

// Run the main function
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    Deno.exit(1);
  }
}