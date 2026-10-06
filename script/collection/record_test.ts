/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { forEachDrawn, loadDrawnIds, markDrawn } from './record.ts';
import type { Collection } from './registry.ts';
import type { RawCollectionData } from '../../src/types/data.ts';

const data: RawCollectionData = {
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

/** A collection whose list file lives in a temporary directory. */
async function withList(
  data: RawCollectionData,
  fn: (col: Collection, read: () => Promise<RawCollectionData>) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'bird_dash_record_' });
  const json = `${dir}/list.json`;
  const col: Collection = {
    id: 'x',
    label: 'X',
    emoji: '',
    paths: { json, raw: '', full: '', thumb: '', placeholder: '', placeholderDark: '' },
  };
  try {
    await Deno.writeTextFile(json, JSON.stringify(data));
    await fn(col, async () => JSON.parse(await Deno.readTextFile(json)));
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test('markDrawn dates an undrawn item, saves the file and returns its name', () =>
  withList(data, async (col, read) => {
    assertEquals(await markDrawn(col, '002', '2025-06-01'), 'Garganey');
    const saved = await read();
    assertEquals(saved.Ducks[1].drawn, '2025-06-01');
    assertEquals(saved.Ducks[0].drawn, '2025-01-01', 'other items are untouched');
    assertEquals([...await loadDrawnIds(col)].sort(), ['001', '002', '003']);
  }));

Deno.test('markDrawn keeps the original date of an item that is already drawn', () =>
  withList(data, async (col, read) => {
    assertEquals(await markDrawn(col, '001', '2030-01-01'), 'Mallard');
    assertEquals((await read()).Ducks[0].drawn, '2025-01-01');
  }));

Deno.test('markDrawn returns null for an id that is not in the list', () =>
  withList(data, async (col, read) => {
    assertEquals(await markDrawn(col, '999', '2025-06-01'), null);
    assertEquals(await read(), data);
  }));
