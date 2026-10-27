import { computed, type ComputedRef, type Ref } from 'vue';
import { normalizeQuery } from '../domain/normalizeQuery.ts';
import type {
  Collection,
  Item,
  ItemsByCollection,
  MatchedField,
  SearchResult,
  SearchResultGroup,
} from '../types/index.ts';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
/** Which fields match — `ql` is expected already lowercased/trimmed by the caller. */
function matchedFields(item: Item, ql: string): MatchedField[] {
  const fields: MatchedField[] = [];
  if (item.itemId.toLowerCase().includes(ql)) fields.push('id');
  if (item.commonName.toLowerCase().includes(ql)) fields.push('commonName');
  if (item.scientificName.toLowerCase().includes(ql)) fields.push('scientificName');
  // A match on the group alone highlights nothing in the names, so the result row
  // names the group instead (docs/DESIGN.md §10).
  if (item.group.toLowerCase().includes(ql)) fields.push('group');
  return fields;
}

// ---------------------------------------------------------------------------
// COMPOSABLE
// ---------------------------------------------------------------------------
export function useSearchResults(
  collections: Ref<Collection[]>,
  collectionCache: ItemsByCollection,
  query: Ref<string>,
) {
  /**
   * All cross-collection results, grouped by collection.
   * Single pass per item (match once, reuse the fields), query normalized once.
   */
  const globalResults: ComputedRef<SearchResultGroup[]> = computed(() => {
    const ql = normalizeQuery(query.value);
    if (!ql) return [];

    const groups: SearchResultGroup[] = [];
    for (const col of collections.value) {
      const cached: Item[] = collectionCache[col.id] ?? [];
      const results: SearchResult[] = [];
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

  /** Total number of matched items across all collections. */
  const globalResultCount: ComputedRef<number> = computed(() =>
    globalResults.value.reduce((n, g) => n + g.count, 0)
  );

  /** How many of the matches are drawn, for "10 matches, 1 drawn". */
  const globalDrawnCount: ComputedRef<number> = computed(() =>
    globalResults.value.reduce((n, g) => n + g.results.filter((r) => r.item.isDrawn).length, 0)
  );

  return { globalResults, globalResultCount, globalDrawnCount };
}
