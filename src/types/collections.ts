export interface CollectionItem {
  id: string;
  itemId: string;
  commonName: string;
  scientificName: string;
  group: string;
  drawnDate: string;
  imageUrl: string;
  placeholderUrl: string;
  /** Precomputed once at load — avoids repeated `imageUrl !== placeholderUrl` checks. */
  isDrawn: boolean;
  /** Numeric form of `itemId`, precomputed for sort comparators. */
  sortKey: number;
  /** `drawnDate` as an epoch ms timestamp (0 if undrawn/invalid), for date sorting/grouping. */
  drawnTime: number;
  /**
   * Lowercased haystack for search — common/scientific/group/id plus all meta
   * values (Dhivehi name + Thaana script included). Built once at load.
   */
  searchText: string;
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
    url(item: CollectionItem): string | undefined;
    label: string;
    color: string;
    urlTemplate: string;
    getUrl: (item: CollectionItem) => string;
  }[];
}

export interface RawCollectionConfig {
  id: string;
  label: string;
  emoji: string;
  groupLabel: string;
  itemLabel: string;
  links: { label: string; color: string; url: string }[];
}

export interface DataState {
  items: CollectionItem[];
  loading: boolean;
  error?: string;
}

export interface GlobalStats {
  drawn: number;
  total: number;
}

export type CollectionCache = Record<string, CollectionItem[]>;
