// File: setup_framework_links.ts
// Run with: deno run --allow-read --allow-write setup_framework_links.ts

const FRAMEWORK_PATH = "/home/admin/deno-genesis";
const SITES_PATH = "/home/admin/deno-genesis/sites";

console.log("🚀 Setting up DenoGenesis Framework Links...");

// Ensure directories exist
await Deno.mkdir(FRAMEWORK_PATH, { recursive: true });
await Deno.mkdir(SITES_PATH, { recursive: true });

// List of your sites
const SITES = [
  "pedromdominguez",
  "domingueztechsolutions",
  "heavenlyroofing",
  "okdevs",
];

for (const site of SITES) {
  const SITE_PATH = `${SITES_PATH}/${site}`;
  try {
    const stat = await Deno.stat(SITE_PATH);
    if (stat.isDirectory) {
      console.log(`📁 Setting up links for: ${site}`);

      // Remove old framework directories
      for (const dir of ["middleware", "database", "config", "utils", "types"]) {
        try {
          await Deno.remove(`${SITE_PATH}/${dir}`, { recursive: true });
        } catch {
          // Ignore if doesn't exist
        }
      }

      // Create symbolic links to framework
      await Deno.symlink(`${FRAMEWORK_PATH}/core/middleware`, `${SITE_PATH}/middleware`, { type: "dir" });
      await Deno.symlink(`${FRAMEWORK_PATH}/core/database`, `${SITE_PATH}/database`, { type: "dir" });
      await Deno.symlink(`${FRAMEWORK_PATH}/core/config`, `${SITE_PATH}/config`, { type: "dir" });
      await Deno.symlink(`${FRAMEWORK_PATH}/core/utils`, `${SITE_PATH}/utils`, { type: "dir" });
      await Deno.symlink(`${FRAMEWORK_PATH}/core/types`, `${SITE_PATH}/types`, { type: "dir" });

      // Link shared components
      await Deno.mkdir(`${SITE_PATH}/public`, { recursive: true });
      await Deno.symlink(`${FRAMEWORK_PATH}/shared-components`, `${SITE_PATH}/public/shared-components`, { type: "dir" });

      console.log(`✅ Links created for ${site}`);
    }
  } catch {
    console.log(`⚠️  Site directory not found: ${site}`);
  }
}

console.log("🎯 Framework linking complete!");
console.log(`📍 Framework location: ${FRAMEWORK_PATH}`);
console.log("🔗 All sites now use centralized framework");
