import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import SearchResults from './SearchResults.vue';
import { makeCollection, makeItem } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';

// The search journey (src/journeys/search_journey_test.ts) covers what a visitor does here; this
// covers the name lines an item from the lists cannot produce today.

test('after the first line, only a Latin name is set in italics', () => {
  const item = makeItem({
    commonName: 'Mallard',
    names: [
      { text: 'Anas platyrhynchos', lang: 'la', role: 'latin' },
      { text: 'Mallard', lang: 'en', role: 'common' },
    ],
  });
  const birds = makeCollection('birds');
  const host = mountComponent(
    () =>
      h(SearchResults, {
        results: [{
          collection: birds,
          results: [{ item, collection: birds, matchedFields: ['commonName'] }],
          count: 1,
          hidden: 0,
        }],
        focusedIndex: -1,
        getFlatIndex: (_: string, i: number) => i,
        highlight: (text: string) => text,
      }),
  );
  const lines = [...host.querySelectorAll('[role="option"] p')];
  assertEquals(lines.map((p) => p.textContent), ['Anas platyrhynchos', 'Mallard']);
  assertEquals(lines[1].classList.contains('italic'), false);
});
