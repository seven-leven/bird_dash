/// <reference lib="deno.ns" />
/**
 * script/version/compute.ts — the ONE place the app version is worked out.
 *
 * The version is derived, so it can never drift and needs no bump commit:
 *
 *   0.9.161   major.minor  from version.json, next to this file (edited by hand when a new line of
 *                          work starts, e.g. 0.9 -> 0.10)
 *             patch        the number of commits in this checkout's history
 *                          (`git rev-list --count HEAD`). On main that includes merge
 *                          commits, so it rises by a few with every merged PR; it is a
 *                          build counter, not a count of fixes.
 *   18 drawings            how many illustrations are marked drawn in public/lists/*.json
 *   a1b2c3d                the commit the build was made from
 *
 * Used by `deno task version`, the build/check summaries, and vite.config.ts (which
 * injects it into the page footer). See the README ("Versioning") for the overview.
 */

import { readJson } from '../lib/fs.ts';
import { git } from '../lib/git.ts';
import { type Collection, COLLECTIONS, VERSION_FILE } from '../collection/registry.ts';
import { forEachDrawn, loadCollectionData } from '../collection/record.ts';

export interface VersionData {
  major: number;
  minor: number;
  patch: number;
  /** Illustrations marked drawn, across all collections. */
  drawn: number;
  /** Short hash of the commit built from ("unknown" when git was unavailable). */
  commit: string;
}

type Git = typeof git;

export async function getCommitCount(run: Git = git): Promise<number> {
  return Number(await run('rev-list', '--count', 'HEAD'));
}

export async function getDrawnIds(
  collectionId?: string,
  collections: Collection[] = COLLECTIONS,
): Promise<Set<string>> {
  const targets = collectionId ? collections.filter((c) => c.id === collectionId) : collections;

  const ids = new Set<string>();
  for (const col of targets) {
    try {
      const data = await loadCollectionData(col);
      forEachDrawn(data, (item) => ids.add(`${col.id}/${item.id}`));
    } catch { /* collection JSON may not exist yet */ }
  }
  return ids;
}

/**
 * Work out the version. Strict by default: if git cannot answer, this throws.
 * `lenient` (used for local dev servers and builds) falls back to patch 0 and commit
 * "unknown" with a warning instead — except in CI, where a deploy must never ship a
 * made-up version.
 */
export async function computeVersion(
  opts: { lenient?: boolean; git?: Git } = {}, // `git` is replaceable for tests
): Promise<VersionData> {
  const run = opts.git ?? git;
  const base = await readJson<{ major: number; minor: number }>(VERSION_FILE);
  const drawn = (await getDrawnIds()).size;

  try {
    const [patch, commit] = await Promise.all([
      getCommitCount(run),
      run('rev-parse', '--short=7', 'HEAD'),
    ]);
    return { major: base.major, minor: base.minor, patch, drawn, commit };
  } catch (err) {
    if (!opts.lenient || Deno.env.get('CI')) throw err;
    console.warn(
      `[version] git is unavailable (${(err as Error).message.split('\n')[0]}); ` +
        'using patch 0 and commit "unknown"',
    );
    return { major: base.major, minor: base.minor, patch: 0, drawn, commit: 'unknown' };
  }
}

/** The version proper: `major.minor.patch`. */
export function formatVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Everything on one line, for logs and the footer: `0.9.161 · 18 drawings · a1b2c3d`. */
export function describeVersion(v: VersionData): string {
  return `${formatVersion(v)} · ${plural(v.drawn, 'drawing')} · ${v.commit}`;
}

/** What `deno task version` prints: the version, or with `--long` the whole line. */
export async function cli(args: string[], opts: { git?: Git } = {}): Promise<string> {
  const v = await computeVersion(opts);
  return args.includes('--long') ? describeVersion(v) : formatVersion(v);
}

if (import.meta.main) console.log(await cli(Deno.args));
