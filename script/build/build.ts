/**
 * `npm run build` — make dist/ from what is committed, in stages: the site, then the docs
 * site into dist/docs/ (after the site, as Vite empties dist/ first). Never changes a file
 * git tracks; taking in new drawings is `npm run ingest` (script/ingest/).
 *
 *   npm run build              every stage, in order
 *   npm run build -- docs      the stages named (also `npm run build:site`, `build:docs`)
 */

import type { Io } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { command, EXIT, MARK, parseArgs, UsageError } from '../lib/cli.ts';

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

/** Build the stages in order; the first that fails stops the build. */
export async function buildStages(io: Io, stages: Stage[]): Promise<number> {
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

const USAGE = `npm run build [-- <stage>…]
  Builds dist/ from what is committed: ${STAGES.map((s) => `${s.id} (${s.makes})`).join(', ')}.
  Name stages to build only those. Changes nothing git tracks.`;

export const main = command(USAGE, (args, io) => {
  const { words } = parseArgs(args, []);
  return buildStages(io, pickStages(words));
});

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
