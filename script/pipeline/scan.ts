/// <reference lib="deno.ns" />
import { listFiles } from '../lib/fs.ts';
import { loadDrawnIds } from '../collection/record.ts';
import type { Collection } from '../collection/registry.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionState {
  drawnIds: Set<string>;
  rawIds: Set<string>;
  fullIds: Set<string>;
  thumbIds: Set<string>;
}

// ---------------------------------------------------------------------------
// Scan — single filesystem read per collection
// ---------------------------------------------------------------------------

export async function scanCollection(col: Collection): Promise<CollectionState> {
  const toIds = (files: string[]) => new Set(files.map((f) => f.replace(/\.(png|webp)$/i, '')));

  const [drawnIds, rawFiles, fullFiles, thumbFiles] = await Promise.all([
    loadDrawnIds(col),
    listFiles(col.paths.raw, (n) => n.endsWith('.png')),
    listFiles(col.paths.full, (n) => n.endsWith('.webp')),
    listFiles(col.paths.thumb, (n) => n.endsWith('.webp')),
  ]);

  return {
    drawnIds,
    rawIds: toIds(rawFiles),
    fullIds: toIds(fullFiles),
    thumbIds: toIds(thumbFiles),
  };
}
