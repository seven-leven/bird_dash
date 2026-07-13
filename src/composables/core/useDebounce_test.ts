/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { FakeTime } from '@std/testing/time';
import { nextTick, ref } from 'vue';
import { useDebouncedRef } from './useDebounce.ts';
import { runInScope } from '../../../test/fixtures.ts';

Deno.test('debounced ref trails the source by the delay', async () => {
  const time = new FakeTime();
  try {
    const { value: { source, debounced }, stop } = runInScope(() => {
      const source = ref('a');
      return { source, debounced: useDebouncedRef(source, 120) };
    });

    assertEquals(debounced.value, 'a');

    source.value = 'b';
    await nextTick(); // let the watch fire and schedule the timeout
    assertEquals(debounced.value, 'a'); // not yet — still within the delay

    await time.tickAsync(120);
    assertEquals(debounced.value, 'b'); // trailing edge fired

    stop();
  } finally {
    time.restore();
  }
});

Deno.test('a burst collapses to a single trailing update', async () => {
  const time = new FakeTime();
  try {
    const { value: { source, debounced }, stop } = runInScope(() => {
      const source = ref(0);
      return { source, debounced: useDebouncedRef(source, 100) };
    });

    for (const n of [1, 2, 3]) {
      source.value = n;
      await nextTick();
      await time.tickAsync(50); // each change resets the 100ms timer
    }
    assertEquals(debounced.value, 0); // none have settled yet

    await time.tickAsync(100);
    assertEquals(debounced.value, 3); // only the last value lands

    stop();
  } finally {
    time.restore();
  }
});
