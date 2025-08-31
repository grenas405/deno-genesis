// denogenesis-framework/core/meta.ts
export interface FrameworkMetadata {
  version: string;
  buildDate: string;
  gitHash?: string;
  centralizedAt: string;
  sites: SiteMetadata[];
}

export async function getFrameworkMetadata(): Promise<FrameworkMetadata> {
  const versionPath = "/home/admin/deno-genesis/VERSION";
  const versionContent = await Deno.readTextFile(versionPath);
  const lines = versionContent.split('\\n');

  const version = lines[0] || 'unknown';
  const buildDate = lines.find(line => line.startsWith('Build Date:'))?.replace('Build Date: ', '') || 'unknown';
  const centralizedAt = lines.find(line => line.startsWith('Centralized:'))?.replace('Centralized: ', '') || 'unknown';

  const sites = await getConnectedSites();

  return {
    version,
    buildDate,
    centralizedAt,
    sites
  };
}

export async function getConnectedSites(): Promise<SiteMetadata[]> {
  const sites: SiteMetadata[] = [];
  const sitesPath = "/home/admin/deno-genesis/sites";

  for await (const dirEntry of Deno.readDir(sitesPath)) {
    if (dirEntry.isDirectory) {
      const sitePath = `${sitesPath}/${dirEntry.name}`;
      const versionFile = `${sitePath}/FRAMEWORK_VERSION`;

      try {
        await Deno.stat(versionFile);
        const siteConfig = await readSiteConfig(`${sitePath}/site-config.ts`);

        sites.push({
          name: siteConfig.name || dirEntry.name,
          port: siteConfig.port || 3000,
          siteKey: siteConfig.siteKey || dirEntry.name,
          domain: siteConfig.domain || 'localhost',
          status: await checkSiteRunning(siteConfig.port) ? 'active' : 'inactive',
          frameworkVersion: await getSiteFrameworkVersion(versionFile)
        });
      } catch {
        // Not a framework site
      }
    }
  }

  return sites;
}

async function getFrameworkVersion(versionFile: string): Promise<string> {
  try {
    const content = await Deno.readTextFile(versionFile);
    return content.split('\\n')[0];
  } catch {
    return 'unknown';
  }
}

async function checkSiteRunning(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Framework integrity validation interfaces
export interface IntegrityCheckResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: IntegrityCheck[];
}

export interface IntegrityCheck {
  name: string;
  category: 'critical' | 'warning' | 'info';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
}

export interface SiteMetadata {
  name: string;
  port: number;
  siteKey: string;
  domain: string;
  status: 'active' | 'inactive';
  frameworkVersion: string;
}

