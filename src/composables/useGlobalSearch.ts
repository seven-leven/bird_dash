import { computed, type ComputedRef, type Ref } from 'vue';
import type { CollectionConfig, CollectionItem } from '../types/collections.ts';
import type { CollectionCache } from '../types/composables.ts';
import {
  type GlobalSearchCollectionGroup,
  GlobalSearchResult,
  type GlobalSearchState,
  type MatchedField,
} from '../types/composables.ts';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function highlight(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase().trim());
}

function matchedFields(item: CollectionItem, q: string): MatchedField[] {
  const fields: MatchedField[] = [];
  if (highlight(item.itemId, q)) fields.push('id');
  if (highlight(item.commonName, q)) fields.push('commonName');
  if (highlight(item.scientificName, q)) fields.push('scientificName');
  return fields;
}

// ---------------------------------------------------------------------------
// COMPOSABLE
// ---------------------------------------------------------------------------
export function useGlobalSearch(
  collections: Ref<CollectionConfig[]>,
  collectionCache: CollectionCache,
  globalSearchState: Ref<GlobalSearchState>,
) {
  /**
   * All cross-collection results, grouped by collection.
   * Only runs when there is a non-empty query.
   */
  const globalResults: ComputedRef<GlobalSearchCollectionGroup[]> = computed(() => {
    const q = globalSearchState.value.query.trim();
    if (!q) return [];

    return collections.value
      .map((col) => {
        const cached: CollectionItem[] = collectionCache[col.id] ?? [];
        const results: GlobalSearchResult[] = cached
          .filter((item) => matchedFields(item, q).length > 0)
          .map((item) => ({
            item,
            collection: col,
            matchedFields: matchedFields(item, q),
          }));

        return { collection: col, results, count: results.length };
      })
      .filter((g) => g.count > 0);
  });

  /** Flat list of all matched results across every collection. */
  const allGlobalResults: ComputedRef<GlobalSearchResult[]> = computed(() =>
    globalResults.value.flatMap((g) => g.results)
  );

  /** Total number of matched items across all collections. */
  const globalResultCount: ComputedRef<number> = computed(() => allGlobalResults.value.length);

  /** True when the query is non-empty. */
  const isGlobalSearchActive: ComputedRef<boolean> = computed(() =>
    globalSearchState.value.query.trim().length > 0
  );

  return {
    globalResults,
    allGlobalResults,
    globalResultCount,
    isGlobalSearchActive,
  };
}
