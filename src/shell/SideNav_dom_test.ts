import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h, reactive } from 'vue';
import SideNav from './SideNav.vue';
import { appStores } from '../testing/appStores.ts';
import { mountComponent } from '../testing/mount.ts';

// The journeys (src/journeys/) drive the sidebar in the whole app; this covers the moment before
// any collection is known, which the app never draws (it waits for one: App.vue).

test('with no collection yet, there is no icon or name, and the overall bar is empty', () => {
  const stores = appStores();
  const data = reactive({ loading: false, error: undefined, items: [] });
  const host = mountComponent(() => h(SideNav, { query: '' }), {
    stores: { ...stores, collections: { ...stores.collections, loadState: data } },
  });
  assertEquals(host.querySelector('h1')!.textContent?.trim(), '');
  assertEquals(host.querySelectorAll('h1 ~ svg, .size-10').length, 0);
  const label = host.querySelector('[aria-labelledby]')?.getAttribute('aria-labelledby');
  assertEquals(
    (label ? document.getElementById(label) : host.querySelector('h2'))!.textContent?.trim(),
    'Groups',
  );
  assertEquals(host.querySelector<HTMLElement>('.transition-all')!.style.width, '0%');
});
