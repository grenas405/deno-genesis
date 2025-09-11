// Save this as diagnostic.ts in your framework root
import { validateFrameworkIntegrity } from "./core/meta.ts";

const result = await validateFrameworkIntegrity();
console.log("\n=== FRAMEWORK INTEGRITY DIAGNOSIS ===");
console.log("Overall Status:", result.overall ? "✅ PASSED" : "❌ ISSUES DETECTED");

// Show specific issues
if (result.details.missingFiles?.length) {
  console.log("\n📄 Missing Files:");
  result.details.missingFiles.forEach(file => console.log(`  - ${file}`));
}

if (result.details.configErrors?.length) {
  console.log("\n⚙️ Config Errors:");
  result.details.configErrors.forEach(error => console.log(`  - ${error}`));
}

if (result.details.warnings?.length) {
  console.log("\n⚠️ Warnings:");
  result.details.warnings.forEach(warning => console.log(`  - ${warning}`));
}