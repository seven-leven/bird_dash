import type { CollectionEntry, ListFile } from '../data/files.ts';
import type { ItemName } from './itemNames.ts';
import { buildNames, nameWords } from './itemNames.ts';
import { linkUrl } from './linkUrl.ts';

export interface Item {
  id: string;
  itemId: string;
  commonName: string;
  scientificName: string;
  /**
   * Every name the item has, in display order, built once at load
   * (./itemNames.ts). Components render names from here; `commonName` and
   * `scientificName` stay for link templates, search matching and labels.
   */
  names: readonly ItemName[];
  group: string;
  imageUrl: string;
  placeholderUrl: string;
  /** The same placeholder drawn for the dark theme. */
  placeholderDarkUrl: string;
  /** Precomputed once at load — avoids repeated `imageUrl !== placeholderUrl` checks. */
  isDrawn: boolean;
  /** Numeric form of `itemId`, precomputed for sort comparators. */
  sortKey: number;
  /** Drawn date as an epoch ms timestamp (0 if undrawn/invalid), for date sorting/grouping. */
  drawnTime: number;
  /**
   * Lowercased haystack for search — every name (Thaana and romanisation included),
   * group, id and all meta values. Built once at load.
   */
  searchText: string;
  illustratorNote?: string;
  meta?: Record<string, string>;
}

export interface Collection {
  id: string;
  label: string;
  emoji: string;
  icon?: string;
  accent?: string;
  dataUrl: string;
  imageBase: string;
  fullImageBase: string;
  groupLabel: string;
  itemLabel: string;
  links: {
    label: string;
    url: (item: Item) => string;
  }[];
}

/** Fields with their own place on a Item; every other string field is `meta`. */
const KNOWN_KEYS = new Set([
  'id',
  'name',
  'sci',
  'dhiv',
  'dhiv_script',
  'drawn',
  'illustratorNote',
]);

/** A `collections.json` entry plus the URLs the app derives from its id. */
export function toCollection(raw: CollectionEntry, base: string): Collection {
  return {
    ...raw,
    dataUrl: `${base}lists/${raw.id}.json`,
    imageBase: `${base}thumb/${raw.id}/`,
    fullImageBase: `${base}full/${raw.id}/`,
    links: raw.links.map((l) => ({
      label: l.label,
      url: (item: Item) => linkUrl(l.url, item),
    })),
  };
}

/**
 * Flatten a list file into the items the app works with, precomputing what the
 * views would otherwise recompute per render (drawn flag, sort key, timestamp,
 * search haystack). Items are frozen: nothing mutates them after load, which
 * also lets the shallowReactive cache skip proxying them.
 */
export function toCollectionItems(
  col: Pick<Collection, 'id' | 'imageBase'>,
  raw: ListFile,
  base: string,
): Item[] {
  const items: Item[] = [];
  const placeholder = `${base}placeholders/${col.id}.webp`;
  const placeholderDark = `${base}placeholders/${col.id}-dark.webp`;

  let counter = 1;
  for (const [groupName, list] of Object.entries(raw)) {
    for (const r of list) {
      const hasImg = !!r.drawn;
      const meta: Record<string, string> = {};
      for (const [k, v] of Object.entries(r)) {
        if (!KNOWN_KEYS.has(k) && typeof v === 'string') meta[k] = v;
      }

      const itemId = String(r.id ?? '');
      const commonName = String(r.name ?? '');
      const scientificName = String(r.sci ?? '');
      const names = buildNames({
        name: commonName,
        sci: scientificName,
        dhiv: r.dhiv,
        dhiv_script: r.dhiv_script,
      });

      // Search haystack: every name (Thaana and how to say it included), then the rest.
      const searchText = [...nameWords(names), groupName, itemId, ...Object.values(meta)]
        .join(' ')
        .toLowerCase();

      items.push(Object.freeze({
        id: `${col.id}-item-${counter++}`,
        itemId,
        commonName,
        scientificName,
        names,
        group: groupName,
        imageUrl: hasImg ? `${col.imageBase}${itemId}.webp` : placeholder,
        placeholderUrl: placeholder,
        placeholderDarkUrl: placeholderDark,
        isDrawn: hasImg,
        sortKey: Number.parseInt(itemId, 10) || 0,
        drawnTime: hasImg ? (new Date(String(r.drawn)).getTime() || 0) : 0,
        searchText,
        illustratorNote: String(r.illustratorNote ?? ''),
        meta: Object.keys(meta).length ? meta : undefined,
      }));
    }
  }
  return items;
}
