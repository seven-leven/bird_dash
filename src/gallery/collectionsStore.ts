import { computed, readonly } from 'vue';
import { useCollectionLoader } from '../data/useCollectionLoader.ts';
import { defineInjection } from '../browser/defineInjection.ts';

/**
 * The archive as loaded: the collections, the one on screen and its items (with whether
 * they are loading or failed), every list loaded so far, and how much of it is drawn.
 * What the grid shows of it is the view store's.
 */
export function createCollectionsStore() {
  const loader = useCollectionLoader();
  return {
    isInitialized: loader.isInitialized,
    initError: loader.initError,
    collections: loader.collections,
    activeCollection: loader.activeCollection,
    loadState: readonly(loader.loadState),
    /** The items of the collection on screen. */
    items: computed(() => loader.loadState.items),
    itemsByCollection: loader.itemsByCollection,
    archiveCounts: loader.archiveCounts,
    init: loader.init,
    selectCollection: loader.selectCollection,
  };
}

export type CollectionsStore = ReturnType<typeof createCollectionsStore>;
export const [provideCollectionsStore, useCollectionsStore] = defineInjection<CollectionsStore>(
  'collections',
);
