import { test } from 'vitest';
import { assert } from '@std/assert';
import { h } from 'vue';
import AboutMaking from './AboutMaking.vue';
import { makeCollection } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { CollectionCounts } from '../data/files.ts';

const link = (label: string) => ({ label, url: () => '' });
const birds = makeCollection('birds', {
  label: 'Birds',
  itemLabel: 'bird',
  links: [link('eBird'), link('Wiki')],
});
const shells = makeCollection('shells', { label: 'Shells', itemLabel: 'shell' });
const counts = (id: string, named: number, total = 10): CollectionCounts => ({
  id,
  label: id,
  total,
  drawn: 0,
  groups: 1,
  named,
  firstDrawn: null,
  lastDrawn: null,
});

const text = (collections: Collection[], numbers: CollectionCounts[]) =>
  mountComponent(() => h(AboutMaking, { collections, counts: numbers })).textContent!.replace(
    /\s+/g,
    ' ',
  );

test('how many carry a Dhivehi name, and which sites each collection is checked against', () => {
  const words = text([birds, shells], [counts('birds', 191, 204), counts('shells', 0)]);
  assert(words.includes('191 of the 204 birds carry their Dhivehi name in Thaana'));
  assert(words.includes('Every page links to where to learn more: eBird and Wiki for birds.'));
});

test('with no names and no reference sites, it still reads', () => {
  const words = text([shells], [counts('shells', 0)]);
  assert(words.includes('Each carries its Dhivehi name in Thaana where it has one.'));
  assert(words.includes('Every page links to where to learn more.'));
});

test('a series of studies counts like any collection: where it has names, and where links', () => {
  const butterflies = makeCollection('butterflies', {
    label: 'Butterflies',
    itemLabel: 'butterfly',
    medium: 'colour pencil',
  });
  const words = text([birds, butterflies], [counts('birds', 191, 204), counts('butterflies', 0)]);
  assert(words.includes('By hand, by name, by reference.'));
  assert(words.includes('191 of the 204 birds carry'));
  assert(!words.includes('butterfl'));
  assert(words.includes('eBird and Wiki for birds.'));
});
