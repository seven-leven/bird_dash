import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { nextTick, reactive, ref, toRef } from 'vue';
import { useHashRoute } from './useHashRoute.ts';
import { at, makeCollection, makeItem } from '../testing/fixtures.ts';
import type { Collection, Item, Page } from '../types/index.ts';
import { mountComposable, runInScope } from '../testing/mount.ts';

// The router is a small state machine (bare load / reflect / deep link / own
// writes). These tests pin the two bugs that only showed up in a browser:
// a bare load rewriting the URL, and a deep link being clobbered mid-switch.

function harness(items: Record<string, Item[]>) {
  const collections = Object.keys(items).map((id) => makeCollection(id));
  const activeCollection = ref<Collection | undefined>(undefined);
  const expandedImage = reactive({ isOpen: false, item: undefined as Item | undefined });
  const switched: string[] = [];
  const opened: string[] = [];
  const ringed: string[] = [];

  const switchCollection = async (id: string) => {
    switched.push(id);
    activeCollection.value = collections.find((c) => c.id === id);
    await nextTick();
  };
  const openOverlay = (item: Item) => {
    opened.push(item.itemId);
    expandedImage.item = item;
    expandedImage.isOpen = true;
  };
  const closeOverlay = () => (expandedImage.isOpen = false);
  const ringTile = async (item: Item) => void ringed.push(item.itemId);

  // onMounted has no component here, so the hashchange hook is never attached;
  // tests call apply()/start() directly instead.
  const page = ref<Page>('gallery');
  const showPage = (next: Page) => (page.value = next);
  const { value: route, stop } = runInScope(() =>
    useHashRoute({
      activeCollection,
      isViewerOpen: toRef(expandedImage, 'isOpen'),
      viewerItem: toRef(expandedImage, 'item'),
      itemsByCollection: items,
      selectCollection: switchCollection,
      openViewer: openOverlay,
      closeViewer: closeOverlay,
      ringTile,
      page,
      showPage,
    })
  );

  return {
    route,
    stop,
    page,
    activeCollection,
    expandedImage,
    switched,
    opened,
    ringed,
    switchCollection,
    /** The app's first collection finishing its load (the first state settle). */
    async loadFirst(id: string) {
      activeCollection.value = collections.find((c) => c.id === id);
      await nextTick();
    },
  };
}

const drawn = (itemId: string) => makeItem({ itemId, drawnTime: at(2025, 3, 10) });
const undrawn = (itemId: string) => makeItem({ itemId, isDrawn: false });

test('a bare load leaves the URL alone, then later switches are reflected', async () => {
  const h = harness({ birds: [], sharks: [] });
  await h.route.start(); // no hash → nothing to apply
  await h.loadFirst('birds');
  assertEquals(location.hash, ''); // adopting the load-time collection must not write

  await h.switchCollection('sharks');
  await nextTick();
  assertEquals(location.hash, '#sharks');
  h.stop();
});

test('opening and closing an item is reflected in the URL', async () => {
  const item = drawn('001');
  const h = harness({ birds: [item] });
  await h.loadFirst('birds');

  h.expandedImage.item = item;
  h.expandedImage.isOpen = true;
  await nextTick();
  assertEquals(location.hash, '#birds/001');

  h.expandedImage.isOpen = false;
  await nextTick();
  assertEquals(location.hash, '#birds');
  h.stop();
});

test('a deep link switches collection, opens the item, and is not clobbered on the way', async () => {
  const h = harness({ birds: [], sharks: [drawn('019')] });
  await h.loadFirst('birds');

  // Every hash the URL passes through (each one is a browser history entry).
  const seen: string[] = [];
  globalThis.addEventListener('hashchange', () => seen.push(location.hash));

  location.hash = '#sharks/019';
  await h.route.apply();
  await nextTick();
  await new Promise((r) => setTimeout(r, 30)); // let any hashchange events land

  assertEquals(h.switched, ['sharks']);
  assertEquals(h.opened, ['019']);
  assertEquals(location.hash, '#sharks/019');
  // The intermediate switch to "sharks" must not be written to the URL: that
  // would add a stray history entry and momentarily drop the item.
  assertEquals(seen, ['#sharks/019']);
  h.stop();
});

