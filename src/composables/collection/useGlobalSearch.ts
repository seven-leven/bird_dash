import { computed, type ComputedRef, type Ref } from 'vue';
import type {
  CollectionCache,
  CollectionConfig,
  CollectionItem,
  GlobalSearchCollectionGroup,
  GlobalSearchResult,
  MatchedField,
} from '../../types/index.ts';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
/** Which fields match — `ql` is expected already lowercased/trimmed by the caller. */
function matchedFields(item: CollectionItem, ql: string): MatchedField[] {
  const fields: MatchedField[] = [];
  if (item.itemId.toLowerCase().includes(ql)) fields.push('id');
  if (item.commonName.toLowerCase().includes(ql)) fields.push('commonName');
  if (item.scientificName.toLowerCase().includes(ql)) fields.push('scientificName');
  return fields;
}

// ---------------------------------------------------------------------------
// COMPOSABLE
// ---------------------------------------------------------------------------
export function useGlobalSearch(
  collections: Ref<CollectionConfig[]>,
  collectionCache: CollectionCache,
  query: Ref<string>,
) {
  /**
   * All cross-collection results, grouped by collection.
   * Single pass per item (match once, reuse the fields), query normalized once.
   */
  const globalResults: ComputedRef<GlobalSearchCollectionGroup[]> = computed(() => {
    const ql = query.value.trim().toLowerCase();
    if (!ql) return [];

    const groups: GlobalSearchCollectionGroup[] = [];
    for (const col of collections.value) {
      const cached: CollectionItem[] = collectionCache[col.id] ?? [];
      const results: GlobalSearchResult[] = [];
      for (const item of cached) {
        // Match against the full haystack (name, sci, id, Dhivehi, …); compute
        // matchedFields only for the display fields we highlight.
        if (!item.searchText.includes(ql)) continue;
        results.push({ item, collection: col, matchedFields: matchedFields(item, ql) });
      }
      if (results.length > 0) groups.push({ collection: col, results, count: results.length });
    }
    return groups;
  });

  /** Flat list of all matched results across every collection. */
  const allGlobalResults: ComputedRef<GlobalSearchResult[]> = computed(() =>
    globalResults.value.flatMap((g) => g.results)
  );

  /** Total number of matched items across all collections. */
  const globalResultCount: ComputedRef<number> = computed(() => allGlobalResults.value.length);

  /** True when the query is non-empty. */
  const isGlobalSearchActive: ComputedRef<boolean> = computed(() => query.value.trim().length > 0);

  return {
    globalResults,
    allGlobalResults,
    globalResultCount,
    isGlobalSearchActive,
  };
}
