import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { computeStats, formatStats, formatStatsFor, writeStats } from './stats.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import type { Collection } from '../lib/collections.ts';

const birds = {
  id: 'birds',
  label: 'Birds',
  groups: {
    Ducks: [
      {
        id: '001',
        name: 'Lesser Whistling-Duck',
        drawn: '2024-10-10',
        dhiv_script: 'ރޭރު',
        dhiv: 'Reyru',
      },
      { id: '002', name: 'Cotton Pygmy-Goose', drawn: '2025-10-07' },
      { id: '003', name: 'Garganey', drawn: '' }, // still a placeholder
    ],
    Herons: [{ id: '133', name: 'Yellow Bittern', drawn: '2025-10-07' }],
  },
};
const sharks = {
  id: 'sharks',
  label: 'Sharks',
  groups: { Sharks: [{ id: '001', name: 'Whale Shark' }] },
};
const shells = {
  id: 'shells',
  label: 'Shells',
  groups: { Bivalves: [{ id: '019', name: 'Scallop Shell', drawn: '2026-03-09' }] },
};

test('each collection is counted from its list: species, drawn, groups, first and latest drawing', () => {
  const stats = computeStats([birds, sharks, shells]);
  assertEquals(stats.collections, [
    {
      id: 'birds',
      label: 'Birds',
      total: 4,
      drawn: 3,
      groups: 2,
      named: 1,
      firstDrawn: '2024-10-10',
      lastDrawn: '2025-10-07',
    },
    {
      id: 'sharks',
      label: 'Sharks',
      total: 1,
      drawn: 0,
      groups: 1,
      named: 0,
      firstDrawn: null,
      lastDrawn: null,
    },
    {
      id: 'shells',
      label: 'Shells',
      total: 1,
      drawn: 1,
      groups: 1,
      named: 0,
      firstDrawn: '2026-03-09',
      lastDrawn: '2026-03-09',
    },
  ]);
  assertEquals([stats.drawn, stats.total], [4, 6]);
});

test('the newest drawings come first; a shared day keeps collection order, then id', () => {
  const { newest } = computeStats([birds, sharks, shells], 3);
  assertEquals(newest, [
    { collection: 'shells', id: '019', name: 'Scallop Shell', drawn: '2026-03-09' },
    { collection: 'birds', id: '002', name: 'Cotton Pygmy-Goose', drawn: '2025-10-07' },
    { collection: 'birds', id: '133', name: 'Yellow Bittern', drawn: '2025-10-07' },
  ]);
  // The Dhivehi name travels with a drawing that has one, with how to say it if the
  // list says; a romanisation with no Thaana to go with it is left behind.
  assertEquals(
    computeStats([{
      ...sharks,
      groups: { S: [{ id: '1', name: 'S', drawn: '2026-01-01', dhiv: 'Miyaru' }] },
    }])
      .newest[0].roman,
    undefined,
  );
  const all = computeStats([birds]).newest;
  assertEquals(all.at(-1), {
    collection: 'birds',
    id: '001',
    name: 'Lesser Whistling-Duck',
    dhivehi: 'ރޭރު',
    roman: 'Reyru',
    drawn: '2024-10-10',
  });
});

test('no drawings anywhere: zero drawn and no newest, not an error', () => {
  const stats = computeStats([sharks]);
  assertEquals([stats.drawn, stats.newest, stats.first], [0, [], null]);
});

test('the file text is stable: the same lists always write the same bytes', () => {
  const text = formatStats(computeStats([birds]));
  assertEquals(text, formatStats(computeStats([birds])));
  assert(text.endsWith('}\n'));
});

test('the stats are written as the lists say, the same text the check expects', async () => {
  const collection = {
    id: 'birds',
    label: 'Birds',
    emoji: '',
    paths: { json: './birds.json' },
  } as Collection;
  const io = fakeIo({ files: { './birds.json': JSON.stringify(birds.groups) } });
  const stats = await writeStats([collection], io, './stats.json');
  assertEquals(stats.drawn, 3);
  assertEquals(io.files.get('./stats.json'), await formatStatsFor([collection], io));
});

test('the first drawing is the oldest, the same rules breaking a tie', () => {
  assertEquals(computeStats([shells, birds]).first, {
    collection: 'birds',
    id: '001',
    name: 'Lesser Whistling-Duck',
    dhivehi: 'ރޭރު',
    roman: 'Reyru',
    drawn: '2024-10-10',
  });
  const sameDay = {
    ...shells,
    groups: { Bivalves: [{ id: '019', name: 'S', drawn: '2024-10-10' }] },
  };
  assertEquals(computeStats([sameDay, birds]).first?.collection, 'shells'); // listed first
});
