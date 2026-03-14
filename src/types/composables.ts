// =============================================================================
// SHARED COMPOSABLE TYPES
// =============================================================================

import type { ComputedRef, Ref } from 'vue';
import type {
  CollectionCache,
  CollectionConfig,
  CollectionItem,
  DataState,
  GlobalStats,
} from './collections.ts';
import type { SidebarItem, UIState } from './ui.ts';

// Re-export for consumers who import composable types only
export type { CollectionCache, DataState, GlobalStats, SidebarItem, UIState };

// -----------------------------------------------------------------------------
// useCollectionData Types
// -----------------------------------------------------------------------------

export type ViewMode = 'group' | 'date';

export interface GroupedData {
  grouped: Record<string, CollectionItem[]>;
  sidebarItems: SidebarItem[];
}

export interface DateData {
  grouped: Record<string, CollectionItem[]>;
  sidebarItems: SidebarItem[];
}

export interface CollectionStats {
  total: number;
  filtered: number;
  drawn: number;
  mode: ViewMode;
}

export interface UseCollectionDataReturn {
  activeData: ComputedRef<GroupedData | DateData>;
  stats: ComputedRef<CollectionStats>;
  searchedDrawnItems: ComputedRef<CollectionItem[]>;
}

// -----------------------------------------------------------------------------
// useCollections Types
// -----------------------------------------------------------------------------

export interface UseCollectionsReturn {
  isInitialized: Ref<boolean>;
  activeCollectionId: Ref<string>;
  collectionCache: CollectionCache;
  data: DataState;
  activeCollection: ComputedRef<CollectionConfig | undefined>;
  globalStats: ComputedRef<GlobalStats>;
  placeholderImage: ComputedRef<string>;
  loadData: () => Promise<void>;
  switchCollection: (id: string, onSwitch?: () => void) => Promise<void>;
  prefetchOtherCollections: () => Promise<void>;
  init: () => Promise<void>;
  COLLECTIONS: Ref<CollectionConfig[]>;
}

// -----------------------------------------------------------------------------
// useScrollLogic Types
// -----------------------------------------------------------------------------

export interface ScrollUI {
  scrollContainer: HTMLElement | null;
  headerRefs: Record<string, HTMLElement | null>;
}

export interface UseScrollLogicReturn {
  activeSection: Ref<string>;
  updateActiveSection: () => void;
  goToSection: (name: string) => void;
  handleHash: () => void;
}

// -----------------------------------------------------------------------------
// Global Search Types
// -----------------------------------------------------------------------------

export type MatchedField = 'id' | 'commonName' | 'scientificName';

export interface GlobalSearchResult {
  item: CollectionItem;
  collection: CollectionConfig;
  matchedFields: MatchedField[];
}

export interface GlobalSearchCollectionGroup {
  collection: CollectionConfig;
  results: GlobalSearchResult[];
  count: number;
}

export interface GlobalSearchState {
  query: string;
  isOpen: boolean;
}
