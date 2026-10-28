import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import Viewer from './Viewer.vue';
import { makeCollection, makeItem } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import { settle } from '../testing/settle.ts';

// The viewer journey (src/journeys/viewer_journey_test.ts) covers what a visitor does here; this
// covers the viewer open with no item to show, which the viewer store never asks for. It injects
// no store: what it shows comes in as props.

test('open with no item, the viewer is still a named dialog', async () => {
  mountComponent(
    () =>
      h(Viewer, {
        isOpen: true,
        drawnItems: [],
        fullImageBaseUrl: '/full/birds/',
        collection: makeCollection('birds'),
        query: '',
      }),
  );
  await settle();
  assertEquals(
    document.querySelector('dialog')!.getAttribute('aria-label'),
    'Image viewer',
  );
});

test('the counter names the image too, for a drawing that has more than one', async () => {
  const sketched = makeItem({ itemId: '004', imageIds: ['004', '004-2'] });
  mountComponent(() =>
    h(Viewer, {
      isOpen: true,
      item: sketched,
      drawnItems: [sketched],
      fullImageBaseUrl: '/full/birds/',
      collection: makeCollection('birds'),
      query: '',
    })
  );
  await settle();
  const counter = document.querySelector('dialog [aria-live="polite"]')!;
  assertEquals(counter.textContent!.trim(), '1 of 1 · image 1 of 2');
});