// Framework integrity validation function
export async function validateFrameworkIntegrity(): Promise<IntegrityCheckResult> {
  const result: IntegrityCheckResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: []
  };

  console.log("🔍 Starting Framework Integrity Validation...");

  try {
    // 1. Validate core framework structure
    await validateCoreStructure(result);

    // 2. Validate VERSION file
    await validateVersionFile(result);

    // 3. Validate site structure and links
    await validateSiteStructure(result);

    // 4. Validate framework-site version compatibility
    await validateVersionCompatibility(result);

    // 5. Validate critical dependencies
    await validateDependencies(result);

    // 6. Validate shared components
    await validateSharedComponents(result);

    // Set overall validity based on critical errors
    result.valid = result.checks.filter(check => 
      check.category === 'critical' && check.status === 'failed'
    ).length === 0;

    // Generate summary
    const passed = result.checks.filter(c => c.status === 'passed').length;
    const failed = result.checks.filter(c => c.status === 'failed').length;
    const warnings = result.checks.filter(c => c.status === 'warning').length;

    console.log(`✅ Integrity validation complete: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    
    return result;

  } catch (error) {
    console.error("❌ Framework integrity validation failed:", error);
    result.valid = false;
    result.errors.push(`Validation process failed: ${error.message}`);
    result.checks.push({
      name: 'Validation Process',
      category: 'critical',
      status: 'failed',
      message: `Integrity validation encountered an error: ${error.message}`
    });
    
    return result;
  }
}

// Validate core framework directory structure
async function validateCoreStructure(result: IntegrityCheckResult): Promise<void> {
  const frameworkPath = "/home/admin/deno-genesis";
  const requiredDirectories = [
    "core",
    "core/middleware",
    "core/database", 
    "core/config",
    "core/utils",
    "core/types",
    "shared-components",
    "scripts",
    "sites"
  ];

  const requiredFiles = [
    "VERSION",
    "mod.ts",
    "core/meta.ts",
    "core/middleware/index.ts",
    "core/database/client.ts",
    "core/config/env.ts"
  ];

  // Check directories
  for (const dir of requiredDirectories) {
    const fullPath = `${frameworkPath}/${dir}`;
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isDirectory) {
        result.checks.push({
          name: `Core Directory: ${dir}`,
          category: 'critical',
          status: 'passed',
          message: `Directory exists and is accessible`
        });
      } else {
        result.errors.push(`${dir} exists but is not a directory`);
        result.checks.push({
          name: `Core Directory: ${dir}`,
          category: 'critical',
          status: 'failed',
          message: `Path exists but is not a directory`
        });
      }
    } catch {
      result.errors.push(`Core directory missing: ${dir}`);
      result.checks.push({
        name: `Core Directory: ${dir}`,
        category: 'critical',
        status: 'failed',
        message: `Required directory is missing or inaccessible`
      });
    }
  }

  // Check required files
  for (const file of requiredFiles) {
    const fullPath = `${frameworkPath}/${file}`;
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isFile) {
        result.checks.push({
          name: `Core File: ${file}`,
          category: 'critical',
          status: 'passed',
          message: `File exists and is readable`
        });
      } else {
        result.errors.push(`${file} exists but is not a file`);
        result.checks.push({
          name: `Core File: ${file}`,
          category: 'critical',
          status: 'failed',
          message: `Path exists but is not a file`
        });
      }
    } catch {
      result.errors.push(`Core file missing: ${file}`);
      result.checks.push({
        name: `Core File: ${file}`,
        category: 'critical',
        status: 'failed',
        message: `Required file is missing or inaccessible`
      });
    }
  }
}

// Validate VERSION file format and content
async function validateVersionFile(result: IntegrityCheckResult): Promise<void> {
  const versionPath = "/home/admin/deno-genesis/VERSION";
  
  try {
    const versionContent = await Deno.readTextFile(versionPath);
    const lines = versionContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      result.errors.push("VERSION file is empty");
      result.checks.push({
        name: 'VERSION File Content',
        category: 'critical',
        status: 'failed',
        message: 'VERSION file contains no content'
      });
      return;
    }

    // Validate version format (should be semantic versioning)
    const version = lines[0];
    const versionPattern = /^\d+\.\d+\.\d+/;
    
    if (!versionPattern.test(version)) {
      result.warnings.push(`VERSION format may be invalid: ${version}`);
      result.checks.push({
        name: 'VERSION Format',
        category: 'warning',
        status: 'warning',
        message: `Version "${version}" doesn't follow semantic versioning`
      });
    } else {
      result.checks.push({
        name: 'VERSION Format',
        category: 'info',
        status: 'passed',
        message: `Version format is valid: ${version}`
      });
    }

    // Check for build date
    const buildDateLine = lines.find(line => line.startsWith('Build Date:'));
    if (!buildDateLine) {
      result.warnings.push("Build Date not found in VERSION file");
      result.checks.push({
        name: 'Build Date',
        category: 'warning',
        status: 'warning',
        message: 'Build Date information is missing from VERSION file'
      });
    } else {
      result.checks.push({
        name: 'Build Date',
        category: 'info',
        status: 'passed',
        message: 'Build Date information is present'
      });
    }

    // Check for centralized timestamp
    const centralizedLine = lines.find(line => line.startsWith('Centralized:'));
    if (!centralizedLine) {
      result.warnings.push("Centralized timestamp not found in VERSION file");
      result.checks.push({
        name: 'Centralized Timestamp',
        category: 'warning',
        status: 'warning',
        message: 'Centralized timestamp is missing from VERSION file'
      });
    } else {
      result.checks.push({
        name: 'Centralized Timestamp',
        category: 'info',
        status: 'passed',
        message: 'Centralized timestamp is present'
      });
    }

  } catch (error) {
    result.errors.push(`Failed to read VERSION file: ${error.message}`);
    result.checks.push({
      name: 'VERSION File Access',
      category: 'critical',
      status: 'failed',
      message: `Cannot read VERSION file: ${error.message}`
    });
  }
}

