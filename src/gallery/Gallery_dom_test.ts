import { test } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { h, reactive } from 'vue';
import Gallery from './Gallery.vue';
import { appStores } from '../testing/appStores.ts';
import { mountComponent } from '../testing/mount.ts';

// The journeys (src/journeys/) drive the grid in the whole app; this covers what the app never
// draws: a failure before any collection is known.

test('a failure with no collection yet names "this collection"', () => {
  const stores = appStores();
  const data = reactive({ loading: false, error: 'offline', items: [] });
  const host = mountComponent(() => h(Gallery), {
    stores: { ...stores, collections: { ...stores.collections, loadState: data } },
  });
  assertStringIncludes(host.textContent!, "Couldn't load this collection");
  assertEquals(host.querySelectorAll('section').length, 0);
});
