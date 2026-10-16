import { test, vi } from 'vitest';
import { assertEquals } from '@std/assert';
import { nextTick, ref } from 'vue';
import { useDebouncedRef } from './useDebounce.ts';
import { runInScope } from '../../test_helpers/fixtures.ts';

test('debounced ref trails the source by the delay', async () => {
  vi.useFakeTimers();
  try {
    const { value: { source, debounced }, stop } = runInScope(() => {
      const source = ref('a');
      return { source, debounced: useDebouncedRef(source, 120) };
    });

    assertEquals(debounced.value, 'a');

    source.value = 'b';
    await nextTick(); // let the watch fire and schedule the timeout
    assertEquals(debounced.value, 'a'); // not yet — still within the delay

    await vi.advanceTimersByTimeAsync(120);
    assertEquals(debounced.value, 'b'); // trailing edge fired

    stop();
  } finally {
    vi.useRealTimers();
  }
});

test('a burst collapses to a single trailing update', async () => {
  vi.useFakeTimers();
  try {
    const { value: { source, debounced }, stop } = runInScope(() => {
      const source = ref(0);
      return { source, debounced: useDebouncedRef(source, 100) };
    });

    for (const n of [1, 2, 3]) {
      source.value = n;
      await nextTick();
      await vi.advanceTimersByTimeAsync(50); // each change resets the 100ms timer
    }
    assertEquals(debounced.value, 0); // none have settled yet

    await vi.advanceTimersByTimeAsync(100);
    assertEquals(debounced.value, 3); // only the last value lands

    stop();
  } finally {
    vi.useRealTimers();
  }
});
