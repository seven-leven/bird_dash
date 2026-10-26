import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { useDrawingNav } from './useDrawingNav.ts';
import { makeItem } from '../../testing/fixtures.ts';
import type { CollectionItem } from '../../types/index.ts';

const items = ['001', '002', '003'].map((itemId) => makeItem({ itemId }));

/** The nav over `items`, with the open item as a ref the caller owns (as the viewer's prop). */
function nav(start: CollectionItem | undefined) {
  const item = ref(start);
  const asked: string[] = [];
  const n = useDrawingNav({
    item: () => item.value,
    items: () => items,
    onNavigate: (next) => {
      asked.push(next.itemId);
      item.value = next; // the parent feeds it back
    },
  });
  return { n, item, asked };
}

test('useDrawingNav: where the open drawing sits, and the moves beside it', () => {
  const { n, asked } = nav(items[0]);
  assertEquals([n.position.value, n.hasPrevious.value, n.hasNext.value], ['1 of 3', false, true]);
  n.goToPrevious(); // nothing before the first
  n.goToNext();
  n.goToNext();
  assertEquals([n.position.value, n.hasPrevious.value, n.hasNext.value], ['3 of 3', true, false]);
  n.goToNext(); // nothing after the last
  n.goToPrevious();
  assertEquals(asked, ['002', '003', '002']);
});

test('useDrawingNav: no open item, or one not in the order, has no place and no moves', () => {
  for (const start of [undefined, makeItem({ itemId: '999' })]) {
    const { n, asked } = nav(start);
    assertEquals([n.position.value, n.hasPrevious.value, n.hasNext.value], ['', false, false]);
    n.goToNext();
    n.goToPrevious();
    assertEquals(asked, []);
  }
});
