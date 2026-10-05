import type {
  CollectionConfig,
  CollectionItem,
  RawCollectionConfig,
  RawCollectionData,
} from '../types/index.ts';

/** Fields with their own place on a CollectionItem; every other string field is `meta`. */
const KNOWN_KEYS = new Set(['id', 'name', 'sci', 'drawn', 'illustratorNote']);

/** Fill a link template's `{{common}}` / `{{sci}}` placeholders for one item. */
export function resolveUrl(template: string, item: CollectionItem): string {
  return template
    .replace(/{{common}}/g, encodeURIComponent(item.commonName))
    .replace(/{{sci}}/g, encodeURIComponent(item.scientificName));
}

/** A `collections.json` entry plus the URLs the app derives from its id. */
export function toCollectionConfig(raw: RawCollectionConfig, base: string): CollectionConfig {
  return {
    ...raw,
    dataUrl: `${base}lists/${raw.id}.json`,
    imageBase: `${base}thumb/${raw.id}/`,
    fullImageBase: `${base}full/${raw.id}/`,
    links: raw.links.map((l) => ({
      label: l.label,
      color: l.color,
      url: (item: CollectionItem) => resolveUrl(l.url, item),
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
  col: Pick<CollectionConfig, 'id' | 'imageBase'>,
  raw: RawCollectionData,
  base: string,
): CollectionItem[] {
  const items: CollectionItem[] = [];
  const placeholder = `${base}placeholders/${col.id}.webp`;

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

      // Search haystack — includes Dhivehi name + Thaana script (any meta value).
      const searchText = [commonName, scientificName, groupName, itemId, ...Object.values(meta)]
        .join(' ')
        .toLowerCase();

      items.push(Object.freeze({
        id: `${col.id}-item-${counter++}`,
        itemId,
        commonName,
        scientificName,
        group: groupName,
        imageUrl: hasImg ? `${col.imageBase}${itemId}.webp` : placeholder,
        placeholderUrl: placeholder,
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
