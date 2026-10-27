import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { tileImage } from './tileImage.ts';
import { makeItem } from '../testing/fixtures.ts';

test('a drawing is the same in both themes; a placeholder follows the theme', () => {
  const drawn = makeItem({ drawnTime: 1, imageUrl: '/thumb/x/001.webp' });
  assertEquals(tileImage(drawn, false), '/thumb/x/001.webp');
  assertEquals(tileImage(drawn, true), '/thumb/x/001.webp');

  const undrawn = makeItem({ isDrawn: false });
  assertEquals(tileImage(undrawn, false), undrawn.placeholderUrl);
  assertEquals(tileImage(undrawn, true), undrawn.placeholderDarkUrl);
});

test('a drawing that failed to load falls back to the themed placeholder', () => {
  const drawn = makeItem({ drawnTime: 1 });
  assertEquals(tileImage(drawn, false, true), drawn.placeholderUrl);
  assertEquals(tileImage(drawn, true, true), drawn.placeholderDarkUrl);
});
