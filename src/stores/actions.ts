import { nextTick } from 'vue';
import { defineInjection } from '../composables/core/injection.ts';
import { flashItem } from '../lib/flashItem.ts';
import type { CollectionsStore } from './collections.ts';
import type { SearchStore } from './search.ts';
import type { UiStore } from './ui.ts';

/**
 * The few genuinely cross-store orchestrations. Everything single-domain lives
 * on its own store; this holds only the actions that must touch more than one.
 */
export interface AppActions {
  /** Switch collection, clearing the search and resetting the scroll/spy. */
  switchCollection: (id: string) => Promise<void>;
  /** From a global-search result: switch collection if needed, then flash the tile. */
  selectGlobalResult: (collectionId: string, itemId: string) => Promise<void>;
}

export function createAppActions(deps: {
  search: Pick<SearchStore, 'clear' | 'setDropdown'>;
  ui: Pick<UiStore, 'resetHeaders' | 'scrollToTop'>;
  collections: Pick<CollectionsStore, 'activeCollection' | 'switch'>;
}): AppActions {
  const { search, ui, collections } = deps;

  const switchCollection = async (id: string): Promise<void> => {
    search.clear();
    ui.resetHeaders();
    await collections.switch(id); // resolves once the data is in place (cached or fetched)
    // Skip if the switch did not happen (unknown id) or the user has moved on
    // again while this collection was loading.
    if (collections.activeCollection.value?.id !== id) return;
    await nextTick(); // let the new grid render first
    ui.scrollToTop();
  };

  const selectGlobalResult = async (collectionId: string, itemId: string): Promise<void> => {
    search.setDropdown(false);
    if (collectionId !== collections.activeCollection.value?.id) {
      await switchCollection(collectionId);
    }
    await nextTick();
    flashItem(itemId);
  };

  return { switchCollection, selectGlobalResult };
}

export const [provideActions, useActions] = defineInjection<AppActions>('actions');
