/**
 * `npm run ingest` — take in new drawings. For each collection: find the source art in
 * raw_png/ that the list does not date yet, date it, make the WebPs that are missing,
 * repair missing thumbnails; then rewrite public/stats.json. It changes files git
 * tracks, so it runs on your machine, never in CI (docs/SCRIPTS.md, principle 2).
 * `--dry-run` says what it would do and changes nothing.
 *
 *   scan (scanSources) → plan (planChanges) → apply (applyChanges) → report
 */
import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { type Io, realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { EXIT, MARK, parseArgs, printLines, runCommand } from '../lib/cli.ts';
import { computeVersion, formatVersionLine } from '../version/version.ts';
import { writeStats } from '../generate/stats.ts';
import { scanSources } from './scanSources.ts';
import { planChanges } from './planChanges.ts';
import { applyChanges } from './applyChanges.ts';
import type { Transcoder } from './transcodeImages.ts';
import {
  formatDryRun,
  formatIngestSummary,
  formatWarnings,
  type IngestSummary,
} from './formatIngestReport.ts';

export interface IngestOptions {
  collections?: Collection[];
  /** Where the stats go; tests point it elsewhere. */
  statsPath?: string;
  /** Makes the images; tests stand in for sharp. */
  transcoder?: Transcoder;
  dryRun?: boolean;
}

/** Ingest every collection. Returns the exit code: 1 when a drawing's images could not be made. */
export async function ingestDrawings(io: Io, options: IngestOptions = {}): Promise<number> {
  const { collections = COLLECTIONS, statsPath = PATHS.stats, transcoder, dryRun } = options;
  const started = io.now().getTime();
  const date = io.now().toISOString().slice(0, 10);
  io.out(
    dryRun
      ? 'ingest: a dry run, so nothing is changed'
      : 'ingest: dating new drawings and making their images (this changes files git tracks)',
  );

  const summaries: IngestSummary[] = [];
  for (const collection of collections) {
    const scan = await scanSources(collection, io);
    const plan = planChanges(scan);
    printLines(io, formatWarnings(collection, plan));
    if (dryRun) {
      printLines(io, formatDryRun(collection, plan));
      continue;
    }
    const applied = await applyChanges(collection, plan, { date, io, transcoder });
    summaries.push({
      collection,
      applied,
      drawnCount: scan.drawnIds.size + applied.registered.length,
    });
  }
  if (dryRun) return EXIT.done;

  const version = formatVersionLine(await computeVersion(io));
  printLines(io, formatIngestSummary(summaries, version, io.now().getTime() - started));

  const failures = summaries.reduce((count, summary) => count + summary.applied.failures.length, 0);
  if (failures > 0) {
    io.err(
      `${MARK.problem} ingest failed: ${failures} drawing(s) could not be made; stats not written`,
    );
    return EXIT.problem;
  }
  // The archive's numbers, from the lists as they now stand (new drawings dated above).
  const stats = await writeStats(collections, io, statsPath);
  io.out(`  ${MARK.done} stats: ${stats.drawn} of ${stats.total} drawn → ${statsPath}`);
  return EXIT.done;
}

const USAGE = `npm run ingest [-- --dry-run]
  Takes in new drawings from raw_png/: dates them in the lists, makes their WebPs and
  rewrites public/stats.json. Changes files git tracks. --dry-run changes nothing.`;

export function main(
  args: string[],
  io: Io = realIo,
  options: IngestOptions = {},
): Promise<number> {
  return runCommand(io, args, USAGE, () => {
    const { flags } = parseArgs(args, ['--dry-run']);
    return ingestDrawings(io, { ...options, dryRun: flags.has('--dry-run') });
  });
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
