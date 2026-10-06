// =============================================================================
// The shape of the files in public/ — the contract between the build scripts
// (script/), the app's loader (src/lib/collectionItems.ts) and the data contract
// test. Change a field here and all three see it.
// =============================================================================

/** One entry in `public/lists/<id>.json`. */
export interface RawItem {
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
export type RawCollectionData = Record<string, RawItem[]>;

/** One entry in `public/collections.json`. */
export interface RawCollectionConfig {
  id: string;
  label: string;
  emoji: string;
  /** Name of a line icon in src/components/icons/icons.ts; the emoji is the fallback. */
  icon?: string;
  /** The collection's accent colour: one of the palettes in src/assets/main.css (default teal). */
  accent?: string;
  groupLabel: string;
  itemLabel: string;
  /** `url` may contain `{{common}}` and `{{sci}}` placeholders. */
  links: { label: string; color: string; url: string }[];
}
