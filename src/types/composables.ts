// =============================================================================
// SHARED COMPOSABLE TYPES
// =============================================================================

import type { Ref } from 'vue';
import type { Collection, Item } from '../domain/toCollectionItems.ts';
import type { SectionEntry } from './ui.ts';

// View lives in ui.ts; re-exported here for the composable
// types and consumers that import it from this module.
export type { View } from './ui.ts';

// -----------------------------------------------------------------------------
// useCollectionView Types
// -----------------------------------------------------------------------------

/** Sectioned grid data — sections are groups in group mode, months in month view. */
export interface CollectionView {
  grouped: Record<string, Item[]>;
  sidebarItems: SectionEntry[];
}

export interface ViewCounts {
  total: number;
  filtered: number;
  /** How many of the filtered items are drawn. */
  filteredDrawn: number;
  drawn: number;
}

// -----------------------------------------------------------------------------
// useScrollSpy Types
// -----------------------------------------------------------------------------

export interface UseScrollLogicReturn {
  activeSection: Ref<string>;
  updateActiveSection: () => void;
  goToSection: (name: string) => void;
}

// -----------------------------------------------------------------------------
// Global Search Types
// -----------------------------------------------------------------------------

export type MatchedField = 'id' | 'commonName' | 'scientificName' | 'group';

export interface SearchResult {
  item: Item;
  collection: Collection;
  matchedFields: MatchedField[];
}

export interface SearchResultGroup {
  collection: Collection;
  results: SearchResult[];
  count: number;
}
