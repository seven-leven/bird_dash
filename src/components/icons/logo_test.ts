/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { LOGO_MARK, LOGO_TILE, LOGO_TILE_INK, WORDMARK } from './logo.ts';
import { ICONS } from './icons.ts';

Deno.test('both versions of the logo use the bird icon, so they cannot drift apart', () => {
  assertStringIncludes(LOGO_MARK, ICONS.bird.body);
  assertStringIncludes(LOGO_TILE, ICONS.bird.body);
});

Deno.test('the mark is a stroke in the current text colour, with no fill of its own', () => {
  assertStringIncludes(LOGO_MARK, 'stroke="currentColor"');
  assert(!/fill="(?!none)/.test(LOGO_MARK), 'the mark must not be filled');
});

Deno.test('the tile is a solid square in the current colour with the bird reversed out', () => {
  assertStringIncludes(LOGO_TILE, 'fill="currentColor"');
  assertStringIncludes(LOGO_TILE, `stroke="${LOGO_TILE_INK}"`);
});

Deno.test('the wordmark is two words', () => {
  assertEquals([...WORDMARK], ['Wildlife', 'Illustrated']);
});
