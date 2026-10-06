/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { LOGO_MARK, LOGO_TILE, LOGO_TILE_INK, WORDMARK } from './logo.ts';

/** The path data of every shape in a piece of SVG markup. */
const shapes = (svg: string) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);

Deno.test('the tile is the same drawing as the mark, so the two cannot drift apart', () => {
  assertEquals(shapes(LOGO_TILE), shapes(LOGO_MARK));
});

Deno.test('the mark is a round 2px stroke in the current text colour, with no fill', () => {
  assertStringIncludes(LOGO_MARK, 'stroke="currentColor"');
  assertStringIncludes(LOGO_MARK, 'stroke-width="2"');
  assertStringIncludes(LOGO_MARK, 'stroke-linecap="round"');
  assert(!/fill="(?!none)/.test(LOGO_MARK), 'the mark must not be filled');
});

Deno.test('the frame is open: its path is never closed', () => {
  const frame = shapes(LOGO_MARK)[0];
  assert(!/z\s*$/i.test(frame), 'the frame must stay unfinished');
});

Deno.test('the tile is a solid square in the current colour with the drawing reversed out', () => {
  assertStringIncludes(LOGO_TILE, 'fill="currentColor"');
  assertStringIncludes(LOGO_TILE, `stroke="${LOGO_TILE_INK}"`);
});

Deno.test('the wordmark is two words', () => {
  assertEquals([...WORDMARK], ['Wildlife', 'Illustrated']);
});
