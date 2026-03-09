/// <reference lib="deno.ns" />

// ---------------------------------------------------------------------------
// Collection registry — THE only place to register a new collection.
// Every other file derives paths and labels from this array.
// ---------------------------------------------------------------------------

export interface CollectionEntry {
  id: string; // e.g. 'birds', 'sharks'
  json: string; // path to data file, e.g. './public/birds.json'
  emoji: string; // used in changelog + console output
  label: string; // singular label, e.g. 'Bird', 'Shark'
  raw: string; // folder containing raw PNGs, e.g. './raw_png/birds/'
}

export const COLLECTIONS: CollectionEntry[] = [
  {
    id: 'birds',
    json: './public/birds.json',
    emoji: '🐦',
    label: 'Bird',
    raw: './raw_png/birds/',
  },
  {
    id: 'sharks',
    json: './public/sharks.json',
    emoji: '🦈',
    label: 'Shark',
    raw: './raw_png/sharks/',
  },
];

// ---------------------------------------------------------------------------
// Directories & files
// ---------------------------------------------------------------------------

export const DIRS = {
  // Base output dirs — actual paths are <base>/<collectionId>/
  full: './public/full/',
  thumb: './public/thumb/',
} as const;

/** Resolve the full-size output dir for a collection. */
export function fullDir(collectionId: string): string {
  return `${DIRS.full}${collectionId}/`;
}

/** Resolve the thumbnail output dir for a collection. */
export function thumbDir(collectionId: string): string {
  return `${DIRS.thumb}${collectionId}/`;
}

export const FILES = {
  version: './src/version.json',
  changelog: './CHANGELOG.md',
  collections: COLLECTIONS,

  // Legacy direct reference — derived from COLLECTIONS, always in sync
  get birds() {
    return COLLECTIONS.find((c) => c.id === 'birds')!.json;
  },
} as const;

export const THUMB_SIZE = 400;
