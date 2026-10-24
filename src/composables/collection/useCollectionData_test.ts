import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { monthKey, monthRows, useCollectionData } from './useCollectionData.ts';
import { at, makeItem } from '../../testing/fixtures.ts';
import type { CollectionItem, ViewMode } from '../../types/index.ts';

function setup(items: CollectionItem[], query = '', mode: ViewMode = 'group') {
  return useCollectionData(ref(items), ref(query), ref(mode));
}

test('group mode: buckets by group, drawn-first then sortKey', () => {
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

test('filtering: searchText substring narrows all outputs', () => {
  const items = [
    makeItem({ commonName: 'Mallard', group: 'Ducks' }),
    makeItem({ commonName: 'Garganey', group: 'Ducks' }),
  ];
  const { activeData, stats } = setup(items, 'mallard');
  assertEquals(activeData.value.grouped['Ducks'].map((i) => i.commonName), ['Mallard']);
  assertEquals(stats.value.filtered, 1);
});

test('filtering ignores surrounding whitespace and letter case in the query', () => {
  const items = [makeItem({ commonName: 'Mallard', group: 'Ducks' })];
  const { activeData } = setup(items, '  MALLARD  ');
  assertEquals(activeData.value.grouped['Ducks'].length, 1);
});

test('group stats: total = all items, drawn = drawn count', () => {
  const items = [
    makeItem({ drawnTime: at(2025, 1) }),
    makeItem({ isDrawn: false }),
    makeItem({ isDrawn: false }),
  ];
  const { stats } = setup(items);
  assertEquals(stats.value, { total: 3, filtered: 3, filteredDrawn: 1, drawn: 1 });
});

test('date mode: buckets drawn items by month, newest month and newest drawing first', () => {
  const items = [
    makeItem({ itemId: '001', drawnTime: at(2025, 3, 10) }),
    makeItem({ itemId: '002', drawnTime: at(2025, 1, 5) }),
    makeItem({ itemId: '003', drawnTime: at(2025, 1, 20) }),
    makeItem({ itemId: '004', isDrawn: false }), // excluded from date view
  ];
  const { activeData, stats } = setup(items, '', 'date');
  const keys = Object.keys(activeData.value.grouped);

  assertEquals(keys, ['March 2025', 'January 2025']);
  assertEquals(activeData.value.grouped['January 2025'].map((i) => i.itemId), ['003', '002']);
  // date mode: total counts drawn items only
  assertEquals(stats.value.total, 3);
});

test('date mode: the months are continuous and an empty one is shown, disabled', () => {
  const items = [
    makeItem({ drawnTime: at(2025, 1, 1) }),
    makeItem({ drawnTime: at(2025, 3, 1) }),
  ];
  const { activeData } = setup(items, '', 'date');
  const labels = activeData.value.sidebarItems.map((s) => s.id);
  // the timeline ends (oldest) with March, the empty February, then January
  assertEquals(labels.slice(-3), ['March 2025', 'February 2025', 'January 2025']);
  const feb = activeData.value.sidebarItems.find((s) => s.id === 'February 2025')!;
  assertEquals(feb.disabled, true);
  assertEquals(feb.count, 0);
});

test('monthKey buckets by UTC month, so a date on the 1st never slips back a month', () => {
  // `YYYY-MM-DD` parses as UTC midnight; a local-time month would report
  // September for this instant anywhere west of UTC.
  assertEquals(monthKey(new Date('2025-10-01')), 'October 2025');
  assertEquals(monthKey(new Date('2025-01-01')), 'January 2025');
  assertEquals(monthKey(new Date('2025-12-31')), 'December 2025');
});

test('date mode: a drawing dated the 1st lands in its own month, the oldest end of the timeline', () => {
  const items = [makeItem({ drawnTime: at(2025, 10, 1) })];
  const { activeData } = setup(items, '', 'date');
  assertEquals(Object.keys(activeData.value.grouped), ['October 2025']);
  assertEquals(activeData.value.sidebarItems.at(-1)?.id, 'October 2025');
});

test('searchedDrawnItems: drawn only, ordered by drawnTime then sortKey', () => {
  const items = [
    makeItem({ itemId: '010', drawnTime: at(2025, 5, 1), sortKey: 10 }),
    makeItem({ itemId: '002', drawnTime: at(2025, 2, 1), sortKey: 2 }),
    makeItem({ itemId: '009', isDrawn: false, sortKey: 9 }),
  ];
  const { searchedDrawnItems } = setup(items);
  assertEquals(searchedDrawnItems.value.map((i) => i.itemId), ['002', '010']);
});

test('date mode leaves out a drawn item whose date could not be read', () => {
  const items = [
    makeItem({ itemId: '001', drawnTime: at(2025, 1, 5) }),
    makeItem({ itemId: '002', isDrawn: true, drawnTime: 0 }), // "drawn" with an unreadable date
  ];
  const { activeData } = setup(items, '', 'date');
  const all = Object.values(activeData.value.grouped).flat().map((i) => i.itemId);
  assertEquals(all, ['001']);
});

test('a query narrows the drawn items the viewer pages through; no query keeps them all', () => {
  const items = [
    makeItem({ itemId: '001', commonName: 'Mallard', drawnTime: at(2025, 1, 5) }),
    makeItem({ itemId: '002', commonName: 'Heron', drawnTime: at(2025, 1, 6) }),
  ];
  assertEquals(setup(items, 'heron').searchedDrawnItems.value.map((i) => i.itemId), ['002']);
  assertEquals(setup(items, '').searchedDrawnItems.value.map((i) => i.itemId), ['001', '002']);
});

test('drawings from the same day are paged through in id order', () => {
  const sameDay = at(2025, 4, 2);
  const items = [
    makeItem({ itemId: '009', sortKey: 9, drawnTime: sameDay }),
    makeItem({ itemId: '003', sortKey: 3, drawnTime: sameDay }),
    makeItem({ itemId: '001', sortKey: 1, drawnTime: at(2025, 4, 1) }),
  ];
  assertEquals(setup(items).searchedDrawnItems.value.map((i) => i.itemId), ['001', '003', '009']);
});

test('monthRows folds three or more empty months into one disabled row, but not one or two', () => {
  const months = [
    'May 2025',
    'April 2025',
    'March 2025',
    'February 2025',
    'January 2025',
    'December 2024',
  ];
  const rows = monthRows(months, { 'May 2025': 2, 'January 2025': 1 });
  assertEquals(rows.map((r) => [r.label, r.count, r.disabled]), [
    ['May 2025', 2, false],
    ['February 2025 – April 2025', 0, true],
    ['January 2025', 1, false],
    ['December 2024', 0, true],
  ]);
  assertEquals(rows.length, 4);
  // two empty months in a row stay as they are
  assertEquals(
    monthRows(['March 2025', 'February 2025', 'January 2025'], { 'March 2025': 1 }).map((r) =>
      r.id
    ),
    ['March 2025', 'February 2025', 'January 2025'],
  );
});

test('family view, drawn only: undrawn items and empty groups are hidden, counts stay whole', () => {
  const items = [
    makeItem({ itemId: '001', group: 'A', drawnTime: at(2025, 1) }),
    makeItem({ itemId: '002', group: 'A', isDrawn: false }),
    makeItem({ itemId: '003', group: 'B', isDrawn: false }),
  ];
  const { activeData } = useCollectionData(ref(items), ref(''), ref('group'), ref(true));
  assertEquals(Object.keys(activeData.value.grouped), ['A']);
  assertEquals(activeData.value.grouped.A.map((i) => i.itemId), ['001']);
  const a = activeData.value.sidebarItems[0];
  assertEquals([a.id, a.count, a.total], ['A', 1, 2]); // "1 of 2": the hidden item still counts
});
