import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { ref } from 'vue';
import { createSearchStore, SEARCH_DELAY } from './searchStore.ts';
import { runInScope } from '../testing/mount.ts';
import { toCollection, toCollectionItems } from '../domain/toCollectionItems.ts';
import { archiveCollections, archiveLists } from '../testing/scenarios/archive.ts';

/** A search store over the fixture archive, every list loaded. */
function searchOverTheArchive() {
  const collections = archiveCollections().map((entry) => toCollection(entry, '/'));
  const lists = archiveLists();
  const itemsByCollection = Object.fromEntries(
    collections.map((c) => [c.id, toCollectionItems(c, lists[c.id as keyof typeof lists])]),
  );
  return runInScope(() => createSearchStore({ collections: ref(collections), itemsByCollection }));
}

test('setQuery updates the query and opens the dropdown for non-empty input', () => {
  const { value: s } = searchOverTheArchive();
  assertEquals(s.query.value, '');
  assertEquals(s.dropdownOpen.value, false);

  s.setQuery('mallard');
  assertEquals(s.query.value, 'mallard');
  assertEquals(s.dropdownOpen.value, true);
});

test('setQuery with blank input does not open the dropdown', () => {
  const { value: s } = searchOverTheArchive();
  s.setQuery('   ');
  assertEquals(s.dropdownOpen.value, false);
});

test('setDropdown toggles independently; clear resets both', () => {
  const { value: s } = searchOverTheArchive();
  s.setQuery('x');
  s.setDropdown(false);
  assertEquals(s.dropdownOpen.value, false);
  assertEquals(s.query.value, 'x');

  s.clear();
  assertEquals(s.query.value, '');
  assertEquals(s.dropdownOpen.value, false);
});

test('once typing pauses, the query finds results in every collection, by collection', async () => {
  const { value: s } = searchOverTheArchive();
  s.setQuery('grey');
  assertEquals(s.results.value, []); // not before the pause
  await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY + 20));
  assertEquals(
    s.results.value.map((g) => [g.collection.id, g.results.map((r) => r.item.commonName)]),
    [['birds', ['Grey Heron']], ['sharks', ['Grey Reef Shark']]],
  );
  assertEquals([s.resultCount.value, s.drawnResultCount.value], [2, 1]);
});