test('a deep link to an undrawn item rings its tile instead of opening it', async () => {
  const h = harness({ birds: [undrawn('005')] });
  await h.loadFirst('birds');

  location.hash = '#birds/005';
  await h.route.apply();

  assertEquals(h.opened, []);
  assertEquals(h.ringed, ['005']);
  h.stop();
});

test('an address that loses its item (the back button) closes the viewer', async () => {
  const h = harness({ birds: [drawn('019')] });
  await h.loadFirst('birds');
  location.hash = '#birds/019';
  await h.route.apply();
  assertEquals(h.expandedImage.isOpen, true);

  location.hash = '#birds';
  await h.route.apply();
  assertEquals(h.expandedImage.isOpen, false);
  assertEquals(h.switched, []); // the same collection: nothing to load
  h.stop();
});

test("the router's own URL writes are not applied back as navigation", async () => {
  const h = harness({ birds: [], sharks: [] });
  await h.loadFirst('birds');
  await h.switchCollection('sharks'); // user action (recorded once)
  await nextTick(); // router reflects "#sharks"
  assertEquals(location.hash, '#sharks');

  await h.route.apply(); // e.g. the hashchange event our own write triggers
  assertEquals(h.switched, ['sharks']); // not switched a second time
  h.stop();
});

test('the user editing the hash to another collection navigates there', async () => {
  const h = harness({ birds: [], sharks: [] });
  await h.loadFirst('sharks');

  location.hash = '#birds';
  await h.route.apply();

  assertEquals(h.switched, ['birds']);
  assertEquals(h.activeCollection.value?.id, 'birds');
  h.stop();
});

test('an empty or collection-less hash is ignored', async () => {
  const h = harness({ birds: [] });
  await h.loadFirst('birds');

  location.hash = '#';
  await h.route.apply();
  location.hash = '#/';
  await h.route.apply();

  assertEquals(h.switched, []);
  assertEquals(h.opened, []);
  h.stop();
});

test('an open viewer with no item selected reflects just the collection', async () => {
  const h = harness({ birds: [], sharks: [] });
  await h.loadFirst('birds');
  await h.switchCollection('sharks');
  h.expandedImage.isOpen = true; // open, but the item has not been set yet
  await nextTick();
  assertEquals(location.hash, '#sharks');
  h.stop();
});

test('a state whose hash is already in the address bar adds no history entry', async () => {
  const h = harness({ birds: [], sharks: [] });
  await h.loadFirst('birds');
  location.hash = '#sharks'; // typed by hand, not yet applied
  const entries = history.length;
  await h.switchCollection('sharks');
  await nextTick();
  assertEquals(location.hash, '#sharks');
  assertEquals(history.length, entries);
  h.stop();
});

test('mounted, the router follows hashchange events, and stops when unmounted', async () => {
  const collections = [makeCollection('birds'), makeCollection('sharks')];
  const activeCollection = ref<Collection | undefined>(collections[0]);
  const switched: string[] = [];
  const { unmount } = mountComposable(() =>
    useHashRoute({
      activeCollection,
      isViewerOpen: ref(false),
      viewerItem: ref(undefined),
      itemsByCollection: { birds: [], sharks: [] },
      page: ref<Page>('gallery'),
      showPage: () => {},
      selectCollection: async (id) => {
        switched.push(id);
        activeCollection.value = collections.find((c) => c.id === id);
      },
      openViewer: () => {},
      closeViewer: () => {},
      ringTile: async () => {},
    })
  );

  location.hash = '#sharks';
  globalThis.dispatchEvent(new HashChangeEvent('hashchange'));
  await nextTick();
  assertEquals(switched, ['sharks']);

  unmount();
  location.hash = '#birds';
  globalThis.dispatchEvent(new HashChangeEvent('hashchange'));
  await nextTick();
  assertEquals(switched, ['sharks']); // no longer listening
});

test('#about shows the About page without switching collection, and is written back', async () => {
  const h = harness({ birds: [], sharks: [] });
  await h.loadFirst('birds');

  location.hash = '#about';
  await h.route.apply();
  assertEquals(h.page.value, 'about');
  assertEquals(h.switched, []); // "about" is not a collection

  // Leaving it by a collection link shows the gallery again.
  location.hash = '#sharks';
  await h.route.apply();
  assertEquals(h.page.value, 'gallery');
  assertEquals(h.switched, ['sharks']);

  // And showing the About page from the app writes #about.
  h.page.value = 'about';
  await nextTick();
  assertEquals(location.hash, '#about');
  h.stop();
});
