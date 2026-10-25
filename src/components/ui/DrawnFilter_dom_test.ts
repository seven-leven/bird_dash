// @vitest-environment happy-dom
import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h, nextTick, ref } from 'vue';
import DrawnFilter from './DrawnFilter.vue';
import { mountComponent } from '../../testing/mountComponent.ts';

test('DrawnFilter is the count and the filter: All and Drawn, the current one pressed', async () => {
  const chosen: boolean[] = [];
  const drawnOnly = ref(false);
  const host = mountComponent(() =>
    h(DrawnFilter, {
      drawn: 15,
      total: 204,
      drawnOnly: drawnOnly.value,
      onChoose: (only: boolean) => chosen.push(drawnOnly.value = only),
    })
  );
  const [all, drawn] = [...host.querySelectorAll('button')];
  assertEquals(
    [all, drawn].map((b) => b.textContent?.replace(/\s+/g, ' ').trim()),
    ['All 204', 'Drawn 15'],
  );
  assertEquals([all, drawn].map((b) => b.getAttribute('aria-pressed')), ['true', 'false']);

  drawn.click();
  await nextTick();
  assertEquals(chosen, [true]);
  assertEquals([all, drawn].map((b) => b.getAttribute('aria-pressed')), ['false', 'true']);
});
