import { readonly, type Ref, ref } from 'vue';
import { useDebouncedRef } from '../browser/useDebouncedRef.ts';
import { defineInjection } from '../browser/defineInjection.ts';
import { useGlobalSearch } from '../composables/collection/useGlobalSearch.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { ItemsByCollection } from '../data/useCollectionLoader.ts';

/** How long typing must pause before the grid and the results follow it, in ms. */
export const SEARCH_DELAY = 120;

/**
 * The search: the one query that filters the grid and finds results in every collection,
 * whether the results are open, and the results themselves, grouped by collection.
 */
export function createSearchStore(deps: {
  collections: Ref<Collection[]>;
  itemsByCollection: ItemsByCollection;
}) {
  const query = ref('');
  const dropdownOpen = ref(false);
  // Debounced view of the query, consumed by the collections store's filter →
  // group → sort pipeline and the cross-collection results.
  const debouncedQuery = useDebouncedRef(query, SEARCH_DELAY);
  const { globalResults, globalResultCount, globalDrawnCount } = useGlobalSearch(
    deps.collections,
    deps.itemsByCollection,
    debouncedQuery,
  );

  const setQuery = (q: string): void => {
    query.value = q;
    if (q.trim()) dropdownOpen.value = true; // open-on-type lives in one place
  };
  const setDropdown = (open: boolean): void => {
    dropdownOpen.value = open;
  };
  const clear = (): void => {
    query.value = '';
    dropdownOpen.value = false;
  };

  return {
    query: readonly(query),
    dropdownOpen: readonly(dropdownOpen),
    debouncedQuery,
    results: globalResults,
    resultCount: globalResultCount,
    drawnResultCount: globalDrawnCount,
    setQuery,
    setDropdown,
    clear,
  };
}

export type SearchStore = ReturnType<typeof createSearchStore>;
export const [provideSearchStore, useSearchStore] = defineInjection<SearchStore>('search');
