/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createOverlayStore } from './overlay.ts';
import { at, makeItem, runInScope } from '../../test/fixtures.ts';

Deno.test('open ignores undrawn items (no image to show)', () => {
  const undrawn = makeItem({ isDrawn: false });
  const { value: o, stop } = runInScope(() => createOverlayStore({ drawnItems: ref([]) }));
  o.open(undrawn);
  assertEquals(o.expandedImage.isOpen, false);
  stop();
});

Deno.test('open shows a drawn item; update swaps it; close hides it', () => {
  const a = makeItem({ itemId: '001', drawnTime: at(2025, 1) });
  const b = makeItem({ itemId: '002', drawnTime: at(2025, 2) });
  const { value: o, stop } = runInScope(() => createOverlayStore({ drawnItems: ref([a, b]) }));

  o.open(a);
  assertEquals(o.expandedImage.isOpen, true);
  assertEquals(o.expandedImage.item?.itemId, '001');

  o.update(b);
  assertEquals(o.expandedImage.item?.itemId, '002');

  o.close();
  assertEquals(o.expandedImage.isOpen, false);
  stop();
});
