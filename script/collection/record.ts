/// <reference lib="deno.ns" />
import { readJson, writeJson } from '../lib/fs.ts';
import type { Collection } from './registry.ts';
// The list-file shape is defined once, next to the app's own types.
import type { RawCollectionData, RawItem } from '../../src/types/data.ts';

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function loadCollectionData(col: Collection): Promise<RawCollectionData> {
  return await readJson<RawCollectionData>(col.paths.json);
}

/** Invoke `cb` for every item marked drawn, across all groups in the collection. */
export function forEachDrawn(data: RawCollectionData, cb: (item: RawItem) => void): void {
  for (const group of Object.values(data)) {
    for (const item of group) {
      if (item.drawn) cb(item);
    }
  }
}

export async function loadDrawnIds(col: Collection): Promise<Set<string>> {
  const data = await loadCollectionData(col);
  const ids = new Set<string>();
  forEachDrawn(data, (item) => ids.add(item.id));
  return ids;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Mark a single item as drawn today.
 * Returns the item's name on success, null if the id was not found.
 */
export async function markDrawn(
  col: Collection,
  itemId: string,
  date: string,
): Promise<string | null> {
  const data = await loadCollectionData(col);

  for (const group of Object.values(data)) {
    const item = group.find((i) => i.id === itemId);
    if (item) {
      if (!item.drawn) {
        item.drawn = date;
        await writeJson(col.paths.json, data);
      }
      return item.name;
    }
  }

  return null;
}
