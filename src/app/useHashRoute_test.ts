import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { buildHash, parseHash } from './useHashRoute.ts';

test('an address with a collection only reads as that collection', () => {
  assertEquals(parseHash('#birds'), { collectionId: 'birds', itemId: '' });
});

test('an address with a collection and an item reads as both', () => {
  assertEquals(parseHash('#birds/001'), { collectionId: 'birds', itemId: '001' });
});

test('a leading slash in the address is ignored', () => {
  assertEquals(parseHash('#/birds/001'), { collectionId: 'birds', itemId: '001' });
});

test('an empty address reads as no collection and no item', () => {
  assertEquals(parseHash(''), { collectionId: '', itemId: '' });
});

test('with no item open, the address is the collection alone', () => {
  assertEquals(buildHash('birds', ''), 'birds');
});

test('with an item open, the address is the collection, a slash and the item', () => {
  assertEquals(buildHash('birds', '001'), 'birds/001');
});

test('parse ∘ build round-trips', () => {
  for (const [c, i] of [['birds', ''], ['sharks', '019']] as const) {
    assertEquals(parseHash(`#${buildHash(c, i)}`), { collectionId: c, itemId: i });
  }
});
