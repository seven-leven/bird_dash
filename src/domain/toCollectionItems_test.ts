import { test } from 'vitest';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { toCollection, toCollectionItems } from './toCollectionItems.ts';
import { makeItem } from '../testing/fixtures.ts';

const col = { id: 'birds', imageBase: '/thumb/birds/', smallImageBase: '/small/birds/' };

test('a drawn item gets its thumbnail, date and flags', () => {
  const [item] = toCollectionItems(col, {
    Ducks: [{ id: '007', name: 'Garganey', sci: 'Spatula querquedula', drawn: '2025-03-01' }],
  });
  assertEquals(item!.id, 'birds-item-1');
  assertEquals(item!.itemId, '007');
  assertEquals(item!.group, 'Ducks');
  assertEquals(item!.isDrawn, true);
  assertEquals(item!.imageUrl, '/thumb/birds/007.webp');
  assertEquals(item!.smallImageUrl, '/small/birds/007.webp');
  assertEquals(item!.sortKey, 7);
  assertEquals(item!.drawnTime, Date.UTC(2025, 2, 1));
});

test('an item with no date, or an empty one, is not drawn and has no image', () => {
  const items = toCollectionItems(col, {
    Ducks: [{ id: '001', name: 'A' }, { id: '002', name: 'B', drawn: '' }],
  });
  for (const item of items) {
    assertEquals(item.isDrawn, false);
    assertEquals(item.drawnTime, 0);
    assertEquals([item.imageUrl, item.smallImageUrl], ['', '']);
  }
});

test('an unparseable date still counts as drawn, with time 0', () => {
  const [item] = toCollectionItems(col, { G: [{ id: '1', name: 'A', drawn: 'soon' }] });
  assertEquals(item!.isDrawn, true);
  assertEquals(item!.drawnTime, 0);
});

test('the name fields become names, and other string fields become meta', () => {
  const [item] = toCollectionItems(col, {
    Herons: [{
      id: '010',
      name: 'Grey Heron',
      sci: 'Ardea cinerea',
      dhiv: 'Maakanaa',
      dhiv_script: 'މާކަނާ',
      habitat: 'Shore',
      rank: 3,
    }],
  });
  assertEquals(item!.names, [
    { text: 'މާކަނާ', lang: 'dv', role: 'title', roman: 'Maakanaa' },
    { text: 'Grey Heron', lang: 'en', role: 'common' },
    { text: 'Ardea cinerea', lang: 'la', role: 'latin' },
  ]);
  assertEquals(item!.meta, { habitat: 'Shore' }); // names have left it; non-strings dropped
});

test('every name, the group, the id and the meta are searchable', () => {
  const [item] = toCollectionItems(col, {
    Herons: [{
      id: '010',
      name: 'Grey Heron',
      dhiv: 'Maakanaa',
      dhiv_script: 'މާކަނާ',
      habitat: 'Shore',
    }],
  });
  for (const term of ['grey heron', 'herons', '010', 'maakanaa', 'މާކަނާ', 'shore']) {
    assert(item!.searchText.includes(term), `searchText is missing "${term}"`);
  }
  assertEquals(item!.searchText, item!.searchText.toLowerCase());
});

test('no extra fields means no meta object', () => {
  const [item] = toCollectionItems(col, { G: [{ id: '1', name: 'A' }] });
  assertEquals(item!.meta, undefined);
});

test('ids are unique across groups and items are frozen', () => {
  const items = toCollectionItems(col, {
    A: [{ id: '1', name: 'a' }, { id: '2', name: 'b' }],
    B: [{ id: '3', name: 'c' }],
  });
  assertEquals(items.map((i) => i.id), ['birds-item-1', 'birds-item-2', 'birds-item-3']);
  assertThrows(() => {
    (items[0] as { commonName: string }).commonName = 'changed';
  }, TypeError);
});

test('the data and image URLs of a collection come from its id and the base', () => {
  const config = toCollection({
    id: 'sharks',
    label: 'Sharks',
    emoji: '🦈',
    groupLabel: 'Order',
    itemLabel: 'shark',
    links: [{ label: 'Wiki', url: 'https://example.org/?q={{sci}}' }],
  }, './');
  assertEquals(config.dataUrl, './lists/sharks.json');
  assertEquals(config.imageBase, './thumb/sharks/');
  assertEquals(config.smallImageBase, './small/sharks/');
  assertEquals(config.fullImageBase, './full/sharks/');
  const item = makeItem({ scientificName: 'Carcharhinus melanopterus' });
  assertEquals(config.links[0]!.url(item), 'https://example.org/?q=Carcharhinus%20melanopterus');
});

test('a collection keeps its medium, and has none unless it names one', () => {
  const entry = { id: 'x', label: 'X', emoji: '', groupLabel: 'G', itemLabel: 'i', links: [] };
  assertEquals(toCollection(entry, './').medium, undefined);
  assertEquals(toCollection({ ...entry, medium: 'colour pencil' }, './').medium, 'colour pencil');
});

test('missing fields become empty, and a non-numeric id or a bad date counts as 0', () => {
  const [bare, odd] = toCollectionItems(col, {
    G: [{} as never, { id: 'x1', name: 'Odd', drawn: 'not a date' }],
  });
  assertEquals([bare!.itemId, bare!.commonName, bare!.scientificName], ['', '', '']);
  assertEquals([odd!.sortKey, odd!.isDrawn, odd!.drawnTime], [0, true, 0]);
});

test('an item lists its images, the drawing and as many more as `images` counts', () => {
  const [one, three] = toCollectionItems(col, {
    G: [{ id: '001', name: 'A', drawn: '2025-01-01' }, {
      id: '002',
      name: 'B',
      drawn: '2025-01-01',
      images: 3,
    }],
  });
  assertEquals(one!.imageIds, ['001']);
  assertEquals(three!.imageIds, ['002', '002-2', '002-3']);
  assertEquals(three!.meta, undefined); // `images` is not a fact to show
});
