import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createViewerStore } from './viewerStore.ts';
import { at, makeItem } from '../testing/fixtures.ts';
import { runInScope } from '../testing/mount.ts';

test('open ignores undrawn items (no image to show)', () => {
  const undrawn = makeItem({ isDrawn: false });
  const { value: viewer } = runInScope(() => createViewerStore({ drawnItems: ref([]) }));
  viewer.open(undrawn);
  assertEquals(viewer.isOpen.value, false);
});

test('open shows a drawn item; show pages to another; close hides it, keeping the item', () => {
  const a = makeItem({ itemId: '001', drawnTime: at(2025, 1) });
  const b = makeItem({ itemId: '002', drawnTime: at(2025, 2) });
  const { value: viewer } = runInScope(() => createViewerStore({ drawnItems: ref([a, b]) }));

  viewer.open(a);
  assertEquals(viewer.isOpen.value, true);
  assertEquals(viewer.item.value?.itemId, '001');

  viewer.show(b);
  assertEquals(viewer.item.value?.itemId, '002');

  viewer.close();
  assertEquals(viewer.isOpen.value, false);
  assertEquals(viewer.item.value?.itemId, '002'); // still drawn while it fades out
});
