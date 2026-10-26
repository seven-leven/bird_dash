/**
 * script/build/build.ts — makes the site from what is committed; never changes a file git
 * tracks (taking in new drawings is `npm run ingest`, script/ingest/).
 *
 * Modes (pass as CLI flag):
 *   (none)           the site: vite build into dist/
 *   --check          read-only integrity report, no writes
 */

import { spawn } from 'node:child_process';
import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { scanSources } from '../ingest/scanSources.ts';
import { countBlockingIssues, planChanges } from '../ingest/planChanges.ts';
import { isStatsCurrent } from './collection_stats.ts';
import { printCheckReport } from './printCheckReport.ts';
import { computeVersion, formatVersionLine } from '../version/version.ts';
import { errorMessage } from '../lib/error.ts';

// ---------------------------------------------------------------------------
// Vite build (subprocess)
// ---------------------------------------------------------------------------

/** Start `vite build` and resolve with its exit code. */
// Runs the real build, so no test calls it; buildVite is tested with a stand-in.
/* c8 ignore start */
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
/* c8 ignore stop */

export async function buildVite(spawn: () => Promise<number> = spawnVite): Promise<void> {
  console.log('\n  vite\n');
  const code = await spawn();
  if (code !== 0) throw new Error(`vite exited with code ${code}`);
}

// ---------------------------------------------------------------------------
// Check (read-only)
// ---------------------------------------------------------------------------

/** Prints the integrity report and returns how many blocking issues it found. */
export async function checkIntegrity(
  collections: Collection[] = COLLECTIONS,
  io = realIo,
  statsPath: string = PATHS.stats,
): Promise<number> {
  const version = await computeVersion(io);
  const rows: Array<{
    col: Collection;
    state: Awaited<ReturnType<typeof scanSources>>;
    plan: ReturnType<typeof planChanges>;
  }> = [];

  for (const col of collections) {
    const state = await scanSources(col, io);
    const plan = planChanges(state);
    rows.push({ col, state, plan });
  }

  printCheckReport(rows, formatVersionLine(version));
  // A list changed without a build would leave the published numbers wrong.
  const statsCurrent = await isStatsCurrent(collections, io, statsPath);
  console.log(
    statsCurrent
      ? `  ✓ ${statsPath} matches the lists`
      : `  ✗ ${statsPath} is stale: run \`npm run ingest\` to rewrite it`,
  );
  return rows.reduce((n, r) => n + countBlockingIssues(r.plan), 0) + (statsCurrent ? 0 : 1);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** The two things the command can do — replaceable, so the dispatch can be tested. */
export interface Steps {
  vite: () => Promise<void>;
  /** Resolves with the number of blocking issues found. */
  check: () => Promise<number>;
}

const realSteps: Steps = { vite: buildVite, check: () => checkIntegrity() };

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
    // Default: the site
    await steps.vite();
    return 0;
  } catch (err) {
    console.error('\n  build failed:', errorMessage(err));
    if (err instanceof Error && err.stack) console.error(err.stack);
    return 1;
  }
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await cli(process.argv.slice(2)));
