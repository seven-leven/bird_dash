// =============================================================================
// The shape of the files in public/ — the contract between the build scripts
// (script/), the app's loader (src/domain/toCollectionItems.ts) and the data contract
// test. Change a field here and all three see it.
// =============================================================================

/** One entry in `public/lists/<id>.json`. */
export interface ListEntry {
  /** Digits only; used in URLs (`#col/<id>`), image file names and sorting. */
  id: string;
  name: string;
  sci?: string;
  /** `YYYY-MM-DD` once drawn; absent or `''` while it is still a placeholder. */
  drawn?: string;
  illustratorNote?: string;
  /** Dhivehi name, romanised and in Thaana script. */
  dhiv?: string;
  dhiv_script?: string;
  /** Any other string field is shown in the info panel and is searchable. */
  [extra: string]: unknown;
}

/** `public/lists/<id>.json`: items keyed by group (family, order, …). */
export type ListFile = Record<string, ListEntry[]>;

/** One entry in `public/collections.json`. */
export interface CollectionEntry {
  id: string;
  label: string;
  emoji: string;
  /** Name of a line icon in src/lib/icons.ts; the emoji is the fallback. */
  icon?: string;
  /** The collection's accent colour: one of the palettes in src/styles/accents.css (default teal). */
  accent?: string;
  groupLabel: string;
  itemLabel: string;
  /** `url` may contain `{{common}}` and `{{sci}}` placeholders. */
  links: { label: string; url: string }[];
}

// `public/stats.json`: the archive's numbers, written by the asset build
// (script/generate/stats.ts) and read by the About page.

export interface CollectionCounts {
  id: string;
  label: string;
  /** Species in the list, drawn or not. */
  total: number;
  drawn: number;
  /** Families, orders or groups: the list's top-level keys. */
  groups: number;
  /** Species with a Dhivehi name (in Thaana) in the list. */
  named: number;
  /** `YYYY-MM-DD` of the first and the latest drawing; null while nothing is drawn. */
  firstDrawn: string | null;
  lastDrawn: string | null;
}

export interface NewestDrawing {
  collection: string;
  id: string;
  name: string;
  /** The Dhivehi name in Thaana, when the list has one, and how to say it. */
  dhivehi?: string;
  roman?: string;
  drawn: string;
}

export interface Stats {
  drawn: number;
  total: number;
  collections: CollectionCounts[];
  /** The archive's first drawing (on the same day, the first collection's, lowest id); null if none. */
  first: NewestDrawing | null;
  /** Newest first; on the same day, in collection order and then by id. */
  newest: NewestDrawing[];
}
