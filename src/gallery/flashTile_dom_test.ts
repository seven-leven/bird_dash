import { test, vi } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { flashTile } from './flashTile.ts';

test('flashTile scrolls the tile into view and rings it, then clears the ring', async () => {
  vi.useFakeTimers();
  try {
    const tile = document.createElement('div');
    tile.id = 'item-042';
    let scrolled: unknown;
    tile.scrollIntoView = ((arg: unknown) => (scrolled = arg)) as typeof tile.scrollIntoView;
    document.body.append(tile);

    flashTile('042');
    assertEquals(scrolled, { behavior: 'smooth', block: 'center' });
    assert(tile.classList.contains('ring-2'));

    await vi.advanceTimersByTimeAsync(1800);
    assert(!tile.classList.contains('ring-2'), 'ring should be removed after 1.8s');
  } finally {
    vi.useRealTimers();
  }
});

test('flashTile quietly ignores an item that is not on screen', () => {
  flashTile('nope'); // must not throw
});
