// What is on disk for one collection, read once: the drawn items in its list, and the
// ids in its three image folders (source art, full and thumb).
import { readDrawnIds } from '../lib/lists.ts';
import type { Collection } from '../lib/collections.ts';
import { type Io, realIo } from '../lib/io.ts';

export interface SourceScan {
  /** Items with a `drawn` date in the list. */
  drawnIds: Set<string>;
  /** Source art: a PNG in raw_png/<id>/ (on your machine only). */
  sourceIds: Set<string>;
  fullIds: Set<string>;
  thumbIds: Set<string>;
}

/** File names to bare ids: `001.png` and `001.webp` are both `001`. */
export function toIds(files: string[]): Set<string> {
  return new Set(files.map((file) => file.replace(/\.(png|webp)$/i, '')));
}

export async function scanSources(collection: Collection, io: Io = realIo): Promise<SourceScan> {
  const [drawnIds, sourceFiles, fullFiles, thumbFiles] = await Promise.all([
    readDrawnIds(collection, io),
    io.listFiles(collection.paths.sourceArt, (name) => name.endsWith('.png')),
    io.listFiles(collection.paths.full, (name) => name.endsWith('.webp')),
    io.listFiles(collection.paths.thumb, (name) => name.endsWith('.webp')),
  ]);
  return {
    drawnIds,
    sourceIds: toIds(sourceFiles),
    fullIds: toIds(fullFiles),
    thumbIds: toIds(thumbFiles),
  };
}
