// The app's real stores, wired as App.vue wires them, with nothing loaded yet: for a component
// test of the state before (or without) a collection, which the whole app never shows.
//
//   const stores = appStores();
//   const host = mountComponent(() => h(SideNav), { stores });
import { createSearchStore } from '../stores/search.ts';
import { createUiStore } from '../stores/ui.ts';
import { createCollectionsStore } from '../stores/collections.ts';
import { createOverlayStore } from '../stores/overlay.ts';
import { createAppActions } from '../stores/actions.ts';
import { createStatsStore } from '../stores/stats.ts';
import { runInScope } from './mount.ts';

/** Every store, created in App.vue's order; stopped after the test (`runInScope`). */
export function appStores() {
  return runInScope(() => {
    const search = createSearchStore();
    const ui = createUiStore();
    const collections = createCollectionsStore({
      query: search.debouncedQuery,
      viewMode: ui.viewMode,
      drawnOnly: ui.drawnOnly,
    });
    const overlay = createOverlayStore({ drawnItems: collections.drawnItems });
    const stats = createStatsStore();
    const actions = createAppActions({ search, ui, collections });
    return { search, ui, collections, overlay, stats, actions };
  }).value;
}