// Validate site structure and symbolic links
async function validateSiteStructure(result: IntegrityCheckResult): Promise<void> {
  const sitesPath = "/home/admin/deno-genesis/sites";
  const frameworkPath = "/home/admin/deno-genesis";
  const requiredLinks = [
    'middleware',
    'database', 
    'config',
    'utils',
    'types'
  ];

  try {
    for await (const dirEntry of Deno.readDir(sitesPath)) {
      if (dirEntry.isDirectory) {
        const sitePath = `${sitesPath}/${dirEntry.name}`;
        
        // Check if this is a framework site (has FRAMEWORK_VERSION file)
        const versionFile = `${sitePath}/FRAMEWORK_VERSION`;
        try {
          await Deno.stat(versionFile);
          
          // Validate symbolic links for this site
          for (const linkName of requiredLinks) {
            const linkPath = `${sitePath}/${linkName}`;
            const expectedTarget = `${frameworkPath}/core/${linkName}`;
            
            try {
              const stat = await Deno.lstat(linkPath);
              if (stat.isSymlink) {
                const target = await Deno.readLink(linkPath);
                if (target === expectedTarget) {
                  result.checks.push({
                    name: `Site Link: ${dirEntry.name}/${linkName}`,
                    category: 'critical',
                    status: 'passed',
                    message: `Symbolic link is correctly configured`
                  });
                } else {
                  result.errors.push(`Site ${dirEntry.name}: ${linkName} points to wrong target: ${target}`);
                  result.checks.push({
                    name: `Site Link: ${dirEntry.name}/${linkName}`,
                    category: 'critical',
                    status: 'failed',
                    message: `Symbolic link points to wrong target: ${target}`
                  });
                }
              } else {
                result.errors.push(`Site ${dirEntry.name}: ${linkName} is not a symbolic link`);
                result.checks.push({
                  name: `Site Link: ${dirEntry.name}/${linkName}`,
                  category: 'critical',
                  status: 'failed',
                  message: `Path exists but is not a symbolic link`
                });
              }
            } catch {
              result.errors.push(`Site ${dirEntry.name}: missing symbolic link for ${linkName}`);
              result.checks.push({
                name: `Site Link: ${dirEntry.name}/${linkName}`,
                category: 'critical',
                status: 'failed',
                message: `Required symbolic link is missing`
              });
            }
          }

          // Check for site-config.ts
          const siteConfigPath = `${sitePath}/site-config.ts`;
          try {
            await Deno.stat(siteConfigPath);
            result.checks.push({
              name: `Site Config: ${dirEntry.name}`,
              category: 'critical',
              status: 'passed',
              message: `Site configuration file exists`
            });
          } catch {
            result.warnings.push(`Site ${dirEntry.name}: missing site-config.ts`);
            result.checks.push({
              name: `Site Config: ${dirEntry.name}`,
              category: 'warning',
              status: 'warning',
              message: `Site configuration file is missing`
            });
          }

        } catch {
          // Not a framework site, skip validation
          continue;
        }
      }
    }
  } catch (error) {
    result.errors.push(`Failed to validate site structure: ${error.message}`);
    result.checks.push({
      name: 'Sites Directory Access',
      category: 'critical',
      status: 'failed',
      message: `Cannot access sites directory: ${error.message}`
    });
  }
}

