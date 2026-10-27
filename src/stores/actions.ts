import { nextTick } from 'vue';
import { defineInjection } from '../composables/core/injection.ts';
import { flashItem } from '../lib/flashItem.ts';
import type { CollectionsStore } from './collections.ts';
import type { SearchStore } from './search.ts';
import type { UiStore } from './ui.ts';
import type { Item } from '../types/index.ts';

/**
 * The few genuinely cross-store orchestrations. Everything single-domain lives
 * on its own store; this holds only the actions that must touch more than one.
 */
export interface AppActions {
  /** Switch collection, clearing the search and resetting the scroll/spy. */
  switchCollection: (id: string) => Promise<void>;
  /** From a global-search result: switch collection if needed, then ring the tile. */
  selectGlobalResult: (collectionId: string, item: Item) => Promise<void>;
  /** Ring an item's tile, first making the grid show it if it is not drawn yet. */
  ringTile: (item: Item) => Promise<void>;
}

export function createAppActions(deps: {
  search: Pick<SearchStore, 'clear' | 'setDropdown'>;
  ui: Pick<UiStore, 'resetHeaders' | 'scrollToTop' | 'showPage' | 'showUndrawn' | 'hidePlanned'>;
  collections: Pick<CollectionsStore, 'activeCollection' | 'switch'>;
}): AppActions {
  const { search, ui, collections } = deps;

  const switchCollection = async (id: string): Promise<void> => {
    ui.showPage('gallery'); // a collection is chosen from the About page too
    search.clear();
    ui.hidePlanned(); // the next collection opens as itself, not as the last one was left
    ui.resetHeaders();
    await collections.switch(id); // resolves once the data is in place (cached or fetched)
    // Skip if the switch did not happen (unknown id) or the user has moved on
    // again while this collection was loading.
    if (collections.activeCollection.value?.id !== id) return;
    await nextTick(); // let the new grid render first
    ui.scrollToTop();
  };

  // A tile not drawn yet is hidden by the month view, by "drawn only", and in a collection
  // with nothing drawn; it is shown before it is ringed, or the ring would find nothing.
  const ringTile = async (item: Item): Promise<void> => {
    if (!item.isDrawn) ui.showUndrawn();
    await nextTick();
    flashItem(item.itemId);
  };

  const selectGlobalResult = async (collectionId: string, item: Item): Promise<void> => {
    search.setDropdown(false);
    ui.showPage('gallery');
    if (collectionId !== collections.activeCollection.value?.id) {
      await switchCollection(collectionId);
    }
    await ringTile(item);
  };

  return { switchCollection, selectGlobalResult, ringTile };
}

export const [provideActions, useActions] = defineInjection<AppActions>('actions');
