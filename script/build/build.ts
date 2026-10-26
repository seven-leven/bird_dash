/**
 * `npm run build` — make dist/ from what is committed, in stages: the site, then the docs
 * site into dist/docs/ (after the site, as Vite empties dist/ first). Never changes a file
 * git tracks; taking in new drawings is `npm run ingest` (script/ingest/).
 *
 *   npm run build              every stage, in order
 *   npm run build -- docs      the stages named (also `npm run build:site`, `build:docs`)
 *   npm run check              read-only integrity report (here until it gets its own command)
 */

import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { type Io, realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { EXIT, MARK, parseArgs, runCommand, UsageError } from '../lib/cli.ts';
import { scanSources } from '../ingest/scanSources.ts';
import { countBlockingIssues, planChanges } from '../ingest/planChanges.ts';
import { isStatsCurrent } from '../generate/stats.ts';
import { printCheckReport } from './printCheckReport.ts';
import { computeVersion, formatVersionLine } from '../version/version.ts';

/** One stage of the build: a tool, run with this Node, and what it makes. */
export interface Stage {
  id: string;
  makes: string;
  tool: string;
  args: string[];
}

/** The stages, in the order a full build runs them. */
export const STAGES: Stage[] = [
  {
    id: 'site',
    makes: 'the site, in dist/',
    tool: PATHS.viteBin,
    args: ['build', '--config', PATHS.viteConfig],
  },
  {
    id: 'docs',
    makes: 'the docs site, in dist/docs/',
    tool: PATHS.vitepressBin,
    args: ['build', 'docs'],
  },
];

/** The stages these words name, in build order; all of them when none is named. */
export function pickStages(words: string[]): Stage[] {
  const unknown = words.filter((word) => !STAGES.some((stage) => stage.id === word));
  if (unknown.length > 0) {
    throw new UsageError(
      `no stage ${unknown.join(', ')} (the stages: ${STAGES.map((s) => s.id).join(', ')})`,
    );
  }
  return words.length === 0 ? STAGES : STAGES.filter((stage) => words.includes(stage.id));
}

/** Run the stages in order; the first that fails stops the build. */
export async function runStages(io: Io, stages: Stage[]): Promise<number> {
  for (const stage of stages) {
    io.out(`\n  build: ${stage.id} (${stage.makes})\n`);
    const started = io.now().getTime();
    const code = await io.runNode(stage.tool, stage.args);
    if (code !== 0) {
      io.err(`${MARK.problem} build: ${stage.id} failed (exit code ${code})`);
      return EXIT.problem;
    }
    io.out(`  ${MARK.done} ${stage.id}  ${((io.now().getTime() - started) / 1000).toFixed(2)}s`);
  }
  return EXIT.done;
}

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
  // A list changed without ingesting would leave the published numbers wrong.
  const statsCurrent = await isStatsCurrent(collections, io, statsPath);
  console.log(
    statsCurrent
      ? `  ✓ ${statsPath} matches the lists`
      : `  ✗ ${statsPath} is stale: run \`npm run ingest\` to rewrite it`,
  );
  return rows.reduce((n, r) => n + countBlockingIssues(r.plan), 0) + (statsCurrent ? 0 : 1);
}

const USAGE = `npm run build [-- <stage>…]
  Builds dist/ from what is committed: ${STAGES.map((s) => `${s.id} (${s.makes})`).join(', ')}.
  Name stages to build only those. Changes nothing git tracks.`;

export function main(
  args: string[],
  io: Io = realIo,
  check: (io: Io) => Promise<number> = (io) => checkIntegrity(COLLECTIONS, io),
): Promise<number> {
  return runCommand(io, args, USAGE, async () => {
    const { flags, words } = parseArgs(args, ['--check']);
    if (flags.has('--check')) {
      const issues = await check(io);
      if (issues === 0) return EXIT.done;
      io.err(`${MARK.problem} integrity check failed: ${issues} issue(s)`);
      return EXIT.problem;
    }
    return runStages(io, pickStages(words));
  });
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
