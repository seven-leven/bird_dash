// scripts/build.ts
import { runAssetsBuild } from './buildAssets.ts';
import { runViteBuild } from './buildVite.ts';

async function main() {
  console.log("\n  🔨 Starting full build (assets + frontend)\n");
  await runAssetsBuild();
  await runViteBuild();
  console.log("  ✅ Full build completed successfully\n");
}

if (import.meta.main) main().catch(err => {
  console.error("  ❌ Build failed:", err.message);
  Deno.exit(1);
});