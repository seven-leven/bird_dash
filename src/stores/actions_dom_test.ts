/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createAppActions } from './actions.ts';
import { withDom } from '../../script/test/helpers/dom.ts';

/** Actions over stand-in stores, plus a tile in the fake DOM to flash. */
function setup(active: string) {
  const calls: string[] = [];
  const current = ref<{ id: string } | undefined>({ id: active });
  const actions = createAppActions({
    search: {
      clear: () => calls.push('clear'),
      setDropdown: (open: boolean) => calls.push(`dropdown:${open}`),
    },
    ui: { resetHeaders: () => {}, scrollToTop: () => calls.push('scrollToTop') },
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

Deno.test('selecting a result in the open collection closes the dropdown and flashes the tile', () =>
  withDom(async () => {
    const { actions, calls, tile } = setup('birds');
    await actions.selectGlobalResult('birds', '042');
    assertEquals(calls, ['dropdown:false', 'scrollIntoView']); // no collection switch
    assert(tile.classList.contains('ring-2'), 'the tile was not highlighted');
  }));

Deno.test('selecting a result in another collection switches first, then flashes the tile', () =>
  withDom(async () => {
    const { actions, calls, tile } = setup('birds');
    await actions.selectGlobalResult('sharks', '042');
    assertEquals(calls, [
      'dropdown:false',
      'clear',
      'switch:sharks',
      'scrollToTop',
      'scrollIntoView', // after the scroll reset, so the tile ends up in view
    ]);
    assert(tile.classList.contains('ring-2'));
  }));
