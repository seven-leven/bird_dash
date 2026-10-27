import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createAppActions } from './actions.ts';

/** Actions over stand-in stores, plus a tile in the fake DOM to flash. */
function setup(active: string) {
  const calls: string[] = [];
  const current = ref<{ id: string } | undefined>({ id: active });
  const actions = createAppActions({
    search: {
      clear: () => calls.push('clear'),
      setDropdown: (open: boolean) => calls.push(`dropdown:${open}`),
    },
    ui: {
      resetHeaders: () => {},
      scrollToTop: () => calls.push('scrollToTop'),
      showPage: (page) => calls.push(`page:${page}`),
    },
    collections: {
      activeCollection: current as never,
      switch: (id: string) => {
        calls.push(`switch:${id}`);
        current.value = { id };
        return Promise.resolve();
      },
    },
  });

  const tile = document.createElement('div');
  tile.id = 'item-042';
  tile.scrollIntoView = () => calls.push('scrollIntoView');
  document.body.append(tile);
  return { actions, calls, tile };
}

test('selecting a result in the open collection closes the dropdown and flashes the tile', async () => {
  const { actions, calls, tile } = setup('birds');
  await actions.selectGlobalResult('birds', '042');
  // No collection switch; from the About page, the result shows the gallery.
  assertEquals(calls, ['dropdown:false', 'page:gallery', 'scrollIntoView']);
  assert(tile.classList.contains('ring-2'), 'the tile was not highlighted');
});

test('selecting a result in another collection switches first, then flashes the tile', async () => {
  const { actions, calls, tile } = setup('birds');
  await actions.selectGlobalResult('sharks', '042');
  assertEquals(calls, [
    'dropdown:false',
    'page:gallery',
    'page:gallery',
    'clear',
    'switch:sharks',
    'scrollToTop',
    'scrollIntoView', // after the scroll reset, so the tile ends up in view
  ]);
  assert(tile.classList.contains('ring-2'));
});
