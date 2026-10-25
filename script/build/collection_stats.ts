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
import type { RawItem } from '../../src/types/data.ts';

export const STATS_PATH = './public/stats.json';

/** How many of the newest drawings the file lists. */
export const NEWEST_COUNT = 8;

export interface CollectionStats {
  id: string;
  label: string;
  /** Species in the list, drawn or not. */
  total: number;
  drawn: number;
  /** Families, orders or groups: the list's top-level keys. */
  groups: number;
  /** `YYYY-MM-DD` of the first and the latest drawing; null while nothing is drawn. */
  firstDrawn: string | null;
  lastDrawn: string | null;
}

export interface NewestDrawing {
  collection: string;
  id: string;
  name: string;
  /** The Dhivehi name in Thaana, when the list has one. */
  dhivehi?: string;
  drawn: string;
}

export interface Stats {
  drawn: number;
  total: number;
  collections: CollectionStats[];
  /** Newest first; on the same day, in collection order and then by id. */
  newest: NewestDrawing[];
}

/** One collection's list, as public/lists/<id>.json holds it: group name → items. */
export interface CollectionList {
  id: string;
  label: string;
  groups: Record<string, RawItem[]>;
}

/** Work the numbers out from the lists. Pure: the build and the check share it. */
export function computeStats(lists: CollectionList[], newestCount = NEWEST_COUNT): Stats {
  const collections = lists.map(({ id, label, groups }): CollectionStats => {
    const items = Object.values(groups).flat();
    const dates = items.map((i) => i.drawn).filter((d): d is string => !!d).sort();
    return {
      id,
      label,
      total: items.length,
      drawn: dates.length,
      groups: Object.keys(groups).length,
      firstDrawn: dates[0] ?? null,
      lastDrawn: dates.at(-1) ?? null,
    };
  });

  const newest = lists
    .flatMap(({ id, groups }, order) =>
      Object.values(groups).flat().filter((i) => i.drawn).map((i) => ({ order, item: i, id }))
    )
    .sort((a, b) =>
      b.item.drawn!.localeCompare(a.item.drawn!) || a.order - b.order ||
      a.item.id.localeCompare(b.item.id)
    )
    .slice(0, newestCount)
    .map(({ id, item }): NewestDrawing => ({
      collection: id,
      id: item.id,
      name: item.name,
      ...(item.dhiv_script ? { dhivehi: item.dhiv_script } : {}),
      drawn: item.drawn!,
    }));

  return {
    drawn: collections.reduce((n, c) => n + c.drawn, 0),
    total: collections.reduce((n, c) => n + c.total, 0),
    collections,
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
