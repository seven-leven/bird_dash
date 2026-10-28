// What is on disk for one collection, read once: the drawn items in its list, and the
// ids in its four image folders (source art, full, and the thumbnail's two sizes).
import { readDrawnIds } from '../lib/lists.ts';
import type { Collection } from '../lib/collections.ts';
import { type Io, realIo } from '../lib/io.ts';

export interface SourceScan {
  /** Items with a `drawn` date in the list. */
  drawnIds: Set<string>;
  /** Source art: a PNG in raw_png/<id>/ (on your machine only). */
  sourceIds: Set<string>;
  fullIds: Set<string>;
  /** The tiles' two sizes: thumb/ (400px) and small/ (240px). */
  thumbIds: Set<string>;
  smallIds: Set<string>;
}

/** File names to bare ids: `001.png` and `001.webp` are both `001`. */
export function toIds(files: string[]): Set<string> {
  return new Set(files.map((file) => file.replace(/\.(png|webp)$/i, '')));
}

export async function scanSources(collection: Collection, io: Io = realIo): Promise<SourceScan> {
  const webp = (name: string) => name.endsWith('.webp');
  const [drawnIds, sourceFiles, fullFiles, thumbFiles, smallFiles] = await Promise.all([
    readDrawnIds(collection, io),
    io.listFiles(collection.paths.sourceArt, (name) => name.endsWith('.png')),
    io.listFiles(collection.paths.full, webp),
    io.listFiles(collection.paths.thumb, webp),
    io.listFiles(collection.paths.small, webp),
  ]);
  return {
    drawnIds,
    sourceIds: toIds(sourceFiles),
    fullIds: toIds(fullFiles),
    thumbIds: toIds(thumbFiles),
    smallIds: toIds(smallFiles),
  };
}
