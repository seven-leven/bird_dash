/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createAppActions } from './actions.ts';

// A stand-in collections store: `switch` makes the collection active and resolves
// either at once (cached) or when the test releases it (still loading).
function setup(known: string[]) {
  const calls: string[] = [];
  const active = ref<{ id: string } | undefined>({ id: known[0] });
  const pending = new Map<string, () => void>();

  const actions = createAppActions({
    search: { clear: () => calls.push('clear'), setDropdown: () => {} },
    ui: {
      resetHeaders: () => calls.push('resetHeaders'),
      scrollToTop: () => calls.push('scrollToTop'),
    },
    collections: {
      activeCollection: active as never,
      switch: (id: string) => {
        if (!known.includes(id)) return Promise.resolve();
        active.value = { id };
        return pending.has(id) ? new Promise<void>((r) => pending.set(id, r)) : Promise.resolve();
      },
    },
  });
  const slow = (id: string) => pending.set(id, () => {});
  const finish = (id: string) => pending.get(id)!();
  return { actions, calls, slow, finish };
}

Deno.test('switchCollection: clears the search, then scrolls to the top once the data is in', async () => {
  const { actions, calls } = setup(['a', 'b']);
  await actions.switchCollection('b');
  assertEquals(calls, ['clear', 'resetHeaders', 'scrollToTop']);
});

Deno.test('switchCollection: a collection that has to be fetched is scrolled to the top too', async () => {
  const { actions, calls, slow, finish } = setup(['a', 'b']);
  slow('b');
  const done = actions.switchCollection('b');
  await Promise.resolve();
  assertEquals(calls.includes('scrollToTop'), false, 'scrolled before the data arrived');

  finish('b');
  await done;
  assertEquals(calls.filter((c) => c === 'scrollToTop').length, 1);
});

Deno.test('switchCollection: a load the user has already left does not scroll the new view', async () => {
  const { actions, calls, slow, finish } = setup(['a', 'b', 'c']);
  slow('b');
  const toB = actions.switchCollection('b');
  await actions.switchCollection('c'); // moved on while b was loading
  assertEquals(calls.filter((c) => c === 'scrollToTop').length, 1);

  finish('b');
  await toB;
  assertEquals(calls.filter((c) => c === 'scrollToTop').length, 1, 'b scrolled c to the top');
});

Deno.test('switchCollection: an unknown id does not scroll', async () => {
  const { actions, calls } = setup(['a']);
  await actions.switchCollection('nope');
  assertEquals(calls.includes('scrollToTop'), false);
});
