/**
 * `npm run check` — is the repository as it should be? It reads and reports, and
 * changes nothing (docs/SCRIPTS.md, principle 2), so CI runs it:
 *
 *   assets      every drawn item has its images; no image without an item; no source
 *               art waiting to be ingested (checkAssets)
 *   generated   stats.json, the favicon and the logo files are what their generators
 *               would write now (checkGenerated)
 *
 * Exits 1, naming each problem and the command that fixes it, when anything is wrong.
 */
import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { type Io, realIo } from '../lib/io.ts';
import { EXIT, MARK, parseArgs, printLines, runCommand } from '../lib/cli.ts';
import { computeVersion, formatVersionLine } from '../version/version.ts';
import { checkAssets } from './checkAssets.ts';
import { checkGenerated } from './checkGenerated.ts';
import { formatAssetReport, formatGeneratedReport } from './formatCheckReport.ts';

export interface CheckOptions {
  collections?: Collection[];
  /** Where the stats are; tests point it elsewhere. */
  statsPath?: string;
}

/** Run every check, print the report, and return how many problems it found. */
export async function checkRepository(io: Io, options: CheckOptions = {}): Promise<number> {
  const { collections = COLLECTIONS, statsPath } = options;
  const versionLine = formatVersionLine(await computeVersion(io));

  const assets = await checkAssets(collections, io);
  printLines(io, formatAssetReport(assets.rows, versionLine));

  const generated = await checkGenerated(collections, io, statsPath);
  printLines(io, formatGeneratedReport(generated));

  return assets.problemCount + generated.filter((file) => !file.isCurrent).length;
}

const USAGE = `npm run check
  Checks that every drawing has its images, nothing is left to ingest, and the generated
  files are current. Changes nothing; exits 1 on a problem.`;

export function main(args: string[], io: Io = realIo, options: CheckOptions = {}): Promise<number> {
  return runCommand(io, args, USAGE, async () => {
    parseArgs(args, []);
    const problems = await checkRepository(io, options);
    if (problems === 0) return EXIT.done;
    io.err(`${MARK.problem} check failed: ${problems} problem(s)`);
    return EXIT.problem;
  });
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
