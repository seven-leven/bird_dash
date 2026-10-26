import RAW_COLLECTIONS from '../../public/collections.json' with { type: 'json' };
import { PATHS } from './paths.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionPaths {
  json: string; // public/lists/{id}.json
  sourceArt: string; // raw_png/{id}/
  full: string; // public/full/{id}/
  thumb: string; // public/thumb/{id}/
  placeholder: string; // public/placeholders/{id}.webp
  placeholderDark: string; // public/placeholders/{id}-dark.webp
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
    json: PATHS.list(c.id),
    sourceArt: PATHS.sourceArt(c.id),
    full: PATHS.full(c.id),
    thumb: PATHS.thumb(c.id),
    placeholder: PATHS.placeholder(c.id, 'light'),
    placeholderDark: PATHS.placeholder(c.id, 'dark'),
  },
}));
