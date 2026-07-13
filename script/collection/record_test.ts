/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { forEachDrawn } from './record.ts';
import type { CollectionData } from './record.ts';

const data: CollectionData = {
  Ducks: [
    { id: '001', name: 'Mallard', drawn: '2025-01-01' },
    { id: '002', name: 'Garganey' }, // undrawn
  ],
  Geese: [
    { id: '003', name: 'Greylag', drawn: '2025-02-01' },
  ],
};

Deno.test('forEachDrawn visits only drawn items, across all groups', () => {
  const seen: string[] = [];
  forEachDrawn(data, (item) => seen.push(item.id));
  assertEquals(seen, ['001', '003']);
});

Deno.test('forEachDrawn passes the full item to the callback', () => {
  const names: string[] = [];
  forEachDrawn(data, (item) => names.push(item.name));
  assertEquals(names, ['Mallard', 'Greylag']);
});
