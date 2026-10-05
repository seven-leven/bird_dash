/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { nextTick, reactive, ref } from 'vue';
import { useHashRoute } from './useHashRoute.ts';
import { at, makeCollection, makeItem, runInScope } from '../../../test/fixtures.ts';
import { withDom } from '../../../test/dom.ts';
import type { CollectionConfig, CollectionItem } from '../../types/index.ts';

// The router is a small state machine (bare load / reflect / deep link / own
// writes). These tests pin the two bugs that only showed up in a browser:
// a bare load rewriting the URL, and a deep link being clobbered mid-switch.

function harness(items: Record<string, CollectionItem[]>) {
  const collections = Object.keys(items).map((id) => makeCollection(id));
  const activeCollection = ref<CollectionConfig | undefined>(undefined);
  const expandedImage = reactive({ isOpen: false, item: undefined as CollectionItem | undefined });
  const switched: string[] = [];
  const opened: string[] = [];

  const switchCollection = async (id: string) => {
    switched.push(id);
    activeCollection.value = collections.find((c) => c.id === id);
    await nextTick();
  };
  const openOverlay = (item: CollectionItem) => {
    opened.push(item.itemId);
    expandedImage.item = item;
    expandedImage.isOpen = true;
  };

  // onMounted has no component here, so the hashchange hook is never attached;
  // tests call apply()/start() directly instead.
  const { value: route, stop } = runInScope(() =>
    useHashRoute({ activeCollection, expandedImage, cache: items, switchCollection, openOverlay })
  );

  return {
    route,
    stop,
    activeCollection,
    expandedImage,
    switched,
    opened,
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

Deno.test('a bare load leaves the URL alone, then later switches are reflected', () =>
  withDom(async () => {
    const h = harness({ birds: [], sharks: [] });
    await h.route.start(); // no hash → nothing to apply
    await h.loadFirst('birds');
    assertEquals(location.hash, ''); // adopting the load-time collection must not write

    await h.switchCollection('sharks');
    await nextTick();
    assertEquals(location.hash, '#sharks');
    h.stop();
  }));

Deno.test('opening and closing an item is reflected in the URL', () =>
  withDom(async () => {
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
  }));

Deno.test('a deep link switches collection, opens the item, and is not clobbered on the way', () =>
  withDom(async () => {
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
  }));

Deno.test('a deep link to an undrawn item highlights the tile instead of opening it', () =>
  withDom(async () => {
    const tile = document.createElement('div');
    tile.id = 'item-005';
    tile.scrollIntoView = () => {}; // layout does not exist in the fake DOM
    document.body.append(tile);

    const h = harness({ birds: [undrawn('005')] });
    await h.loadFirst('birds');

    location.hash = '#birds/005';
    await h.route.apply();

    assertEquals(h.opened, []);
    assert(tile.classList.contains('ring-2'), 'tile should be flashed');
    h.stop();
  }));

Deno.test("the router's own URL writes are not applied back as navigation", () =>
  withDom(async () => {
    const h = harness({ birds: [], sharks: [] });
    await h.loadFirst('birds');
    await h.switchCollection('sharks'); // user action (recorded once)
    await nextTick(); // router reflects "#sharks"
    assertEquals(location.hash, '#sharks');

    await h.route.apply(); // e.g. the hashchange event our own write triggers
    assertEquals(h.switched, ['sharks']); // not switched a second time
    h.stop();
  }));

Deno.test('the user editing the hash to another collection navigates there', () =>
  withDom(async () => {
    const h = harness({ birds: [], sharks: [] });
    await h.loadFirst('sharks');

    location.hash = '#birds';
    await h.route.apply();

    assertEquals(h.switched, ['birds']);
    assertEquals(h.activeCollection.value?.id, 'birds');
    h.stop();
  }));

Deno.test('an empty or collection-less hash is ignored', () =>
  withDom(async () => {
    const h = harness({ birds: [] });
    await h.loadFirst('birds');

    location.hash = '#';
    await h.route.apply();
    location.hash = '#/';
    await h.route.apply();

    assertEquals(h.switched, []);
    assertEquals(h.opened, []);
    h.stop();
  }));
