import {
  type CollectionConfig,
  COLLECTIONS as FE_COLLECTIONS,
} from '../../src/types/collections.ts';

// Define an interface for the BUILD scripts that adds the fields needed by the build
export interface ScriptCollectionEntry extends CollectionConfig {
  json: string;
  placeholder: string;
  raw: string;
}

// Map the FE_COLLECTIONS into the new type
export const COLLECTIONS: ScriptCollectionEntry[] = FE_COLLECTIONS.map((col) => ({
  ...col,
  // These are the new fields your scripts expect
  json: `./public/lists/${col.id}.json`,
  placeholder: `./public/placeholders/${col.id}.webp`,
  raw: `./raw_png/${col.id}/`,
}));

// Re-export the directory helpers
export const DIRS = {
  full: './public/full/',
  thumb: './public/thumb/',
  lists: './public/lists/',
  placeholder: './public/placeholders/',
} as const;

export function fullDir(id: string) {
  return `${DIRS.full}${id}/`;
}
export function thumbDir(id: string) {
  return `${DIRS.thumb}${id}/`;
}
export function placeholderPath(id: string) {
  return `${DIRS.placeholder}${id}.webp`;
}
