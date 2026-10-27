import type { Item } from '../domain/toCollectionItems.ts';

export interface DataState {
  items: Item[];
  loading: boolean;
  error?: string;
}

export interface GlobalStats {
  drawn: number;
  total: number;
}

export type CollectionCache = Record<string, Item[]>;
