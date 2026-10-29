// A collection's list file (`public/lists/<id>.json`): reading it, the drawn items in it,
// and dating an item when its drawing comes in.
import { type Io, readJson, realIo, writeJson } from './io.ts';
import { imageIds } from '../../src/domain/imageIds.ts';
import type { Collection } from './collections.ts';
// The list-file shape is defined once, next to the app's own types.
import type { ListEntry, ListFile } from '../../src/data/files.ts';

export function readList(collection: Collection, io: Io = realIo): Promise<ListFile> {
  return readJson<ListFile>(io, collection.paths.json);
}

/** Every item in the list that has a drawing, across all its groups, in list order. */
export function eachDrawnItem(list: ListFile): ListEntry[] {
  return Object.values(list).flatMap((group) => group.filter((item) => item.drawn));
}

/** A drawn item's images after the first, by file name: `001-2`, `001-3`. */
export const extraImageIds = (item: ListEntry): string[] => imageIds(item.id, item.images).slice(1);

/**
 * Date an item as drawn on `date`, unless it already has a date. Returns the item's
 * name, or null if the list has no item with that id (and then writes nothing).
 */
export async function markDrawn(
  collection: Collection,
  itemId: string,
  date: string,
  io: Io = realIo,
): Promise<string | null> {
  const list = await readList(collection, io);
  for (const group of Object.values(list)) {
    const item = group.find((entry) => entry.id === itemId);
    if (!item) continue;
    if (!item.drawn) {
      item.drawn = date;
      await writeJson(io, collection.paths.json, list);
    }
    return item.name;
  }
  return null;
}