// Validate version compatibility between framework and sites
async function validateVersionCompatibility(result: IntegrityCheckResult): Promise<void> {
  try {
    // Get framework version
    const frameworkMetadata = await getFrameworkMetadata();
    const frameworkVersion = frameworkMetadata.version;

    // Get all connected sites
    const sites = await getConnectedSites();

    let compatibilityIssues = 0;

    for (const site of sites) {
      if (site.frameworkVersion === 'unknown') {
        result.warnings.push(`Site ${site.name}: framework version is unknown`);
        result.checks.push({
          name: `Version Compatibility: ${site.name}`,
          category: 'warning',
          status: 'warning',
          message: `Site framework version is unknown`
        });
      } else if (site.frameworkVersion !== frameworkVersion) {
        compatibilityIssues++;
        result.warnings.push(`Site ${site.name}: version mismatch (site: ${site.frameworkVersion}, framework: ${frameworkVersion})`);
        result.checks.push({
          name: `Version Compatibility: ${site.name}`,
          category: 'warning',
          status: 'warning',
          message: `Version mismatch - Site: ${site.frameworkVersion}, Framework: ${frameworkVersion}`
        });
      } else {
        result.checks.push({
          name: `Version Compatibility: ${site.name}`,
          category: 'info',
          status: 'passed',
          message: `Versions are compatible: ${site.frameworkVersion}`
        });
      }
    }

    if (compatibilityIssues === 0) {
      result.checks.push({
        name: 'Overall Version Compatibility',
        category: 'info',
        status: 'passed',
        message: `All ${sites.length} sites have compatible framework versions`
      });
    } else {
      result.warnings.push(`${compatibilityIssues} sites have version compatibility issues`);
    }

  } catch (error) {
    result.errors.push(`Failed to validate version compatibility: ${error.message}`);
    result.checks.push({
      name: 'Version Compatibility Check',
      category: 'critical',
      status: 'failed',
      message: `Version compatibility validation failed: ${error.message}`
    });
  }
}

// Validate critical dependencies and permissions
async function validateDependencies(result: IntegrityCheckResult): Promise<void> {
  // Check Deno installation and permissions
  try {
    const denoVersion = await new TextDecoder().decode(
      await new Deno.Command("deno", { args: ["--version"] }).output()
    );
    
    if (denoVersion.includes("deno")) {
      result.checks.push({
        name: 'Deno Runtime',
        category: 'critical',
        status: 'passed',
        message: 'Deno runtime is available and accessible'
      });
    } else {
      result.errors.push("Deno runtime validation failed");
      result.checks.push({
        name: 'Deno Runtime',
        category: 'critical',
        status: 'failed',
        message: 'Deno runtime validation returned unexpected output'
      });
    }
  } catch (error) {
    result.errors.push(`Deno runtime not accessible: ${error.message}`);
    result.checks.push({
      name: 'Deno Runtime',
      category: 'critical',
      status: 'failed',
      message: `Deno runtime is not accessible: ${error.message}`
    });
  }

  // Check read/write permissions on critical directories
  const criticalPaths = [
    "/home/admin/deno-genesis",
    "/home/admin/deno-genesis/sites",
    "/home/admin/deno-genesis/core"
  ];

  for (const path of criticalPaths) {
    try {
      // Test read access
      await Deno.readDir(path);
      
      // Test write access with a temporary file
      const testFile = `${path}/.integrity-test-${Date.now()}`;
      try {
        await Deno.writeTextFile(testFile, "test");
        await Deno.remove(testFile);
        
        result.checks.push({
          name: `Directory Permissions: ${path}`,
          category: 'critical',
          status: 'passed',
          message: 'Read/write permissions are sufficient'
        });
      } catch {
        result.warnings.push(`Limited write access to ${path}`);
        result.checks.push({
          name: `Directory Permissions: ${path}`,
          category: 'warning',
          status: 'warning',
          message: 'Directory is readable but may have limited write access'
        });
      }
    } catch (error) {
      result.errors.push(`Cannot access directory: ${path}`);
      result.checks.push({
        name: `Directory Permissions: ${path}`,
        category: 'critical',
        status: 'failed',
        message: `Directory is not accessible: ${error.message}`
      });
    }
  }
}

