/// <reference lib="deno.ns" />
import RAW_COLLECTIONS from '../../public/collections.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionPaths {
  json: string; // public/lists/{id}.json
  raw: string; // raw_png/{id}/
  full: string; // public/full/{id}/
  thumb: string; // public/thumb/{id}/
  placeholder: string; // public/placeholders/{id}.webp
}

export interface Collection {
  id: string;
  label: string;
  emoji: string;
  paths: CollectionPaths;
}

// ---------------------------------------------------------------------------
// Registry — single source of truth
// All scripts import Collection/COLLECTIONS from here, nowhere else.
// ---------------------------------------------------------------------------

export const COLLECTIONS: Collection[] = RAW_COLLECTIONS.map((c) => ({
  id: c.id,
  label: c.label,
  emoji: c.emoji,
  paths: {
    json: `./public/lists/${c.id}.json`,
    raw: `./raw_png/${c.id}/`,
    full: `./public/full/${c.id}/`,
    thumb: `./public/thumb/${c.id}/`,
    placeholder: `./public/placeholders/${c.id}.webp`,
  },
}));

export const VERSION_FILE = './src/version.json';
export const CHANGELOG_FILE = './CHANGELOG.md';

export function findCollection(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}
