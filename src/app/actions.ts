import { nextTick } from 'vue';
import { defineInjection } from '../browser/defineInjection.ts';
import { flashTile } from '../gallery/flashTile.ts';
import type { CollectionsStore } from '../gallery/collectionsStore.ts';
import type { SearchStore } from '../search/searchStore.ts';
import type { LayoutStore } from '../shell/layoutStore.ts';
import type { ViewStore } from '../gallery/viewStore.ts';
import type { Item } from '../types/index.ts';

/**
 * The few genuinely cross-store orchestrations. Everything single-domain lives
 * on its own store; this holds only the actions that must touch more than one.
 */
export interface AppActions {
  /** Open a collection, clearing the search and resetting the scroll and the spy. */
  selectCollection: (id: string) => Promise<void>;
  /** From a global-search result: switch collection if needed, then ring the tile. */
  selectGlobalResult: (collectionId: string, item: Item) => Promise<void>;
  /** Ring an item's tile, first making the grid show it if it is not drawn yet. */
  ringTile: (item: Item) => Promise<void>;
}

export function createAppActions(deps: {
  search: Pick<SearchStore, 'clear' | 'setDropdown'>;
  layout: Pick<LayoutStore, 'scrollToTop' | 'showPage'>;
  view: Pick<ViewStore, 'resetHeaders' | 'showUndrawn' | 'hidePlanned'>;
  collections: Pick<CollectionsStore, 'activeCollection' | 'selectCollection'>;
}): AppActions {
  const { search, layout, view, collections } = deps;

  const selectCollection = async (id: string): Promise<void> => {
    layout.showPage('gallery'); // a collection is chosen from the About page too
    search.clear();
    view.hidePlanned(); // the next collection opens as itself, not as the last one was left
    view.resetHeaders();
    await collections.selectCollection(id); // resolves once its items are in (cached or fetched)
    // Skip if the switch did not happen (unknown id) or the user has moved on
    // again while this collection was loading.
    if (collections.activeCollection.value?.id !== id) return;
    await nextTick(); // let the new grid render first
    layout.scrollToTop();
  };

  // A tile not drawn yet is hidden by the month view, by "drawn only", and in a collection
  // with nothing drawn; it is shown before it is ringed, or the ring would find nothing.
  const ringTile = async (item: Item): Promise<void> => {
    if (!item.isDrawn) view.showUndrawn();
    await nextTick();
    flashTile(item.itemId);
  };

  const selectGlobalResult = async (collectionId: string, item: Item): Promise<void> => {
    search.setDropdown(false);
    layout.showPage('gallery');
    if (collectionId !== collections.activeCollection.value?.id) {
      await selectCollection(collectionId);
    }
    await ringTile(item);
  };

  return { selectCollection, selectGlobalResult, ringTile };
}

export const [provideActions, useActions] = defineInjection<AppActions>('actions');
