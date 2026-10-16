/**
 * script/build/build.ts — unified build entry point
 *
 * Modes (pass as CLI flag):
 *   (none)           full build: assets → vite
 *   --assets-only    transcode images, register new items, bump version
 *   --vite-only      frontend bundle only (assumes assets already built)
 *   --check          read-only integrity report, no writes
 */

import { spawn } from 'node:child_process';
import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { scanCollection } from './scan_sources.ts';
import { blockingIssues, planWork } from './plan_changes.ts';
import { executeWork } from './apply_changes.ts';
import { printCheckReport, printSummary, reportWarnings } from './print_build_summary.ts';
import { computeVersion, describeVersion } from '../version/version.ts';
import { errorMessage } from '../lib/error.ts';
import type { CollectionSummary } from './print_build_summary.ts';

// ---------------------------------------------------------------------------
// Assets build
// ---------------------------------------------------------------------------

export async function buildAssets(collections: Collection[] = COLLECTIONS): Promise<void> {
  const start = Date.now();
  const date = new Date().toISOString().split('T')[0];
  const summaries: CollectionSummary[] = [];

  for (const col of collections) {
    const state = await scanCollection(col);
    const plan = planWork(state);

    reportWarnings(col, plan);

    const result = await executeWork(col, plan, date);
    const drawnCount = state.drawnIds.size + result.registered.length;

    summaries.push({ col, plan, result, drawnCount });
  }

  const version = await computeVersion();

  printSummary(summaries, describeVersion(version), Date.now() - start);

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

/** Start `vite build` and resolve with its exit code. */
function spawnVite(): Promise<number> {
  const root = process.cwd();
  // Vite's own entry point, run with this Node: no shell, so it works the same on Windows.
  const vite = `${root}/node_modules/vite/bin/vite.js`;
  return new Promise((resolve, reject) => {
    spawn(process.execPath, [vite, 'build', '--config', `${root}/vite.config.ts`], {
      cwd: root,
      stdio: 'inherit',
    }).on('error', reject).on('close', (code) => resolve(code ?? 1));
  });
}

export async function buildVite(spawn: () => Promise<number> = spawnVite): Promise<void> {
  console.log('\n  vite\n');
  const code = await spawn();
  if (code !== 0) throw new Error(`vite exited with code ${code}`);
}

// ---------------------------------------------------------------------------
// Check (read-only)
// ---------------------------------------------------------------------------

/** Prints the integrity report and returns how many blocking issues it found. */
export async function checkIntegrity(collections: Collection[] = COLLECTIONS): Promise<number> {
  const version = await computeVersion();
  const rows: Array<{
    col: Collection;
    state: Awaited<ReturnType<typeof scanCollection>>;
    plan: ReturnType<typeof planWork>;
  }> = [];

  for (const col of collections) {
    const state = await scanCollection(col);
    const plan = planWork(state);
    rows.push({ col, state, plan });
  }

  printCheckReport(rows, describeVersion(version));
  return rows.reduce((n, r) => n + blockingIssues(r.plan), 0);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** The three things the command can do — replaceable, so the dispatch can be tested. */
export interface Steps {
  assets: () => Promise<void>;
  vite: () => Promise<void>;
  /** Resolves with the number of blocking issues found. */
  check: () => Promise<number>;
}

const realSteps: Steps = { assets: buildAssets, vite: buildVite, check: checkIntegrity };

/** Run the command for these arguments and return the process exit code. */
export async function cli(args: string[], steps: Steps = realSteps): Promise<number> {
  const has = (flag: string) => args.includes(flag);
  try {
    if (has('--check')) {
      const issues = await steps.check();
      if (issues > 0) {
        console.error(`  integrity check failed: ${issues} issue(s)\n`);
        return 1;
      }
      return 0;
    }
    if (has('--assets-only')) {
      await steps.assets();
      return 0;
    }
    if (has('--vite-only')) {
      await steps.vite();
      return 0;
    }
    // Default: full build
    await steps.assets();
    await steps.vite();
    return 0;
  } catch (err) {
    console.error('\n  build failed:', errorMessage(err));
    if (err instanceof Error && err.stack) console.error(err.stack);
    return 1;
  }
}

if (import.meta.main) process.exit(await cli(process.argv.slice(2)));
