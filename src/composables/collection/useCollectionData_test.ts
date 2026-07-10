/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { useCollectionData } from './useCollectionData.ts';
import { at, makeItem } from '../../../test/fixtures.ts';
import type { CollectionItem, ViewMode } from '../../types/index.ts';

function setup(items: CollectionItem[], query = '', mode: ViewMode = 'group') {
  return useCollectionData(ref(items), ref(query), ref(mode));
}

Deno.test('group mode: buckets by group, drawn-first then sortKey', () => {
  const items = [
    makeItem({ itemId: '003', group: 'A', sortKey: 3, isDrawn: false }),
    makeItem({ itemId: '001', group: 'A', sortKey: 1, drawnTime: at(2025, 1) }),
    makeItem({ itemId: '002', group: 'A', sortKey: 2, isDrawn: false }),
    makeItem({ itemId: '004', group: 'B', sortKey: 4, drawnTime: at(2025, 2) }),
  ];
  const { activeData } = setup(items);
  const groups = activeData.value.grouped;

  assertEquals(Object.keys(groups).sort(), ['A', 'B']);
  // Drawn (001) sorts ahead of undrawn, then undrawn by sortKey (002, 003).
  assertEquals(groups['A'].map((i) => i.itemId), ['001', '002', '003']);

  const sidebarA = activeData.value.sidebarItems.find((s) => s.id === 'A')!;
  assertEquals({ count: sidebarA.count, total: sidebarA.total }, { count: 1, total: 3 });
});

Deno.test('filtering: searchText substring narrows all outputs', () => {
  const items = [
    makeItem({ commonName: 'Mallard', group: 'Ducks' }),
    makeItem({ commonName: 'Garganey', group: 'Ducks' }),
  ];
  const { activeData, stats } = setup(items, 'mallard');
  assertEquals(activeData.value.grouped['Ducks'].map((i) => i.commonName), ['Mallard']);
  assertEquals(stats.value.filtered, 1);
});

Deno.test('group stats: total = all items, drawn = drawn count', () => {
  const items = [
    makeItem({ drawnTime: at(2025, 1) }),
    makeItem({ isDrawn: false }),
    makeItem({ isDrawn: false }),
  ];
  const { stats } = setup(items);
  assertEquals(stats.value, { total: 3, filtered: 3, drawn: 1 });
});

Deno.test('date mode: buckets drawn items by month, chronological', () => {
  const items = [
    makeItem({ itemId: '001', drawnTime: at(2025, 3, 10) }),
    makeItem({ itemId: '002', drawnTime: at(2025, 1, 5) }),
    makeItem({ itemId: '003', drawnTime: at(2025, 1, 20) }),
    makeItem({ itemId: '004', isDrawn: false }), // excluded from date view
  ];
  const { activeData, stats } = setup(items, '', 'date');
  const keys = Object.keys(activeData.value.grouped);

  assertEquals(keys, ['January 2025', 'March 2025']);
  assertEquals(activeData.value.grouped['January 2025'].map((i) => i.itemId), ['002', '003']);
  // date mode: total counts drawn items only
  assertEquals(stats.value.total, 3);
});

Deno.test('date mode: allMonths is continuous and marks empty months disabled', () => {
  const items = [
    makeItem({ drawnTime: at(2025, 1, 1) }),
    makeItem({ drawnTime: at(2025, 3, 1) }),
  ];
  const { activeData } = setup(items, '', 'date');
  const labels = activeData.value.sidebarItems.map((s) => s.id);
  // continuous run includes the empty February
  assertEquals(labels.slice(0, 3), ['January 2025', 'February 2025', 'March 2025']);
  const feb = activeData.value.sidebarItems.find((s) => s.id === 'February 2025')!;
  assertEquals(feb.disabled, true);
  assertEquals(feb.count, 0);
});

Deno.test('searchedDrawnItems: drawn only, ordered by drawnTime then sortKey', () => {
  const items = [
    makeItem({ itemId: '010', drawnTime: at(2025, 5, 1), sortKey: 10 }),
    makeItem({ itemId: '002', drawnTime: at(2025, 2, 1), sortKey: 2 }),
    makeItem({ itemId: '009', isDrawn: false, sortKey: 9 }),
  ];
  const { searchedDrawnItems } = setup(items);
  assertEquals(searchedDrawnItems.value.map((i) => i.itemId), ['002', '010']);
});
