/// <reference lib="deno.ns" />
import { COLLECTIONS } from './collection/registry.ts';
import { scanCollection } from './pipeline/scan.ts';
import { planWork } from './pipeline/plan.ts';
import { executeWork } from './pipeline/execute.ts';
import { printSummary, reportWarnings } from './pipeline/report.ts';
import { VersionManager } from './version/manager.ts';
import type { CollectionSummary } from './pipeline/report.ts';

// ---------------------------------------------------------------------------
// Main build function (used by unified runner)
// ---------------------------------------------------------------------------
export async function runAssetsBuild(): Promise<void> {
  const start = Date.now();
  const date = new Date().toISOString().split('T')[0];
  const summaries: CollectionSummary[] = [];

  for (const col of COLLECTIONS) {
    const state = await scanCollection(col);
    const plan = planWork(state);
    reportWarnings(col, plan);
    const result = await executeWork(col, plan, date);
    const drawnCount = state.drawnIds.size + result.registered.length;
    summaries.push({ col, plan, result, drawnCount });
  }

  const totalDrawn = summaries.reduce((n, s) => n + s.drawnCount, 0);
  const version = await VersionManager.bumpPatch(totalDrawn);
  printSummary(summaries, VersionManager.format(version), Date.now() - start);

  const hasErrors = summaries.some((s) => s.result.failed.length > 0);
  if (hasErrors) Deno.exit(1);
}

// ---------------------------------------------------------------------------
// Check function (read‑only integrity check)
// ---------------------------------------------------------------------------
export async function runQuickCheck(): Promise<void> {
  console.log('\n🔍 Running integrity check...\n');

  const version = await VersionManager.load();
  console.log(`  Version: ${VersionManager.format(version)}\n`);

  for (const collection of COLLECTIONS) {
    // Reuse the existing scan + plan logic to derive integrity info
    const state = await scanCollection(collection);
    const plan = planWork(state);

    const rawFilesCount = state.rawIds.size;
    const fullFilesCount = state.fullIds.size;
    const thumbFilesCount = state.thumbIds.size;

    console.log(`${collection.emoji} ${collection.label}s`);
    console.log(`  Drawn in JSON: ${state.drawnIds.size}`);
    console.log(`  Raw PNGs:      ${rawFilesCount}`);
    console.log(`  Full WebPs:    ${fullFilesCount}`);
    console.log(`  Thumbnails:    ${thumbFilesCount}`);

    const checks = [
      { label: 'Missing PNGs for drawn items', items: plan.missingRaw },
      { label: 'PNGs not in JSON', items: plan.toRegister },
      { label: 'Missing full WebPs', items: plan.toTranscode },
      { label: 'Missing thumbnails', items: plan.toTranscodeThumb },
      { label: 'Orphaned full WebPs', items: plan.orphanedFull },
      { label: 'Orphaned thumbnails', items: plan.orphanedThumb },
    ];

    let allGood = true;
    for (const { label, items } of checks) {
      if (items.length > 0) {
        allGood = false;
        console.log(
          `  ⚠️  ${label} (${items.length}): ${items.slice(0, 5).join(', ')}${
            items.length > 5 ? '…' : ''
          }`,
        );
      }
    }
    if (allGood) console.log('  ✅ All checks passed');
    console.log('');
  }
}

// ---------------------------------------------------------------------------
// CLI command handling
// ---------------------------------------------------------------------------
const COMMANDS: Record<string, () => Promise<void>> = {
  build: runAssetsBuild,
  check: runQuickCheck,
  help: () => {
    console.log('Usage: deno run -A script/buildAssets.ts [build|check|help]');
    console.log('');
    console.log('  build   – run asset pipeline (transcode images, update JSON, bump version)');
    console.log('  check   – read‑only integrity report (no writes)');
    console.log('  help    – show this message');
    console.log('');
    console.log('Collections:');
    for (const c of COLLECTIONS) {
      console.log(`  ${c.emoji} ${c.id}  →  ${c.paths.json}`);
    }
    return Promise.resolve();
  },
};

// ---------------------------------------------------------------------------
// Entry point when executed directly
// ---------------------------------------------------------------------------
if (import.meta.main) {
  const cmd = Deno.args[0] ?? 'build';
  const action = COMMANDS[cmd];
  if (!action) {
    console.error(`Unknown command: ${cmd}`);
    Deno.exit(1);
  }
  await action().catch((err) => {
    console.error(`Command failed: ${err.message}`);
    Deno.exit(1);
  });
}
