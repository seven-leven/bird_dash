import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import IdBadge from './IdBadge.vue';
import { mountComponent } from '../../testing/mount.ts';

test('IdBadge prints the id, or its slot, on a surface or over a drawing', () => {
  const host = mountComponent(() =>
    h('div', [
      h(IdBadge, { id: '042' }),
      h(IdBadge, { id: '042', variant: 'overlay' }),
      h(IdBadge, null, () => 'custom'),
    ])
  );
  const [surface, overlay, slotted] = [...host.querySelectorAll('span')];
  assertEquals(surface.textContent, '#042');
  assertEquals(surface.className.includes('bg-slate-100'), true);
  assertEquals(overlay.className.includes('bg-black/50'), true);
  assertEquals(slotted.textContent, 'custom');
  assertEquals(slotted.className, surface.className); // one style for every surface
});
