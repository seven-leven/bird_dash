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
