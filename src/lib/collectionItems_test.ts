/// <reference lib="deno.ns" />
import { assert, assertEquals, assertThrows } from '@std/assert';
import { resolveUrl, tileImage, toCollectionConfig, toCollectionItems } from './collectionItems.ts';
import { makeItem } from '../../script/test/helpers/fixtures.ts';

const col = { id: 'birds', imageBase: '/thumb/birds/' };

Deno.test('toCollectionItems: a drawn item gets its thumbnail, date and flags', () => {
  const [item] = toCollectionItems(col, {
    Ducks: [{ id: '007', name: 'Garganey', sci: 'Spatula querquedula', drawn: '2025-03-01' }],
  }, '/');
  assertEquals(item.id, 'birds-item-1');
  assertEquals(item.itemId, '007');
  assertEquals(item.group, 'Ducks');
  assertEquals(item.isDrawn, true);
  assertEquals(item.imageUrl, '/thumb/birds/007.webp');
  assertEquals(item.sortKey, 7);
  assertEquals(item.drawnTime, Date.UTC(2025, 2, 1));
});

Deno.test('toCollectionItems: no date, or an empty one, shows the placeholder', () => {
  const items = toCollectionItems(col, {
    Ducks: [{ id: '001', name: 'A' }, { id: '002', name: 'B', drawn: '' }],
  }, '/base/');
  for (const item of items) {
    assertEquals(item.isDrawn, false);
    assertEquals(item.drawnTime, 0);
    assertEquals(item.imageUrl, '/base/placeholders/birds.webp');
    assertEquals(item.imageUrl, item.placeholderUrl);
    assertEquals(item.placeholderDarkUrl, '/base/placeholders/birds-dark.webp');
  }
});

Deno.test('toCollectionItems: an unparseable date still counts as drawn, with time 0', () => {
  const [item] = toCollectionItems(col, { G: [{ id: '1', name: 'A', drawn: 'soon' }] }, '/');
  assertEquals(item.isDrawn, true);
  assertEquals(item.drawnTime, 0);
});

Deno.test('toCollectionItems: extra string fields become meta and are searchable', () => {
  const [item] = toCollectionItems(col, {
    Herons: [{ id: '010', name: 'Grey Heron', dhiv: 'Maakanaa', dhiv_script: 'މާކަނާ', rank: 3 }],
  }, '/');
  assertEquals(item.meta, { dhiv: 'Maakanaa', dhiv_script: 'މާކަނާ' }); // non-strings dropped
  for (const term of ['grey heron', 'herons', '010', 'maakanaa', 'މާކަނާ']) {
    assert(item.searchText.includes(term), `searchText is missing "${term}"`);
  }
  assertEquals(item.searchText, item.searchText.toLowerCase());
});

Deno.test('toCollectionItems: no extra fields means no meta object', () => {
  const [item] = toCollectionItems(col, { G: [{ id: '1', name: 'A' }] }, '/');
  assertEquals(item.meta, undefined);
});

Deno.test('toCollectionItems: ids are unique across groups and items are frozen', () => {
  const items = toCollectionItems(col, {
    A: [{ id: '1', name: 'a' }, { id: '2', name: 'b' }],
    B: [{ id: '3', name: 'c' }],
  }, '/');
  assertEquals(items.map((i) => i.id), ['birds-item-1', 'birds-item-2', 'birds-item-3']);
  assertThrows(() => {
    (items[0] as { commonName: string }).commonName = 'changed';
  }, TypeError);
});

Deno.test('toCollectionConfig: derives the data and image URLs from the id and base', () => {
  const config = toCollectionConfig({
    id: 'sharks',
    label: 'Sharks',
    emoji: '🦈',
    groupLabel: 'Order',
    itemLabel: 'shark',
    links: [{ label: 'Wiki', color: 'bg-x', url: 'https://example.org/?q={{sci}}' }],
  }, './');
  assertEquals(config.dataUrl, './lists/sharks.json');
  assertEquals(config.imageBase, './thumb/sharks/');
  assertEquals(config.fullImageBase, './full/sharks/');
  const item = makeItem({ scientificName: 'Carcharhinus melanopterus' });
  assertEquals(config.links[0].url(item), 'https://example.org/?q=Carcharhinus%20melanopterus');
});

Deno.test('resolveUrl: fills every placeholder and encodes the values', () => {
  const item = makeItem({ commonName: 'Black & White Tern', scientificName: 'A b' });
  assertEquals(
    resolveUrl('https://x.test/{{common}}/{{sci}}?again={{common}}', item),
    'https://x.test/Black%20%26%20White%20Tern/A%20b?again=Black%20%26%20White%20Tern',
  );
});

Deno.test('tileImage: a drawing is the same in both themes; a placeholder follows the theme', () => {
  const drawn = makeItem({ drawnTime: 1, imageUrl: '/thumb/x/001.webp' });
  assertEquals(tileImage(drawn, false), '/thumb/x/001.webp');
  assertEquals(tileImage(drawn, true), '/thumb/x/001.webp');

  const undrawn = makeItem({ isDrawn: false });
  assertEquals(tileImage(undrawn, false), undrawn.placeholderUrl);
  assertEquals(tileImage(undrawn, true), undrawn.placeholderDarkUrl);
});

Deno.test('tileImage: a drawing that failed to load falls back to the themed placeholder', () => {
  const drawn = makeItem({ drawnTime: 1 });
  assertEquals(tileImage(drawn, false, true), drawn.placeholderUrl);
  assertEquals(tileImage(drawn, true, true), drawn.placeholderDarkUrl);
});
