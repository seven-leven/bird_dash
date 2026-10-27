// The one way a test mounts (docs/TESTING.md, rule 6), by what it mounts:
//
//   mountComponent(() => h(ItemTile, { item }))   a component, in the (happy-dom) document
//   mountComposable(() => useBreakpoints())       a composable whose onMounted / onUnmounted must fire
//   runInScope(() => createSearchStore())         a composable or store that must not mount
//   mountWithoutDom(Parent)                       components, with no document at all
//
// Everything mounted is unmounted after its test, so no test has to clean up.
import { afterEach } from 'vitest';
import { type Component, createApp, createRenderer, defineComponent, effectScope, h } from 'vue';
import { type CollectionsStore, provideCollections } from '../stores/collections.ts';
import { type AppActions, provideActions } from '../stores/actions.ts';
import { provideSearch, type SearchStore } from '../stores/search.ts';
import { provideUi, type UiStore } from '../stores/ui.ts';
import { provideStats, type StatsStore } from '../stores/stats.ts';
import { captureConsole } from './fakes/captureConsole.ts';

const mounted: (() => void)[] = [];
afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount();
});

/** `unmount`, run once: by the test, or after it if the test did not. */
function unmountOnce(unmount: () => void): () => void {
  let done = false;
  const once = () => {
    if (!done) unmount();
    done = true;
  };
  mounted.push(once);
  return once;
}

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

/**
 * Mount a component into the (happy-dom) document, as the app would, and return its
 * host element. `render` lets a test pass props that change: it is called on every
 * re-render, so props built from refs stay live. Needs a document: a `_dom_test` file has one.
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
  unmountOnce(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

// A renderer that draws nothing. It mounts real components — so onMounted / onUnmounted and
// provide / inject behave exactly as in the app — without a document for Vue itself.
type Node = { parent: Node | null };
const withoutDom = createRenderer<Node, Node>({
  insert: (el, parent) => (el.parent = parent),
  remove: (el) => (el.parent = null),
  createElement: () => ({ parent: null }),
  createText: () => ({ parent: null }),
  createComment: () => ({ parent: null }),
  setText: () => {},
  setElementText: () => {},
  parentNode: (node) => node.parent,
  nextSibling: () => null,
  patchProp: () => {},
});

/**
 * Mount `component` with the renderer that draws nothing; `onWarn` takes Vue's warnings
 * (a test about a warned-about situation passes one). Returns `unmount`.
 */
export function mountWithoutDom(
  component: Component,
  { onWarn }: { onWarn?: (message: string) => void } = {},
): { unmount: () => void } {
  const app = withoutDom.createApp(component);
  if (onWarn) app.config.warnHandler = onWarn;
  app.mount({ parent: null });
  return { unmount: unmountOnce(() => app.unmount()) };
}

/**
 * Run a composable inside a mounted component and return what it returned. `onMounted`
 * hooks have run by the time this returns; `unmount()` runs the `onUnmounted` hooks. Use
 * this (not `runInScope`) when the code under test registers lifecycle hooks that must fire.
 */
export function mountComposable<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T;
  const { unmount } = mountWithoutDom(defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  }));
  return { result, unmount };
}

/**
 * Run a factory inside a Vue effect scope, with no component, so composables using
 * onScopeDispose (useDebouncedRef, the stores) can be torn down with `stop`. Its lifecycle
 * hooks never fire: use `mountComposable` when they must.
 */
export function runInScope<T>(fn: () => T): { value: T; stop: () => void } {
  // Composables register onMounted/onUnmounted; with no component around them Vue
  // warns on every call. That is expected here, so drop only that warning.
  using _warnings = captureConsole((line) => line.includes('no active component instance'));
  const scope = effectScope();
  const value = scope.run(fn) as T;
  return { value, stop: unmountOnce(() => scope.stop()) };
}
