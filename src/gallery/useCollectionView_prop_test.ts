import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../testing/propertyRuns.ts';
import { ref } from 'vue';
import { useCollectionView } from './useCollectionView.ts';
import { monthName } from '../domain/dates.ts';
import { at, makeItem } from '../testing/fixtures.ts';
import type { View } from '../domain/viewName.ts';

const DAY = 86_400_000;
const anyWord = fc.constantFrom(
  'heron',
  'egret',
  'plover',
  'tern',
  'noddy',
  'kite',
  'Reef',
  'REEF',
);

const anyItemSpec = fc.record({
  name: fc.tuple(anyWord, anyWord).map(([a, b]) => `${a} ${b}`),
  group: fc.constantFrom('A', 'B', 'C'),
  drawn: fc.boolean(),
  dayOffset: fc.integer({ min: 0, max: 900 }), // days after 2024-01-01
});
const anyItems = fc.array(anyItemSpec, { maxLength: 40 });
const anyQuery = fc.oneof(
  fc.constant(''),
  anyWord,
  fc.constant('  REEF '),
  fc.constant('zzz-no-match'),
);

function items(specs: Array<{ name: string; group: string; drawn: boolean; dayOffset: number }>) {
  return specs.map((s) =>
    makeItem({
      commonName: s.name,
      group: s.group,
      ...(s.drawn ? { drawnTime: at(2024, 1, 1) + s.dayOffset * DAY } : { isDrawn: false }),
    })
  );
}

const run = (specs: Parameters<typeof items>[0], q: string, mode: View) => {
  const list = items(specs);
  return { list, data: useCollectionView(ref(list), ref(q), ref(mode)) };
};
const norm = (q: string) => q.trim().toLowerCase();

test('for any items and query, the family view keeps exactly the matches, each once', () => {
  assertProperty(
    fc.property(anyItems, anyQuery, (specs, q) => {
      const { list, data } = run(specs, q, 'group');
      const expected = list.filter((i) => i.searchText.includes(norm(q))).map((i) => i.id).sort();
      const actual = Object.values(data.activeData.value.grouped).flat().map((i) => i.id).sort();
      assertEquals(actual, expected);
      assertEquals(data.stats.value.filtered, expected.length);
    }),
    { numRuns: 300 },
  );
});

test('for any items, drawn ones come first in a group and ids ascend', () => {
  assertProperty(
    fc.property(anyItems, (specs) => {
      const { data } = run(specs, '', 'group');
      for (const group of Object.values(data.activeData.value.grouped)) {
        for (let i = 1; i < group.length; i++) {
          const [a, b] = [group[i - 1], group[i]];
          if (a!.isDrawn !== b!.isDrawn) assert(a!.isDrawn, 'an undrawn item precedes a drawn one');
          else assert(a!.sortKey <= b!.sortKey, 'ids out of order');
        }
      }
    }),
    { numRuns: 300 },
  );
});

test('for any items, the counts in the sidebar add up to the drawn items in every view', () => {
  assertProperty(
    fc.property(anyItems, anyQuery, fc.constantFrom<View>('group', 'month'), (specs, q, mode) => {
      const { list, data } = run(specs, q, mode);
      const matching = list.filter((i) => i.searchText.includes(norm(q)));
      const drawn = matching.filter((i) => i.isDrawn).length;
      const sidebarTotal = data.activeData.value.sidebarItems.reduce((n, s) => n + s.count, 0);
      assertEquals(sidebarTotal, drawn);
    }),
    { numRuns: 300 },
  );
});

test('for any items, the month view puts each drawing in its UTC month, newest first', () => {
  assertProperty(
    fc.property(anyItems, anyQuery, (specs, q) => {
      const { list, data } = run(specs, q, 'month');
      const grouped = data.activeData.value.grouped;

      for (const [month, bucket] of Object.entries(grouped)) {
        for (const item of bucket) assertEquals(monthName(new Date(item.drawnTime)), month);
      }
      const expected = list.filter((i) => i.isDrawn && i.searchText.includes(norm(q))).length;
      assertEquals(Object.values(grouped).flat().length, expected);

      // buckets appear newest-first, and within a bucket the newest drawing leads
      const newest = Object.values(grouped).map((b) => Math.max(...b.map((i) => i.drawnTime)));
      assertEquals(newest, [...newest].sort((a, b) => b - a));
      for (const bucket of Object.values(grouped)) {
        const times = bucket.map((i) => i.drawnTime);
        assertEquals(times, [...times].sort((a, b) => b - a));
      }
    }),
    { numRuns: 300 },
  );
});

test('for any items, a month is disabled in the sidebar exactly when it is empty', () => {
  assertProperty(
    fc.property(anyItems, anyQuery, (specs, q) => {
      const { data } = run(specs, q, 'month');
      const { grouped, sidebarItems } = data.activeData.value;
      for (const s of sidebarItems) {
        assertEquals(s.disabled, !grouped[s.id]?.length);
        assertEquals(s.count, grouped[s.id]?.length ?? 0);
      }
    }),
    { numRuns: 300 },
  );
});

test('for any items, the order in the viewer is drawn only and never goes back in time', () => {
  assertProperty(
    fc.property(anyItems, anyQuery, (specs, q) => {
      const { data } = run(specs, q, 'group');
      const seq = data.searchedDrawnItems.value;
      assert(seq.every((i) => i.isDrawn));
      for (let i = 1; i < seq.length; i++) assert(seq[i - 1]!.drawnTime <= seq[i]!.drawnTime);
    }),
    { numRuns: 300 },
  );
});
