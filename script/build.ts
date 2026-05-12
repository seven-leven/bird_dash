// scripts/build.ts
/// <reference lib="deno.ns" />

import { runAssetsBuild } from './buildAssets.ts';
import { runViteBuild } from './buildVite.ts';

async function main() {
  console.log('\n  🔨 Starting full build (assets + frontend)\n');

  // 1. Asset pipeline (images, JSON, version)
  await runAssetsBuild();

  // 2. Vite frontend build
  await runViteBuild();

  console.log('  ✅ Full build completed successfully\n');
}

// We need to export run functions from the other scripts.
// Modify BuildAssets.ts to export a function, and BuildVite.ts to export a function.

if (import.meta.main) {
  main().catch((err) => {
    console.error('  ❌ Build failed:', err.message);
    Deno.exit(1);
  });
}
