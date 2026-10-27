import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { drawings, drawnOf, matches, matchesDrawn, plural, ratio } from './countWords.ts';

test('plural: singular only for exactly one', () => {
  assertEquals(plural(0, 'result'), '0 results');
  assertEquals(plural(1, 'result'), '1 result');
  assertEquals(plural(2, 'result'), '2 results');
});

test('drawings, ratio and drawnOf share one wording', () => {
  assertEquals(drawings(1), '1 drawing');
  assertEquals(drawings(18), '18 drawings');
  assertEquals(ratio(3, 12), '3 of 12');
  assertEquals(drawnOf(15, 204), '15 of 204 drawn');
});

test('matches: "match" for one, "matches" otherwise; the dropdown adds how many are drawn', () => {
  assertEquals([matches(0), matches(1), matches(10)], ['0 matches', '1 match', '10 matches']);
  assertEquals(matchesDrawn(10, 1), '10 matches, 1 drawn');
});
