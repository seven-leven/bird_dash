import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { iconGridLayout } from './icon_grid.ts';
import { ICON_GROUPS } from '../../src/lib/icons.ts';

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
