/// <reference lib="deno.ns" />
/**
 * scripts/build.ts — unified build entry point
 *
 * Modes (pass as CLI flag):
 *   (none)           full build: assets → vite
 *   --assets-only    transcode images, register new items, bump version
 *   --vite-only      frontend bundle only (assumes assets already built)
 *   --check          read-only integrity report, no writes
 */

import { COLLECTIONS } from './collection/registry.ts';
import { scanCollection } from './pipeline/scan.ts';
import { planWork } from './pipeline/plan.ts';
import { executeWork } from './pipeline/execute.ts';
import { printCheckReport, printSummary, reportWarnings } from './pipeline/report.ts';
import { VersionManager } from './version/manager.ts';
import type { CollectionSummary } from './pipeline/report.ts';

// ---------------------------------------------------------------------------
// Assets build
// ---------------------------------------------------------------------------

export async function buildAssets(): Promise<void> {
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

  const failed = summaries.flatMap((s) =>
    s.result.failed.map((f) => `${s.col.id}/${f.id}: ${f.reason}`)
  );
  if (failed.length > 0) {
    throw new Error(`asset build failed:\n${failed.map((f) => `  ${f}`).join('\n')}`);
  }
}

// ---------------------------------------------------------------------------
// Vite build (subprocess)
// ---------------------------------------------------------------------------

export async function buildVite(): Promise<void> {
  console.log('\n  vite\n');

  const { code } = await new Deno.Command('deno', {
    args: ['run', '-A', '--node-modules-dir', 'npm:vite', 'build'],
    stdout: 'inherit',
    stderr: 'inherit',
  }).output();

  if (code !== 0) throw new Error(`vite exited with code ${code}`);
}

// ---------------------------------------------------------------------------
// Check (read-only)
// ---------------------------------------------------------------------------

export async function checkIntegrity(): Promise<void> {
  const version = await VersionManager.load();
  const rows: Array<{
    col: typeof COLLECTIONS[0];
    state: Awaited<ReturnType<typeof scanCollection>>;
    plan: ReturnType<typeof planWork>;
  }> = [];

  for (const col of COLLECTIONS) {
    const state = await scanCollection(col);
    const plan = planWork(state);
    rows.push({ col, state, plan });
  }

  printCheckReport(rows, VersionManager.format(version));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const args = new Set(Deno.args);

  const run = async () => {
    if (args.has('--check')) {
      await checkIntegrity();
      return;
    }
    if (args.has('--assets-only')) {
      await buildAssets();
      return;
    }
    if (args.has('--vite-only')) {
      await buildVite();
      return;
    }
    // Default: full build
    await buildAssets();
    await buildVite();
  };

  run().catch((err) => {
    console.error('\n  build failed:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) console.error(err.stack);
    Deno.exit(1);
  });
}
