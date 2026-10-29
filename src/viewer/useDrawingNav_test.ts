import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { useDrawingNav } from './useDrawingNav.ts';
import { makeItem } from '../testing/fixtures.ts';
import type { Item } from '../domain/toCollectionItems.ts';

const items = ['001', '002', '003'].map((itemId) => makeItem({ itemId }));

/** The nav over `items`, with the open item as a ref the caller owns (as the viewer's prop). */
function nav(start: Item | undefined) {
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

test('the open drawing knows where it sits and the moves beside it', () => {
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

test('with no open item, or one not in the order, there is no place and no move', () => {
  for (const start of [undefined, makeItem({ itemId: '999' })]) {
    const { n, asked } = nav(start);
    assertEquals([n.position.value, n.hasPrevious.value, n.hasNext.value], ['', false, false]);
    n.goToNext();
    n.goToPrevious();
    assertEquals(asked, []);
  }
});

test('the images of an item come first, then the next drawing, which opens on its first', () => {
  const sketched = makeItem({ itemId: '002', imageIds: ['002', '002-2', '002-3'] });
  const order = [items[0]!, sketched, items[2]!];
  const item = ref<Item | undefined>(sketched);
  const asked: string[] = [];
  const n = useDrawingNav({
    item: () => item.value,
    items: () => order,
    onNavigate: (next) => {
      asked.push(next.itemId);
      item.value = next;
    },
  });
  const at = () => [n.imageId.value, n.imagePosition.value, n.position.value];
  assertEquals(at(), ['002', 'image 1 of 3', '2 of 3']);
  n.goToNext();
  n.goToNext();
  assertEquals(at(), ['002-3', 'image 3 of 3', '2 of 3']);
  assertEquals(asked, []); // still the same drawing
  n.goToPrevious();
  assertEquals(n.imageId.value, '002-2');
  n.goToNext();
  n.goToNext(); // past its last image: the next drawing
  assertEquals(asked, ['003']);
});

test('an item of one image has no image count, and the last image of the last item stops', () => {
  const sketched = makeItem({ itemId: '009', imageIds: ['009', '009-2'] });
  const item = ref<Item | undefined>(sketched);
  const n = useDrawingNav({
    item: () => item.value,
    items: () => [sketched],
    onNavigate: () => {},
  });
  assertEquals([n.hasPrevious.value, n.hasNext.value], [false, true]);
  n.goToNext();
  assertEquals([n.hasPrevious.value, n.hasNext.value], [true, false]);
  n.goToNext(); // nowhere further
  assertEquals(n.imageId.value, '009-2');
  item.value = items[0];
  assertEquals([n.imagePosition.value, n.imageId.value], ['', '001']);
  item.value = undefined;
  assertEquals(n.imageId.value, '');
});
