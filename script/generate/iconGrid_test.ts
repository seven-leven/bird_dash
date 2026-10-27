import { test } from 'vitest';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { iconGridLayout } from './iconGrid.ts';
import { ICON_GROUPS } from '../../src/ui/icons.ts';

const g = (label: string, n: number) => ({
  label,
  icons: Array.from({ length: n }, (_, i) => `${label}${i}`),
});

test('groups sit side by side with one empty cell between them', () => {
  const [a, b] = iconGridLayout([g('a', 3), g('b', 2)], 10);
  assertEquals([a.row, a.col], [0, 0]);
  assertEquals(a.icons.map((i) => i.col), [0, 1, 2]);
  assertEquals([b.row, b.col], [0, 4]); // column 3 is the gap
  assertEquals(b.icons.map((i) => i.col), [4, 5]);
});

test('a group that does not fit starts the next row at the first column', () => {
  const [, b, c] = iconGridLayout([g('a', 3), g('b', 7), g('c', 2)], 10);
  assertEquals([b.row, b.col], [1, 0]); // 3 + gap + 7 would need 11 cells
  assertEquals([c.row, c.col], [1, 8]);
});

test('a group that exactly fills the rest of the row stays on it', () => {
  const [, b] = iconGridLayout([g('a', 2), g('b', 7)], 10);
  assertEquals([b.row, b.col], [0, 3]);
});

test('the real icon set stays inside the grid at both sizes the docs use', () => {
  for (const cols of [15, 7]) {
    const placed = iconGridLayout(ICON_GROUPS, cols);
    assertEquals(placed.length, ICON_GROUPS.length);
    for (const group of placed) {
      for (const icon of group.icons) {
        assert(icon.col < cols, `${icon.name} is in column ${icon.col} of a ${cols}-column grid`);
      }
    }
  }
});

test('with tracks, every track starts in the same column in every row', () => {
  const groups = [
    { label: 'A', icons: ['a1', 'a2', 'a3'] },
    { label: 'B', icons: ['b1', 'b2'] },
    { label: 'C', icons: ['c1', 'c2'] },
    { label: 'D', icons: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'] },
    { label: 'E', icons: ['e1'] },
  ];
  const placed = iconGridLayout(groups, 13, 2).map((g) => [g.label, g.row, g.col]);
  // Tracks of six, one empty column apart: the second starts at column 7 every time.
  assertEquals(placed, [['A', 0, 0], ['B', 0, 4], ['C', 0, 7], ['D', 1, 0], ['E', 1, 7]]);
});

test('columns that do not split into equal tracks are refused', () => {
  assertThrows(
    () => iconGridLayout([], 12, 2),
    Error,
    '12 columns do not split into 2 equal tracks',
  );
});
