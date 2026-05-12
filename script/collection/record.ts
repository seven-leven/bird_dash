/// <reference lib="deno.ns" />
import { readJson, writeJson } from '../lib/fs.ts';
import type { Collection } from './registry.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionData {
  [group: string]: CollectionItem[];
}

export interface CollectionItem {
  id: string;
  name: string;
  sci?: string;
  drawn?: string;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function loadCollectionData(col: Collection): Promise<CollectionData> {
  return readJson<CollectionData>(col.paths.json);
}

export async function loadDrawnIds(col: Collection): Promise<Set<string>> {
  const data = await loadCollectionData(col);
  const ids = new Set<string>();
  for (const group of Object.values(data)) {
    for (const item of group) {
      if (item.drawn) ids.add(item.id);
    }
  }
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
