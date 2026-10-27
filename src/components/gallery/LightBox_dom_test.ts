import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import LightBox from './LightBox.vue';
import { makeCollection } from '../../testing/fixtures.ts';
import { appStores } from '../../testing/appStores.ts';
import { mountComponent } from '../../testing/mount.ts';
import { settle } from '../../testing/settle.ts';

// The viewer journey (src/journeys/viewer_journey_test.ts) covers what a visitor does here; this
// covers the viewer open with no item to show, which the overlay store never asks for.

test('open with no item, the viewer is still a named dialog', async () => {
  mountComponent(
    () =>
      h(LightBox, {
        isOpen: true,
        drawnItems: [],
        fullImageBaseUrl: '/full/birds/',
        collection: makeCollection('birds'),
      }),
    { stores: appStores() },
  );
  await settle();
  assertEquals(
    document.querySelector('[role="dialog"]')!.getAttribute('aria-label'),
    'Image viewer',
  );
});
