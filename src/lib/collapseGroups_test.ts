/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { COLLAPSE_AT, COLLAPSED_SIZE, collapseGroups } from './collapseGroups.ts';
import { makeCollection, makeItem } from '../../script/test/helpers/fixtures.ts';
import type { GlobalSearchCollectionGroup } from '../types/index.ts';

function group(id: string, n: number): GlobalSearchCollectionGroup {
  const collection = makeCollection(id);
  const results = Array.from({ length: n }, (_, i) => ({
    collection,
    item: makeItem({ itemId: `${id}${i}` }),
    matchedFields: [],
  }));
  return { collection, results, count: n };
}

const none = new Set<string>();

Deno.test('a group below the limit is listed in full', () => {
  const [g] = collapseGroups([group('birds', COLLAPSE_AT - 1)], none);
  assertEquals(g.results.length, COLLAPSE_AT - 1);
  assertEquals(g.hidden, 0);
});

Deno.test('a group at the limit shows the first few and reports the rest as hidden', () => {
  const [g] = collapseGroups([group('birds', COLLAPSE_AT)], none);
  assertEquals(g.results.length, COLLAPSED_SIZE);
  assertEquals(g.results.map((r) => r.item.itemId).slice(0, 2), ['birds0', 'birds1']); // order kept
  assertEquals(g.hidden, COLLAPSE_AT - COLLAPSED_SIZE);
  assertEquals(g.count, COLLAPSE_AT, 'the header still shows the true total');
});

Deno.test('an expanded group is listed in full; other groups stay collapsed', () => {
  const [birds, sharks] = collapseGroups(
    [group('birds', 40), group('sharks', 12)],
    new Set(['birds']),
  );
  assertEquals([birds.results.length, birds.hidden], [40, 0]);
  assertEquals([sharks.results.length, sharks.hidden], [COLLAPSED_SIZE, 12 - COLLAPSED_SIZE]);
});

Deno.test('shown plus hidden always equals the total', () => {
  for (const n of [0, 1, 7, 9, 10, 11, 250]) {
    const [g] = collapseGroups([group('x', n)], none);
    assertEquals(g.results.length + g.hidden, n);
  }
});

Deno.test('the input is not modified', () => {
  const input = [group('birds', 30)];
  collapseGroups(input, none);
  assertEquals(input[0].results.length, 30);
});
