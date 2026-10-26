import { afterEach } from 'vitest';
import { type Component, createApp, defineComponent, h } from 'vue';
import { type CollectionsStore, provideCollections } from '../stores/collections.ts';
import { type AppActions, provideActions } from '../stores/actions.ts';
import { provideSearch, type SearchStore } from '../stores/search.ts';
import { provideUi, type UiStore } from '../stores/ui.ts';
import { provideStats, type StatsStore } from '../stores/stats.ts';

/**
 * Stand-ins for the stores a component injects. A component reads only a few members
 * of each, so a test passes just those; the types still check every member it does pass.
 */
export interface FakeStores {
  collections?: Partial<CollectionsStore>;
  actions?: Partial<AppActions>;
  search?: Partial<SearchStore>;
  ui?: Partial<UiStore>;
  stats?: Partial<StatsStore>;
}

// Everything mounted in a test is unmounted after it, so no test has to clean up.
const mounted: (() => void)[] = [];
afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount();
});

/**
 * Mount a component into the (happy-dom) document, as the app would, and return its
 * host element. `render` lets a test pass props that change: it is called on every
 * re-render, so props built from refs stay live. Needs `// @vitest-environment happy-dom`.
 *
 *   const host = mountComponent(() => h(ItemTile, { item }));
 *   const host = mountComponent(() => h(CollectionMenu), { stores: { collections, actions } });
 */
export function mountComponent(
  render: () => ReturnType<typeof h>,
  { stores = {} }: { stores?: FakeStores } = {},
): HTMLElement {
  const Host: Component = defineComponent({
    setup() {
      // The fakes are partial on purpose (see FakeStores); the providers want whole stores.
      if (stores.collections) provideCollections(stores.collections as CollectionsStore);
      if (stores.actions) provideActions(stores.actions as AppActions);
      if (stores.search) provideSearch(stores.search as SearchStore);
      if (stores.ui) provideUi(stores.ui as UiStore);
      if (stores.stats) provideStats(stores.stats as StatsStore);
      return render;
    },
  });
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(Host);
  app.mount(host);
  mounted.push(() => {
    app.unmount();
    host.remove();
  });
  return host;
}