// Validate shared components structure
async function validateSharedComponents(result: IntegrityCheckResult): Promise<void> {
  const sharedComponentsPath = "/home/admin/deno-genesis/shared-components";
  
  try {
    await Deno.stat(sharedComponentsPath);
    
    // Check if shared components directory has content
    let hasComponents = false;
    for await (const entry of Deno.readDir(sharedComponentsPath)) {
      if (entry.isFile && entry.name.endsWith('.html')) {
        hasComponents = true;
        break;
      }
    }

    if (hasComponents) {
      result.checks.push({
        name: 'Shared Components',
        category: 'info',
        status: 'passed',
        message: 'Shared components directory exists and contains components'
      });
    } else {
      result.warnings.push("Shared components directory is empty");
      result.checks.push({
        name: 'Shared Components',
        category: 'warning',
        status: 'warning',
        message: 'Shared components directory exists but appears to be empty'
      });
    }

    // Validate that sites have shared components linked
    const sitesPath = "/home/admin/deno-genesis/sites";
    for await (const dirEntry of Deno.readDir(sitesPath)) {
      if (dirEntry.isDirectory) {
        const siteSharedPath = `${sitesPath}/${dirEntry.name}/public/shared-components`;
        try {
          const stat = await Deno.lstat(siteSharedPath);
          if (stat.isSymlink) {
            result.checks.push({
              name: `Shared Components Link: ${dirEntry.name}`,
              category: 'info',
              status: 'passed',
              message: 'Shared components are properly linked'
            });
          } else {
            result.warnings.push(`Site ${dirEntry.name}: shared-components is not a symbolic link`);
            result.checks.push({
              name: `Shared Components Link: ${dirEntry.name}`,
              category: 'warning',
              status: 'warning',
              message: 'Shared components path exists but is not a symbolic link'
            });
          }
        } catch {
          // Missing shared components link - may be intentional for some sites
          result.checks.push({
            name: `Shared Components Link: ${dirEntry.name}`,
            category: 'info',
            status: 'warning',
            message: 'Shared components link is not configured for this site'
          });
        }
      }
    }

  } catch {
    result.warnings.push("Shared components directory not found");
    result.checks.push({
      name: 'Shared Components Directory',
      category: 'warning',
      status: 'warning',
      message: 'Shared components directory does not exist'
    });
  }
}

// Helper function to read site config (simplified version)
async function readSiteConfig(configPath: string): Promise<any> {
  try {
    // In a real implementation, you'd need to properly parse the TypeScript module
    // For now, we'll return a basic structure to satisfy the interface
    const content = await Deno.readTextFile(configPath);
    
    // Basic parsing to extract SITE_CONFIG values
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    const portMatch = content.match(/port:\s*(\d+)/);
    const siteKeyMatch = content.match(/siteKey:\s*["']([^"']+)["']/);
    const domainMatch = content.match(/domain:\s*["']([^"']+)["']/);
    
    return {
      name: nameMatch ? nameMatch[1] : 'Unknown',
      port: portMatch ? parseInt(portMatch[1]) : 3000,
      siteKey: siteKeyMatch ? siteKeyMatch[1] : 'unknown',
      domain: domainMatch ? domainMatch[1] : 'localhost'
    };
  } catch {
    return {
      name: 'Unknown',
      port: 3000,
      siteKey: 'unknown',
      domain: 'localhost'
    };
  }
}