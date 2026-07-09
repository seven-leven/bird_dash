// =============================================================================
// SHARED COMPOSABLE TYPES
// =============================================================================

import type { Ref } from 'vue';
import type { CollectionConfig, CollectionItem } from './collections.ts';
import type { SidebarItem } from './ui.ts';

// -----------------------------------------------------------------------------
// useCollectionData Types
// -----------------------------------------------------------------------------

export type ViewMode = 'group' | 'date';

/** Sectioned grid data — sections are groups in group mode, months in date mode. */
export interface GroupedData {
  grouped: Record<string, CollectionItem[]>;
  sidebarItems: SidebarItem[];
}

export interface CollectionStats {
  total: number;
  filtered: number;
  drawn: number;
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
