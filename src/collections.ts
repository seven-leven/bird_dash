
// =============================================================================
// collections.ts
// THE single place to register a new collection on the frontend.
// Everything in App.vue, UI.vue, and beyond derives from this array.
// =============================================================================


export interface CollectionConfig {
  id: string; // e.g. 'birds' — used in URL hash, image paths
  label: string; // e.g. 'Birds' — shown in nav tab
  emoji: string; // e.g. '🐦' — shown in nav tab
  dataUrl: string; // JSON data file URL
  imageBase: string; // thumbnail folder URL
  fullImageBase: string; // full-size image folder URL
  groupLabel: string; // sidebar section header label e.g. 'Family', 'Order'
  itemLabel: string; // singular item label e.g. 'bird', 'shark'
  // External links shown in the info panel for each item.
  // url() receives the item so it can use name, sci, id, etc.
  links: {
    label: string;
    color: string; // Tailwind bg class e.g. 'bg-emerald-600 hover:bg-emerald-500'
    url: (item: CollectionItem) => string;
  }[];
}

// Generic item shape — mirrors what comes out of each collection's JSON
// after loadData() normalises it. Collection-specific extras go in meta.
export interface CollectionItem {
  id: string; // Vue :key, unique within collection
  itemId: string; // original ID from JSON e.g. '047'
  commonName: string;
  scientificName: string;
  group: string; // was 'family' — generic group name
  drawnDate: string;
  imageUrl: string;
  illustratorNote?: string;
  meta?: Record<string, string>; // collection-specific extras e.g. dhiv, dhiv_script
}

// ---------------------------------------------------------------------------
// Convention helper — derives standard paths from a collection id
// ---------------------------------------------------------------------------
function getBase(): string {
  // import.meta.env is undefined in Deno — fall back to '/'
  return (typeof import.meta.env !== 'undefined' && import.meta.env?.BASE_URL) ?? '/';
}

function derive(id: string) {
  return {
    // Pointing to the new subdirectory
    dataUrl: `${ getBase()}lists/${id}.json`, 
    // These paths remain the same as they were
    imageBase: `${ getBase()}thumb/${id}/`,
    fullImageBase: `${ getBase()}full/${id}/`,
  };
}

// ---------------------------------------------------------------------------
// Registered collections — add new ones here only
// ---------------------------------------------------------------------------
export const COLLECTIONS: CollectionConfig[] = [
  {
    id: 'birds',
    label: 'Birds',
    emoji: '🐦',
    ...derive('birds'),
    groupLabel: 'Family',
    itemLabel: 'bird',
    links: [
      {
        label: 'eBird',
        color: 'bg-emerald-600 hover:bg-emerald-500',
        url: (item) =>
          `https://www.google.com/search?q=${encodeURIComponent(item.commonName + ' ebird')}`,
      },
      {
        label: 'BirdLife',
        color: 'bg-rose-600 hover:bg-rose-500',
        url: (item) =>
          `https://datazone.birdlife.org/search?search=${encodeURIComponent(item.commonName)}`,
      },
      {
        label: 'Wiki',
        color: 'bg-slate-600 hover:bg-slate-500',
        url: (item) =>
          `https://en.wikipedia.org/wiki/Special:Search?search=${
            encodeURIComponent(item.commonName)
          }`,
      },
    ],
  },
  {
    id: 'sharks',
    label: 'Sharks',
    emoji: '🦈',
    ...derive('sharks'),
    groupLabel: 'Order',
    itemLabel: 'shark',
    links: [
      {
        label: 'iNaturalist',
        color: 'bg-emerald-600 hover:bg-emerald-500',
        url: (item) =>
          `https://www.inaturalist.org/search?q=${encodeURIComponent(item.commonName)}`,
      },
      {
        label: 'FishBase',
        color: 'bg-blue-600 hover:bg-blue-500',
        url: (item) =>
          `https://fishbase.se/search.php?q=${encodeURIComponent(item.scientificName)}`,
      },
      {
        label: 'Wiki',
        color: 'bg-slate-600 hover:bg-slate-500',
        url: (item) =>
          `https://en.wikipedia.org/wiki/Special:Search?search=${
            encodeURIComponent(item.commonName)
          }`,
      },
    ],
  },
  {
    id: 'shells',
    label: 'Shells',
    emoji: '🐚',
    ...derive('shells'),
    groupLabel: 'Group',
    itemLabel: 'shell',
    links: [
      {
        label: 'iNaturalist',
        color: 'bg-emerald-600 hover:bg-emerald-500',
        url: (item) =>
          `https://www.inaturalist.org/search?q=${encodeURIComponent(item.commonName)}`,
      },
      {
        label: 'WoRMS',
        color: 'bg-blue-600 hover:bg-blue-500',
        url: (item) =>
          `https://www.marinespecies.org/aphia.php?p=taxlist&tname=${encodeURIComponent(item.scientificName)}`,
      },
      {
        label: 'Wiki',
        color: 'bg-slate-600 hover:bg-slate-500',
        url: (item) =>
          `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(item.commonName)}`,
      },
    ],
  },
];
  // ── Add future collections here ──────────────────────────────────────────
  // {
  //   id:         'butterflies',
  //   label:      'Butterflies',
  //   emoji:      '🦋',
  //   ...derive('butterflies'),
  //   groupLabel: 'Family',
  //   itemLabel:  'butterfly',
  //   links: [ ... ],
  // },


// Convenience lookup
export function getCollection(id: string): CollectionConfig {
  const col = COLLECTIONS.find((c) => c.id === id);
  if (!col) throw new Error(`Unknown collection: "${id}"`);
  return col;
}

// Seprate placeholder — different for all collections
export const getPlaceholder = (id: string) => `${ getBase()}placeholder/${id}.webp`;