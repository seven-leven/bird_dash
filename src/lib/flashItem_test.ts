/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { FakeTime } from '@std/testing/time';
import { flashItem } from './flashItem.ts';
import { withDom } from '../../test/dom.ts';

Deno.test('flashItem scrolls the tile into view and rings it, then clears the ring', () =>
  withDom(async () => {
    const time = new FakeTime();
    try {
      const tile = document.createElement('div');
      tile.id = 'item-042';
      let scrolled: unknown;
      tile.scrollIntoView = ((arg: unknown) => (scrolled = arg)) as typeof tile.scrollIntoView;
      document.body.append(tile);

      flashItem('042');
      assertEquals(scrolled, { behavior: 'smooth', block: 'center' });
      assert(tile.classList.contains('ring-2'));

      await time.tickAsync(1800);
      assert(!tile.classList.contains('ring-2'), 'ring should be removed after 1.8s');
    } finally {
      time.restore();
    }
  }));

Deno.test('flashItem quietly ignores an item that is not on screen', () =>
  withDom(() => {
    flashItem('nope'); // must not throw
  }));
