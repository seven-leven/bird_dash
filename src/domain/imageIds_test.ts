import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { imageIds } from './imageIds.ts';

test('an item has its drawing, then the other images the list counts, numbered from 2', () => {
  assertEquals(imageIds('001'), ['001']);
  assertEquals(imageIds('001', 1), ['001']);
  assertEquals(imageIds('029', 3), ['029', '029-2', '029-3']);
  assertEquals(imageIds('001', 0), ['001']); // never fewer than the drawing
});
