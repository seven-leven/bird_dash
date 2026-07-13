/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { buildHash, parseHash } from './useHashRoute.ts';

Deno.test('parseHash: collection only', () => {
  assertEquals(parseHash('#birds'), { collectionId: 'birds', itemId: '' });
});

Deno.test('parseHash: collection + item', () => {
  assertEquals(parseHash('#birds/001'), { collectionId: 'birds', itemId: '001' });
});

Deno.test('parseHash: tolerates a leading slash', () => {
  assertEquals(parseHash('#/birds/001'), { collectionId: 'birds', itemId: '001' });
});

Deno.test('parseHash: empty hash', () => {
  assertEquals(parseHash(''), { collectionId: '', itemId: '' });
});

Deno.test('buildHash: collection only when no item', () => {
  assertEquals(buildHash('birds', ''), 'birds');
});

Deno.test('buildHash: collection/item when item present', () => {
  assertEquals(buildHash('birds', '001'), 'birds/001');
});

Deno.test('parse ∘ build round-trips', () => {
  for (const [c, i] of [['birds', ''], ['sharks', '019']] as const) {
    assertEquals(parseHash(`#${buildHash(c, i)}`), { collectionId: c, itemId: i });
  }
});
