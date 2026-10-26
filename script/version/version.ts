/**
 * script/version/version.ts — the ONE place the app version is worked out.
 *
 * The version is derived, so it can never drift and needs no bump commit:
 *
 *   0.9.161   major.minor  from base_version.json, next to this file (edited by hand when a new line of
 *                          work starts, e.g. 0.9 -> 0.10)
 *             patch        the number of commits in this checkout's history
 *                          (`git rev-list --count HEAD`). On main that includes merge
 *                          commits, so it rises by a few with every merged PR; it is a
 *                          build counter, not a count of fixes.
 *   Valu Kukulhu           the line's name: a Dhivehi name from the drawings, in the
 *                          order they were drawn (lineNames.ts)
 *   18 drawings            how many illustrations are marked drawn in public/lists/*.json
 *   a1b2c3d                the commit the build was made from
 *
 * Used by `npm run version`, the build/check summaries, and vite.config.ts (which
 * injects it into the page footer). See docs/WORKFLOW.md ("Versioning") for the overview.
 */

import { type Collection, COLLECTIONS } from '../lib/collections.ts';
import { readDrawnIds } from '../lib/lists.ts';
import { type Io, readJson, realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { parseArgs, runCommand } from '../lib/cli.ts';
import { type LineName, lineName, readLineNames } from './lineNames.ts';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  /** The line's name, from the drawings; null when the lists do not reach that far. */
  name: LineName | null;
  /** Illustrations marked drawn, across all collections. */
  drawn: number;
  /** Short hash of the commit built from ("unknown" when git was unavailable). */
  commit: string;
}

/** The commits in this checkout's history: the patch number. */
export async function countCommits(io: Io): Promise<number> {
  return Number(await io.git('rev-list', '--count', 'HEAD'));
}

/** The drawn items across `collections`; a collection whose list is not written yet has none. */
export async function countDrawn(io: Io, collections: Collection[] = COLLECTIONS): Promise<number> {
  let count = 0;
  for (const collection of collections) {
    count += (await readDrawnIds(collection, io).catch(() => new Set())).size;
  }
  return count;
}

/**
 * Work out the version. Strict by default: if git cannot answer, this throws.
 * `lenient` (used for local dev servers and builds) falls back to patch 0 and commit
 * "unknown" with a warning instead — except in CI, where a deploy must never ship a
 * made-up version.
 */
export async function computeVersion(
  io: Io = realIo,
  options: { lenient?: boolean; collections?: Collection[] } = {},
): Promise<Version> {
  const base = await readJson<{ major: number; minor: number }>(io, PATHS.baseVersion);
  const drawn = await countDrawn(io, options.collections);
  const name = lineName(await readLineNames(io, options.collections), base.major, base.minor);

  try {
    const [patch, commit] = await Promise.all([
      countCommits(io),
      io.git('rev-parse', '--short=7', 'HEAD'),
    ]);
    return { major: base.major, minor: base.minor, patch, name, drawn, commit };
  } catch (err) {
    if (!options.lenient || io.env('CI')) throw err;
    io.err(
      `[version] git is unavailable (${(err as Error).message.split('\n')[0]}); ` +
        'using patch 0 and commit "unknown"',
    );
    return { major: base.major, minor: base.minor, patch: 0, name, drawn, commit: 'unknown' };
  }
}

/** The version proper: `major.minor.patch`. */
export function formatVersion(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Everything on one line, for logs: `0.9.161 Valu Kukulhu · 18 drawings · a1b2c3d`. */
export function formatVersionLine(version: Version): string {
  const named = version.name
    ? `${formatVersion(version)} ${version.name.roman}`
    : formatVersion(version);
  return `${named} · ${plural(version.drawn, 'drawing')} · ${version.commit}`;
}

const USAGE = `npm run version [-- --long]
  Prints the version (0.9.161); --long adds the line's name, the drawings and the commit.`;

/** `npm run version`: the version, or with `--long` the whole line. */
export function main(args: string[], io: Io = realIo): Promise<number> {
  return runCommand(io, args, USAGE, async () => {
    const { flags } = parseArgs(args, ['--long']);
    const version = await computeVersion(io);
    io.out(flags.has('--long') ? formatVersionLine(version) : formatVersion(version));
  });
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
