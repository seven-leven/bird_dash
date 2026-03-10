// =============================================================================
// collections.ts
// Fixed: Explicit types to satisfy Deno/TypeScript strictness
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

// Define the interface for the raw JSON file
interface RawCollection {
  id: string;
  label: string;
  emoji: string;
  groupLabel: string;
  itemLabel: string;
  links: { label: string; color: string; provider: string }[];
}

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
  // Ensure the return is always a string, falling back to '/'
  const base = typeof import.meta.env !== 'undefined'
    ? (import.meta.env?.BASE_URL as string)
    : undefined;
  return base || '/';
}

export let COLLECTIONS: CollectionConfig[] = [];
let initPromise: Promise<void> | null = null;

export async function initCollections(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const response = await fetch(`${getBase()}collections.json`);
    if (!response.ok) throw new Error('Failed to load collections.json');

    const rawData: RawCollection[] = await response.json();

    COLLECTIONS = rawData.map((c) => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
      groupLabel: c.groupLabel,
      itemLabel: c.itemLabel,
      dataUrl: `${getBase()}lists/${c.id}.json`,
      imageBase: `${getBase()}thumb/${c.id}/`,
      fullImageBase: `${getBase()}full/${c.id}/`,
      links: c.links.map((l) => ({
        label: l.label,
        color: l.color,
        url: URL_PROVIDERS[l.provider] || (() => '#'),
      })),
    }));
  })();

  return initPromise;
}

export function getCollection(id: string): CollectionConfig {
  const col = COLLECTIONS.find((c) => c.id === id);
  if (!col) throw new Error(`Unknown collection: "${id}"`);
  return col;
}

export const getPlaceholder = (id: string) => `${getBase()}placeholders/${id}.webp`;
