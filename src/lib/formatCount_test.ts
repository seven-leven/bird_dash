/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { drawings, drawnOf, plural, ratio } from './formatCount.ts';

Deno.test('plural: singular only for exactly one', () => {
  assertEquals(plural(0, 'result'), '0 results');
  assertEquals(plural(1, 'result'), '1 result');
  assertEquals(plural(2, 'result'), '2 results');
});

Deno.test('drawings, ratio and drawnOf share one wording', () => {
  assertEquals(drawings(1), '1 drawing');
  assertEquals(drawings(18), '18 drawings');
  assertEquals(ratio(3, 12), '3 of 12');
  assertEquals(drawnOf(15, 204), '15 of 204 drawn');
});
