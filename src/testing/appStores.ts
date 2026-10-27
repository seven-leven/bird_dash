// The app's real stores, wired as App.vue wires them, with nothing loaded yet: for a component
// test of the state before (or without) a collection, which the whole app never shows, and for
// the stores' own tests (with `fakeFetch`, then `collections.init()`).
//
//   const stores = appStores();
//   const host = mountComponent(() => h(SideNav), { stores });
import { createThemeStore } from '../shell/themeStore.ts';
import { createLayoutStore } from '../shell/layoutStore.ts';
import { createCollectionsStore } from '../gallery/collectionsStore.ts';
import { createViewStore } from '../gallery/viewStore.ts';
import { createSearchStore } from '../search/searchStore.ts';
import { createViewerStore } from '../viewer/viewerStore.ts';
import { createStatsStore } from '../about/statsStore.ts';
import { createAppActions } from '../app/actions.ts';
import { runInScope } from './mount.ts';

/** Every store, made in App.vue's order; stopped after the test (`runInScope`). */
export function appStores() {
  return runInScope(() => {
    const theme = createThemeStore();
    const layout = createLayoutStore();
    const collections = createCollectionsStore();
    const search = createSearchStore({
      collections: collections.collections,
      itemsByCollection: collections.itemsByCollection,
    });
    const view = createViewStore({
      items: collections.items,
      query: search.debouncedQuery,
      scrollEl: layout.scrollEl,
      isNarrow: layout.isNarrow,
      closeSidebar: layout.closeSidebar,
    });
    const viewer = createViewerStore({ drawnItems: view.drawnItems });
    const stats = createStatsStore();
    const actions = createAppActions({ search, layout, view, collections });
    return { theme, layout, collections, view, search, viewer, stats, actions };
  }).value;
}
