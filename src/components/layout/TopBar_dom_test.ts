import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import TopBar from './TopBar.vue';
import { appStores } from '../../testing/appStores.ts';
import { mountComponent } from '../../testing/mount.ts';

// The journeys (src/journeys/) drive the header in the whole app; this covers the moment before
// any collection is known, which the app never draws (it waits for one: App.vue).

test('with no collection yet, the logo leads to the top and the group view has a plain name', () => {
  const host = mountComponent(() => h(TopBar), { stores: appStores() });
  assertEquals(
    host.querySelector('a[aria-label="Wildlife Illustrated"]')!.getAttribute('href'),
    '#',
  );
  assertEquals(
    [...host.querySelectorAll('[aria-label="View"] button')].map((b) =>
      b.getAttribute('aria-label')
    ),
    ['Groups view', 'Months view'],
  );
});
