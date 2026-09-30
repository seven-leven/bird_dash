/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../../../test/prop.ts';
import { ref } from 'vue';
import { monthKey, useCollectionData } from './useCollectionData.ts';
import { at, makeItem } from '../../../test/fixtures.ts';
import type { ViewMode } from '../../types/index.ts';

const DAY = 86_400_000;
const words = fc.constantFrom('heron', 'egret', 'plover', 'tern', 'noddy', 'kite', 'Reef', 'REEF');

const itemSpec = fc.record({
  name: fc.tuple(words, words).map(([a, b]) => `${a} ${b}`),
  group: fc.constantFrom('A', 'B', 'C'),
  drawn: fc.boolean(),
  dayOffset: fc.integer({ min: 0, max: 900 }), // days after 2024-01-01
});
const collection = fc.array(itemSpec, { maxLength: 40 });
const query = fc.oneof(fc.constant(''), words, fc.constant('  REEF '), fc.constant('zzz-no-match'));

function items(specs: Array<{ name: string; group: string; drawn: boolean; dayOffset: number }>) {
  return specs.map((s) =>
    makeItem({
      commonName: s.name,
      group: s.group,
      ...(s.drawn ? { drawnTime: at(2024, 1, 1) + s.dayOffset * DAY } : { isDrawn: false }),
    })
  );
}

const run = (specs: Parameters<typeof items>[0], q: string, mode: ViewMode) => {
  const list = items(specs);
  return { list, data: useCollectionData(ref(list), ref(q), ref(mode)) };
};
const norm = (q: string) => q.trim().toLowerCase();

Deno.test('property: group mode keeps exactly the items that match, each once', () => {
  assertProperty(
    fc.property(collection, query, (specs, q) => {
      const { list, data } = run(specs, q, 'group');
      const expected = list.filter((i) => i.searchText.includes(norm(q))).map((i) => i.id).sort();
      const actual = Object.values(data.activeData.value.grouped).flat().map((i) => i.id).sort();
      assertEquals(actual, expected);
      assertEquals(data.stats.value.filtered, expected.length);
    }),
    { numRuns: 300 },
  );
});

Deno.test('property: within a group, drawn items come first and ids ascend', () => {
  assertProperty(
    fc.property(collection, (specs) => {
      const { data } = run(specs, '', 'group');
      for (const group of Object.values(data.activeData.value.grouped)) {
        for (let i = 1; i < group.length; i++) {
          const [a, b] = [group[i - 1], group[i]];
          if (a.isDrawn !== b.isDrawn) assert(a.isDrawn, 'an undrawn item precedes a drawn one');
          else assert(a.sortKey <= b.sortKey, 'ids out of order');
        }
      }
    }),
    { numRuns: 300 },
  );
});

Deno.test('property: sidebar counts add up to the drawn items in every view', () => {
  assertProperty(
    fc.property(collection, query, fc.constantFrom<ViewMode>('group', 'date'), (specs, q, mode) => {
      const { list, data } = run(specs, q, mode);
      const matching = list.filter((i) => i.searchText.includes(norm(q)));
      const drawn = matching.filter((i) => i.isDrawn).length;
      const sidebarTotal = data.activeData.value.sidebarItems.reduce((n, s) => n + s.count, 0);
      assertEquals(sidebarTotal, drawn);
    }),
    { numRuns: 300 },
  );
});

Deno.test('property: date mode puts each drawn item in its UTC month, in time order', () => {
  assertProperty(
    fc.property(collection, query, (specs, q) => {
      const { list, data } = run(specs, q, 'date');
      const grouped = data.activeData.value.grouped;

      for (const [month, bucket] of Object.entries(grouped)) {
        for (const item of bucket) assertEquals(monthKey(new Date(item.drawnTime)), month);
      }
      const expected = list.filter((i) => i.isDrawn && i.searchText.includes(norm(q))).length;
      assertEquals(Object.values(grouped).flat().length, expected);

      // buckets appear oldest-first
      const firstTimes = Object.values(grouped).map((b) => Math.min(...b.map((i) => i.drawnTime)));
      assertEquals(firstTimes, [...firstTimes].sort((a, b) => a - b));
    }),
    { numRuns: 300 },
  );
});

Deno.test('property: a month is disabled in the sidebar exactly when it is empty', () => {
  assertProperty(
    fc.property(collection, query, (specs, q) => {
      const { data } = run(specs, q, 'date');
      const { grouped, sidebarItems } = data.activeData.value;
      for (const s of sidebarItems) {
        assertEquals(s.disabled, !grouped[s.id]?.length);
        assertEquals(s.count, grouped[s.id]?.length ?? 0);
      }
    }),
    { numRuns: 300 },
  );
});

Deno.test('property: the lightbox order is drawn-only and never goes back in time', () => {
  assertProperty(
    fc.property(collection, query, (specs, q) => {
      const { data } = run(specs, q, 'group');
      const seq = data.searchedDrawnItems.value;
      assert(seq.every((i) => i.isDrawn));
      for (let i = 1; i < seq.length; i++) assert(seq[i - 1].drawnTime <= seq[i].drawnTime);
    }),
    { numRuns: 300 },
  );
});
