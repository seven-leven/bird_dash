/**
 * The archive's numbers, worked out from the lists at build time and written to
 * public/stats.json, so a page that shows them (the About page) never has them typed
 * by hand: how much of each collection is drawn, how many groups it has, when its
 * drawing started and last happened, and the newest drawings across every collection.
 *
 * The file holds nothing that changes between two builds of the same lists (no build
 * time), so `npm run check` can tell when it is stale.
 */
import { readFile, writeFile } from 'node:fs/promises';
import type { Collection } from '../lib/collections.ts';
import { isErrno, readJson } from '../lib/fs.ts';
import type { CollectionCounts, NewestDrawing, RawItem, Stats } from '../../src/types/data.ts';

export type { CollectionCounts, NewestDrawing, Stats };

export const STATS_PATH = './public/stats.json';

/** How many of the newest drawings the file lists. */
export const NEWEST_COUNT = 8;

/** One collection's list, as public/lists/<id>.json holds it: group name → items. */
export interface CollectionList {
  id: string;
  label: string;
  groups: Record<string, RawItem[]>;
}

/** Work the numbers out from the lists. Pure: the build and the check share it. */
export function computeStats(lists: CollectionList[], newestCount = NEWEST_COUNT): Stats {
  const collections = lists.map(({ id, label, groups }): CollectionCounts => {
    const items = Object.values(groups).flat();
    const dates = items.map((i) => i.drawn).filter((d): d is string => !!d).sort();
    return {
      id,
      label,
      total: items.length,
      drawn: dates.length,
      groups: Object.keys(groups).length,
      named: items.filter((i) => i.dhiv_script).length,
      firstDrawn: dates[0] ?? null,
      lastDrawn: dates.at(-1) ?? null,
    };
  });

  // Every drawing, oldest first (same day: collection order, then id).
  const byDate = lists
    .flatMap(({ id, groups }, order) =>
      Object.values(groups).flat().filter((i) => i.drawn).map((i) => ({ order, item: i, id }))
    )
    .sort((a, b) =>
      a.item.drawn!.localeCompare(b.item.drawn!) || a.order - b.order ||
      a.item.id.localeCompare(b.item.id)
    )
    .map(({ id, item }): NewestDrawing => ({
      collection: id,
      id: item.id,
      name: item.name,
      ...(item.dhiv_script ? { dhivehi: item.dhiv_script } : {}),
      ...(item.dhiv_script && item.dhiv ? { roman: item.dhiv } : {}),
      drawn: item.drawn!,
    }));
  // Newest first, but a shared day still reads in collection order, then by id.
  const newest = [...byDate]
    .sort((a, b) => b.drawn.localeCompare(a.drawn))
    .slice(0, newestCount);

  return {
    drawn: collections.reduce((n, c) => n + c.drawn, 0),
    total: collections.reduce((n, c) => n + c.total, 0),
    collections,
    first: byDate[0] ?? null,
    newest,
  };
}

/** The file's exact text: stable, so an unchanged archive writes an unchanged file. */
export const formatStats = (stats: Stats): string => JSON.stringify(stats, null, 2) + '\n';

async function readLists(collections: Collection[]): Promise<CollectionList[]> {
  return Promise.all(collections.map(async (c) => ({
    id: c.id,
    label: c.label,
    groups: await readJson<Record<string, RawItem[]>>(c.paths.json),
  })));
}

/** Write the stats for these collections (the asset build's last step). */
export async function writeStats(collections: Collection[], path = STATS_PATH): Promise<Stats> {
  const stats = computeStats(await readLists(collections));
  await writeFile(path, formatStats(stats));
  return stats;
}

/** True when the file on disk says what the lists say now (`npm run check`). */
export async function statsAreCurrent(
  collections: Collection[],
  path = STATS_PATH,
): Promise<boolean> {
  const expected = formatStats(computeStats(await readLists(collections)));
  try {
    return (await readFile(path, 'utf8')) === expected;
  } catch (err) {
    if (isErrno(err, 'ENOENT')) return false;
    throw err;
  }
}
