// =============================================================================
// The shape of the files in public/ — the contract between the build scripts
// (script/), the app's loader (src/domain/toCollectionItems.ts) and the data contract
// test. Change a field here and all three see it. Each file is also checked when it
// arrives (the `check…` functions at the end): a field missing or of the wrong kind
// names itself, instead of failing later in whatever component reads it.
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
  /**
   * How many images the item has, 1 when absent: the drawing (`<id>.webp`), then
   * `<id>-2.webp`, `<id>-3.webp`… (its sketches, or a series piece's other parts).
   */
  images?: number;
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
  /** What every piece in it is drawn in ("colour pencil"), where one medium holds for all. */
  medium?: string | undefined;
  emoji: string;
  /** Name of a line icon in src/ui/icons.ts; the emoji is the fallback. */
  icon?: string | undefined;
  /** The collection's accent colour: one of the palettes in src/styles/accents.css (default teal). */
  accent?: string | undefined;
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
  dhivehi?: string | undefined;
  roman?: string | undefined;
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

// ---------------------------------------------------------------------------
// The files checked at the door
// ---------------------------------------------------------------------------

/**
 * What a field holds: a kind of value, or a list of things of a shape.
 * A key ending in `?` may be left out.
 */
type Field = 'string' | 'number' | 'count' | 'string or null' | [Shape];
interface Shape {
  [key: string]: Field;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Every way `value`, at `where`, is not of `shape`: `Ducks[1].name is missing`. */
function problemsIn(value: unknown, shape: Shape, where: string): string[] {
  if (!isRecord(value)) return [`${where} is not an object`];
  return Object.entries(shape).flatMap(([key, field]) => {
    const name = key.replace(/\?$/, '');
    const at = `${where}.${name}`;
    const found = value[name];
    if (found === undefined) return key.endsWith('?') ? [] : [`${at} is missing`];
    if (typeof field !== 'string') {
      // A list of things of a shape: each checked in its place.
      return Array.isArray(found)
        ? found.flatMap((item, i) => problemsIn(item, field[0], `${at}[${i}]`))
        : [`${at} is not a list`];
    }
    return fits(found, field) ? [] : [`${at} is not ${describe(field)}`];
  });
}

/** Whether `value` is the kind of value `field` asks for. */
function fits(value: unknown, field: Exclude<Field, [Shape]>): boolean {
  if (field === 'string') return typeof value === 'string';
  if (field === 'number') return typeof value === 'number';
  if (field === 'count') return Number.isInteger(value) && (value as number) >= 1;
  return value === null || typeof value === 'string';
}

const describe = (field: Exclude<Field, [Shape]>): string =>
  field === 'count' ? 'a whole number of 1 or more' : `a ${field}`;

const COLLECTION_ENTRY: Shape = {
  id: 'string',
  label: 'string',
  'medium?': 'string',
  emoji: 'string',
  'icon?': 'string',
  'accent?': 'string',
  groupLabel: 'string',
  itemLabel: 'string',
  links: [{ label: 'string', url: 'string' }],
};
const LIST_ENTRY: Shape = {
  id: 'string',
  name: 'string',
  'sci?': 'string',
  'drawn?': 'string',
  'illustratorNote?': 'string',
  'images?': 'count',
  'dhiv?': 'string',
  'dhiv_script?': 'string',
};
const DRAWING: Shape = {
  collection: 'string',
  id: 'string',
  name: 'string',
  'dhivehi?': 'string',
  'roman?': 'string',
  drawn: 'string',
};
const STATS: Shape = {
  drawn: 'number',
  total: 'number',
  collections: [{
    id: 'string',
    label: 'string',
    total: 'number',
    drawn: 'number',
    groups: 'number',
    named: 'number',
    firstDrawn: 'string or null',
    lastDrawn: 'string or null',
  }],
  newest: [DRAWING],
};

/** What is wrong with `collections.json`, as it was parsed; nothing when it has the shape. */
export function checkCollections(file: unknown): string[] {
  if (!Array.isArray(file)) return ['the file is not a list'];
  return file.flatMap((entry, i) => problemsIn(entry, COLLECTION_ENTRY, `[${i}]`));
}

/** What is wrong with a `lists/<id>.json`: each group a list of items of the shape. */
export function checkList(file: unknown): string[] {
  if (!isRecord(file)) return ['the file is not an object'];
  return Object.entries(file).flatMap(([group, entries]) =>
    Array.isArray(entries)
      ? entries.flatMap((entry, i) => problemsIn(entry, LIST_ENTRY, `${group}[${i}]`))
      : [`${group} is not a list`]
  );
}

/** What is wrong with `stats.json`; its first drawing may be null, while nothing is drawn. */
export function checkStats(file: unknown): string[] {
  const problems = problemsIn(file, STATS, 'stats');
  if (!isRecord(file) || file.first === null) return problems;
  return [...problems, ...problemsIn(file.first, DRAWING, 'stats.first')];
}
