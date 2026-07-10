import { readonly, ref } from 'vue';
import { useDebouncedRef } from '../composables/index.ts';
import { defineInjection } from '../composables/core/injection.ts';

/**
 * Search input state — the single query that drives both the grid filter and
 * the global-search dropdown. Owns nothing about results (those are derived in
 * the collections store from this query), so it has no store dependencies.
 */
export function createSearchStore() {
  const query = ref('');
  const dropdownOpen = ref(false);
  // Debounced view of the query, consumed by the collections store's filter →
  // group → sort pipeline and the cross-collection results.
  const debouncedQuery = useDebouncedRef(query, 120);

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
    setQuery,
    setDropdown,
    clear,
  };
}

export type SearchStore = ReturnType<typeof createSearchStore>;
export const [provideSearch, useSearch] = defineInjection<SearchStore>('search');
