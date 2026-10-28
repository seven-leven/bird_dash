import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h, nextTick } from 'vue';
import AboutProgress from './AboutProgress.vue';
import { makeCollection } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { CollectionCounts, NewestDrawing, Stats } from '../data/files.ts';

const birds = makeCollection('birds', {
  label: 'Birds',
  icon: 'bird',
  accent: 'teal',
  groupLabel: 'Family',
  itemLabel: 'bird',
});
const sharks = makeCollection('sharks', {
  label: 'Sharks',
  icon: 'shark',
  accent: 'blue',
  groupLabel: 'Order',
  itemLabel: 'shark',
});
const shells = makeCollection('shells', {
  label: 'Shells',
  groupLabel: 'Group',
  itemLabel: 'shell',
});

const counts = (id: string, over: Partial<CollectionCounts> = {}): CollectionCounts => ({
  id,
  label: id,
  total: 10,
  drawn: 0,
  groups: 2,
  named: 0,
  firstDrawn: null,
  lastDrawn: null,
  ...over,
});
const dollar: NewestDrawing = {
  collection: 'shells',
  id: '029',
  name: 'Sand Dollar',
  drawn: '2026-03-09',
};

const STATS: Stats = {
  drawn: 18,
  total: 276,
  collections: [
    counts('birds', { total: 204, drawn: 15, groups: 56, firstDrawn: '2024-10-10' }),
    counts('sharks', { total: 42, groups: 6 }),
    counts('shells', { total: 30, drawn: 3, groups: 1, firstDrawn: '2025-07-06' }),
  ],
  first: null,
  newest: [dollar],
};

function mount(collections: Collection[] = [birds, sharks, shells], stats = STATS) {
  const host = mountComponent(() => h(AboutProgress, { collections, stats }));
  return { host, text: () => host.textContent!.replace(/\s+/g, ' ') };
}

test('the totals, and the latest drawing by name and month', () => {
  const { text } = mount();
  assert(text().includes('18 of 276 drawn'));
  assert(text().includes('The latest drawing is the Sand Dollar, in March 2026.'));
  assert(!mount(undefined, { ...STATS, newest: [] }).text().includes('The latest drawing'));
});

test('one card per collection: its count, its bar, its groups and how long it has been drawn', () => {
  const { host } = mount();
  const cards = [...host.querySelectorAll('ul > li')];
  assertEquals(
    cards.map((li) =>
      [...li.querySelector('a')!.children].map((c) => c.textContent!.trim()).filter(Boolean).join(
        ' | ',
      )
    ),
    [
      'Birds | 15 of 204 drawn | 56 families · since October 2024',
      'Sharks | Nothing drawn yet | 6 orders · 42 sharks planned',
      '🐦 Shells | 3 of 30 drawn | 1 group · since July 2025', // no icon: the emoji
    ],
  );
  assertEquals(cards.map((li) => li.querySelector('a')!.getAttribute('href')), [
    '#birds',
    '#sharks',
    '#shells',
  ]);
  assertEquals(cards.map((li) => li.getAttribute('data-accent')), ['teal', 'blue', null]);
  const bars = cards.map((li) => (li.querySelector('.bg-accent-500') as HTMLElement).style.width);
  assertEquals(bars, ['7%', '0%', '10%']);
});

test('a collection not yet in stats.json has no card until the next build', () => {
  const crabs = makeCollection('crabs', { label: 'Crabs' });
  assertEquals(mount([birds, crabs]).host.querySelectorAll('ul > li').length, 1);
});

test('past six cards the rest fold behind Show all, which says how many and whether it is open', async () => {
  const many = Array.from({ length: 8 }, (_, i) => makeCollection(`c${i}`, { label: `C${i}` }));
  const { host } = mount(many, { ...STATS, collections: many.map((c) => counts(c.id)) });
  const cards = () => host.querySelectorAll('ul > li').length;
  const toggle = host.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
  assertEquals([cards(), toggle.textContent!.trim(), toggle.getAttribute('aria-expanded')], [
    6,
    'Show all 8 collections',
    'false',
  ]);
  toggle.click();
  await nextTick();
  assertEquals([cards(), toggle.textContent!.trim(), toggle.getAttribute('aria-expanded')], [
    8,
    'Show fewer',
    'true',
  ]);
});

test('six or fewer cards need no toggle', () => {
  assertEquals(mount().host.querySelector('button'), null);
});
