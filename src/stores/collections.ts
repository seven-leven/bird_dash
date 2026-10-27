import { readonly, type Ref, toRef } from 'vue';
import { useCollectionData } from '../composables/collection/useCollectionData.ts';
import { useCollectionLoader } from '../data/useCollectionLoader.ts';
import { useGlobalSearch } from '../composables/collection/useGlobalSearch.ts';
import { defineInjection } from '../browser/defineInjection.ts';
import type { ViewMode } from '../types/index.ts';

/**
 * Collection data + every derivation over it: the raw fetch/cache/active state,
 * the filtered+grouped grid view (group or date mode), and the cross-collection
 * search results. The query and view mode come from the search and ui stores.
 */
export function createCollectionsStore(deps: {
  query: Ref<string>; // debounced
  viewMode: Ref<ViewMode>;
  /** Family view: drawn items only. */
  drawnOnly?: Ref<boolean>;
}) {
  const base = useCollectionLoader();
  const items = toRef(base.loadState, 'items');

  const { activeData, stats, searchedDrawnItems } = useCollectionData(
    items,
    deps.query,
    deps.viewMode,
    deps.drawnOnly,
  );
  const { globalResults, globalResultCount, globalDrawnCount } = useGlobalSearch(
    base.collections,
    base.itemsByCollection,
    deps.query,
  );

  return {
    isInitialized: base.isInitialized,
    initError: base.initError,
    list: base.collections,
    activeCollection: base.activeCollection,
    data: readonly(base.loadState),
    cache: base.itemsByCollection,
    globalStats: base.archiveCounts,
    // Derived views
    activeData,
    stats,
    drawnItems: searchedDrawnItems,
    globalResults,
    globalResultCount,
    globalDrawnCount,
    // Actions
    init: base.init,
    switch: base.selectCollection,
  };
}

export type CollectionsStore = ReturnType<typeof createCollectionsStore>;
export const [provideCollections, useCollectionsStore] = defineInjection<CollectionsStore>(
  'collections',
);
