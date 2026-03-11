// Import the JSON directly from the public folder
import FE_COLLECTIONS from '../../public/collections.json' with { type: 'json' };
import { ScriptCollectionEntry } from '../../src/types/scripts.ts';

// Map the raw JSON data into the format your scripts expect
export const COLLECTIONS: ScriptCollectionEntry[] = FE_COLLECTIONS.map((col) => ({
  // Spread all properties from JSON (id, label, emoji, links, etc.)
  ...col,

  // Add the filesystem paths used by the build/processing scripts
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
