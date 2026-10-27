import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { useResultKeys } from './useResultKeys.ts';
import { makeCollection, makeItem } from '../testing/fixtures.ts';
import type { SearchResultGroup } from '../types/index.ts';

const birds = makeCollection('birds');
const shells = makeCollection('shells');

// Two groups: birds has 2 results, shells has 1 → flat order [b0, b1, s0].
const groups: SearchResultGroup[] = [
  {
    collection: birds,
    count: 2,
    results: [
      { collection: birds, item: makeItem({ itemId: 'b0' }), matchedFields: [] },
      { collection: birds, item: makeItem({ itemId: 'b1' }), matchedFields: [] },
    ],
  },
  {
    collection: shells,
    count: 1,
    results: [{ collection: shells, item: makeItem({ itemId: 's0' }), matchedFields: [] }],
  },
];

function nav() {
  return useResultKeys(() => groups, () => null); // null wrapper → no DOM scroll
}

test('getFlatIndex accounts for preceding groups', () => {
  const { getFlatIndex } = nav();
  assertEquals(getFlatIndex('birds', 0), 0);
  assertEquals(getFlatIndex('birds', 1), 1);
  assertEquals(getFlatIndex('shells', 0), 2);
  assertEquals(getFlatIndex('missing', 0), -1);
});

test('moveFocus wraps around the flat list', () => {
  const { focusedIndex, moveFocus } = nav();
  assertEquals(focusedIndex.value, -1);
  moveFocus(1);
  assertEquals(focusedIndex.value, 0);
  moveFocus(-1); // wrap backwards from 0 → last (index 2)
  assertEquals(focusedIndex.value, 2);
  moveFocus(1); // wrap forwards from 2 → 0
  assertEquals(focusedIndex.value, 0);
});

test('getFocusedResult returns the item at the focused flat index; resetFocus clears', () => {
  const { moveFocus, getFocusedResult, resetFocus } = nav();
  moveFocus(1); // index 0
  moveFocus(1); // index 1
  assertEquals(getFocusedResult()?.item.itemId, 'b1');
  resetFocus();
  assertEquals(getFocusedResult(), null);
});

test('moveFocus does nothing when there are no results', () => {
  const { focusedIndex, moveFocus, getFocusedResult } = useResultKeys(() => [], () => null);
  moveFocus(1);
  moveFocus(-1);
  assertEquals(focusedIndex.value, -1);
  assertEquals(getFocusedResult(), null);
});

test('moveFocus scrolls the newly focused row into view', () => {
  const scrolled: string[] = [];
  const wrapper = {
    querySelector: (selector: string) => ({
      scrollIntoView: () => scrolled.push(selector),
    }),
  } as unknown as HTMLElement;
  const { moveFocus } = useResultKeys(() => groups, () => wrapper);
  moveFocus(1);
  moveFocus(1);
  assertEquals(scrolled, ['[data-result-idx="0"]', '[data-result-idx="1"]']);
});
