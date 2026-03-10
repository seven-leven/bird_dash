// =============================================================================
// collections.ts
// The "Data Engine": Handles configuration, fetching, and normalization.
// =============================================================================

export interface CollectionItem {
  id: string;
  itemId: string;
  commonName: string;
  scientificName: string;
  group: string;
  drawnDate: string;
  imageUrl: string;
  placeholderUrl: string;
  illustratorNote?: string;
  meta?: Record<string, string>;
}

export interface CollectionConfig {
  id: string;
  label: string;
  emoji: string;
  dataUrl: string;
  imageBase: string;
  fullImageBase: string;
  groupLabel: string;
  itemLabel: string;
  links: {
    label: string;
    color: string;
    url: (item: CollectionItem) => string;
  }[];
}

// Internal type for the master collections.json
interface RawCollectionConfig {
  id: string;
  label: string;
  emoji: string;
  groupLabel: string;
  itemLabel: string;
  links: { label: string; color: string; provider: string }[];
}

// Logic: Maps "provider" keys to URL generator functions
const URL_PROVIDERS: Record<string, (item: CollectionItem) => string> = {
  ebird: (item) =>
    `https://www.google.com/search?q=${encodeURIComponent(item.commonName + ' ebird')}`,
  birdlife: (item) =>
    `https://datazone.birdlife.org/search?search=${encodeURIComponent(item.commonName)}`,
  wiki: (item) =>
    `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(item.commonName)}`,
  inat: (item) => `https://www.inaturalist.org/search?q=${encodeURIComponent(item.commonName)}`,
  fishbase: (item) => `https://fishbase.se/search.php?q=${encodeURIComponent(item.scientificName)}`,
  worms: (item) =>
    `https://www.marinespecies.org/aphia.php?p=taxlist&tname=${
      encodeURIComponent(item.scientificName)
    }`,
};

function getBase(): string {
  const base = typeof import.meta.env !== 'undefined'
    ? (import.meta.env?.BASE_URL as string)
    : undefined;
  return base || '/';
}

// State: The registered list of collections
export let COLLECTIONS: CollectionConfig[] = [];

/**
 * Loads the master configuration file (collections.json)
 */
export async function initCollections(): Promise<void> {
  const response = await fetch(`${getBase()}collections.json`);
  if (!response.ok) throw new Error('Failed to load collections.json');

  const rawData: RawCollectionConfig[] = await response.json();

  COLLECTIONS = rawData.map((c) => ({
    ...c,
    dataUrl: `${getBase()}lists/${c.id}.json`,
    imageBase: `${getBase()}thumb/${c.id}/`,
    fullImageBase: `${getBase()}full/${c.id}/`,
    links: c.links.map((l) => ({
      label: l.label,
      color: l.color,
      url: URL_PROVIDERS[l.provider] || (() => '#'),
    })),
  }));
}

/**
 * Fetches and normalizes data for a specific collection.
 * Extracted from App.vue parseCollectionJson logic.
 */
export async function fetchCollectionData(col: CollectionConfig): Promise<CollectionItem[]> {
  const res = await fetch(col.dataUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${col.label}`);

  const rawGroups: Record<string, unknown[]> = await res.json();
  const items: CollectionItem[] = [];
  const placeholder = getPlaceholder(col.id);
  const knownKeys = new Set(['id', 'name', 'sci', 'drawn', 'illustratorNote']);

  let counter = 1;

  for (const [groupName, list] of Object.entries(rawGroups)) {
    if (!Array.isArray(list)) continue;

    for (const raw of list) {
      const r = raw as Record<string, unknown>;
      const hasImg = !!r.drawn;

      // Extract extra metadata fields
      const meta: Record<string, string> = {};
      for (const key of Object.keys(r)) {
        if (!knownKeys.has(key) && typeof r[key] === 'string') {
          meta[key] = r[key] as string;
        }
      }

      items.push({
        id: `${col.id}-item-${counter++}`,
        itemId: String(r.id ?? ''),
        commonName: String(r.name ?? ''),
        scientificName: String(r.sci ?? ''),
        group: groupName,
        drawnDate: String(r.drawn ?? ''),
        imageUrl: hasImg ? `${col.imageBase}${r.id}.webp` : placeholder,
        placeholderUrl: placeholder,
        illustratorNote: String(r.illustratorNote ?? ''),
        meta: Object.keys(meta).length ? meta : undefined,
      });
    }
  }
  return items;
}

// Helpers
export function getCollection(id: string): CollectionConfig {
  const col = COLLECTIONS.find((c) => c.id === id);
  if (!col) throw new Error(`Unknown collection: "${id}"`);
  return col;
}

export const getPlaceholder = (id: string) => `${getBase()}placeholders/${id}.webp`;
