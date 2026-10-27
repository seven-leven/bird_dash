import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createCollectionsStore } from './collectionsStore.ts';
import { createViewStore } from './viewStore.ts';
import { fakeFetch } from '../testing/fakes/fakeFetch.ts';
import { archiveRoutes } from '../testing/scenarios/archive.ts';
import { captureConsole } from '../testing/fakes/captureConsole.ts';
import { runInScope } from '../testing/mount.ts';
import { settle } from '../testing/settle.ts';

// The gallery's two stores end to end: real loading and caching, and the view over it
// (filtering, grouping, counting), with only the network replaced.

/** The collections and view stores over the fixture archive, loaded; `fetch` goes on dispose. */
async function storesOverTheArchive() {
  const fetch = fakeFetch(archiveRoutes());
  const query = ref('');
  const { collections, view } = runInScope(() => {
    const collections = createCollectionsStore();
    const view = createViewStore({
      items: collections.items,
      query,
      scrollEl: ref(null),
      isNarrow: ref(false),
      closeSidebar: () => {},
    });
    return { collections, view };
  }).value;
  await collections.init();
  await settle(); // let the background prefetch land
  return { collections, view, query, [Symbol.dispose]: () => fetch[Symbol.dispose]() };
}

const names = (items: readonly { commonName: string }[]) => items.map((i) => i.commonName);

test('after init the first collection is active, grouped, and counted', async () => {
  using loaded = await storesOverTheArchive();
  const { collections, view } = loaded;
  assertEquals(collections.isInitialized.value, true);
  assertEquals(collections.collections.value.map((c) => c.id), ['birds', 'sharks']);
  assertEquals(collections.activeCollection.value?.id, 'birds');

  assertEquals(Object.keys(view.activeData.value.grouped), ['Ducks', 'Herons']);
  assertEquals(view.counts.value, { total: 3, filtered: 3, filteredDrawn: 2, drawn: 2 });
  assertEquals(collections.archiveCounts.value, { drawn: 2, total: 4 }); // sharks counted too
});

test('the query filters the grid and the counts, across name, group and id', async () => {
  using loaded = await storesOverTheArchive();
  const { view, query } = loaded;
  query.value = 'heron';
  assertEquals(Object.keys(view.activeData.value.grouped), ['Herons']);
  assertEquals(view.counts.value.filtered, 1);

  query.value = 'ducks'; // a group name matches every item in the group
  assertEquals(names(view.activeData.value.grouped.Ducks), ['Mallard', 'Garganey']);

  query.value = 'nothing-matches';
  assertEquals(view.activeData.value.grouped, {});
  assertEquals(view.counts.value.filtered, 0);
});

test('month view shows only drawn items, newest first; the viewer still pages oldest to newest', async () => {
  using loaded = await storesOverTheArchive();
  const { view } = loaded;
  view.setViewMode('month');
  const months = Object.keys(view.activeData.value.grouped);
  assertEquals(months, ['March 2025', 'January 2025']);
  assertEquals(view.counts.value.total, 2); // undrawn items are not part of this view
  assertEquals(names(view.drawnItems.value), ['Mallard', 'Grey Heron']);
});

test('selecting a collection swaps the grid; every list loaded is kept', async () => {
  using loaded = await storesOverTheArchive();
  const { collections, view } = loaded;
  await collections.selectCollection('sharks');
  assertEquals(collections.activeCollection.value?.id, 'sharks');
  assertEquals(Object.keys(view.activeData.value.grouped), ['Requiem']);
  assertEquals(view.drawnItems.value, []); // no shark is drawn yet
  assertEquals(Object.keys(collections.itemsByCollection).sort(), ['birds', 'sharks']);
});

test('components cannot change the loaded data: it is read-only outside the store', async () => {
  using loaded = await storesOverTheArchive();
  const { collections } = loaded;
  // Vue warns on each attempt; that is the behaviour under test.
  using warnings = captureConsole((line) => line.includes('target is readonly'));
  const before = collections.loadState.items.length;
  const writable = collections.loadState as unknown as { items: unknown[]; loading: boolean };
  writable.items = [];
  writable.loading = true;
  assertEquals(collections.loadState.items.length, before);
  assertEquals(collections.loadState.loading, false);
  assertEquals(warnings.lines.length, 2);
});
