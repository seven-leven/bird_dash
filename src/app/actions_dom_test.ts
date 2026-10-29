import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createActions } from './actions.ts';
import { at, makeItem } from '../testing/fixtures.ts';

const drawn = makeItem({ itemId: '042', drawnTime: at(2025, 3, 10) });
const undrawn = makeItem({ itemId: '042', isDrawn: false });

/** Actions over stand-in stores, plus a tile in the fake DOM to flash. */
function mountActions(active: string) {
  const calls: string[] = [];
  const current = ref<{ id: string } | undefined>({ id: active });
  const actions = createActions({
    search: {
      clear: () => calls.push('clear'),
      setDropdown: (open: boolean) => calls.push(`dropdown:${open}`),
    },
    layout: {
      scrollToTop: () => calls.push('scrollToTop'),
      showPage: (page: string) => calls.push(`page:${page}`),
    },
    view: {
      resetHeaders: () => {},
      showUndrawn: () => calls.push('showUndrawn'),
      hidePlanned: () => calls.push('hidePlanned'),
    },
    collections: {
      activeCollection: current as never,
      selectCollection: (id: string) => {
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
  const { actions, calls, tile } = mountActions('birds');
  await actions.selectGlobalResult('birds', drawn);
  // No collection switch; from the About page, the result shows the gallery.
  assertEquals(calls, ['dropdown:false', 'page:gallery', 'scrollIntoView']);
  assert(tile.classList.contains('ring-2'), 'the tile was not highlighted');
});

test('selecting a result in another collection switches first, then flashes the tile', async () => {
  const { actions, calls, tile } = mountActions('birds');
  await actions.selectGlobalResult('sharks', drawn);
  assertEquals(calls, [
    'dropdown:false',
    'page:gallery',
    'page:gallery',
    'clear',
    'hidePlanned',
    'switch:sharks',
    'scrollToTop',
    'scrollIntoView', // after the scroll reset, so the tile ends up in view
  ]);
  assert(tile.classList.contains('ring-2'));
});

test('a tile not drawn yet is shown before it is ringed, or the ring would find nothing', async () => {
  const { actions, calls, tile } = mountActions('birds');
  await actions.ringTile(undrawn);
  assertEquals(calls, ['showUndrawn', 'scrollIntoView']);
  assert(tile.classList.contains('ring-2'));
});
