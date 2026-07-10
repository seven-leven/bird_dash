import { readonly, type Ref, toRef } from 'vue';
import { useCollectionData, useCollections, useGlobalSearch } from '../composables/index.ts';
import { defineInjection } from '../composables/core/injection.ts';
import type { ViewMode } from '../types/index.ts';

/**
 * Collection data + every derivation over it: the raw fetch/cache/active state,
 * the filtered+grouped grid view (group or date mode), and the cross-collection
 * search results. The query and view mode come from the search and ui stores.
 */
export function createCollectionsStore(deps: {
  query: Ref<string>; // debounced
  viewMode: Ref<ViewMode>;
}) {
  const base = useCollections();
  const items = toRef(base.data, 'items');

  const { activeData, stats, searchedDrawnItems } = useCollectionData(
    items,
    deps.query,
    deps.viewMode,
  );
  const { globalResults, globalResultCount } = useGlobalSearch(
    base.COLLECTIONS,
    base.collectionCache,
    deps.query,
  );

  return {
    isInitialized: base.isInitialized,
    list: base.COLLECTIONS,
    activeCollection: base.activeCollection,
    data: readonly(base.data),
    cache: base.collectionCache,
    globalStats: base.globalStats,
    // Derived views
    activeData,
    stats,
    drawnItems: searchedDrawnItems,
    globalResults,
    globalResultCount,
    // Actions
    init: base.init,
    switch: base.switchCollection,
  };
}

export type CollectionsStore = ReturnType<typeof createCollectionsStore>;
export const [provideCollections, useCollectionsStore] = defineInjection<CollectionsStore>(
  'collections',
);
