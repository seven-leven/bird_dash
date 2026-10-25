import { test } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { computeStats, formatStats, statsAreCurrent, writeStats } from './collection_stats.ts';
import type { Collection } from '../lib/collections.ts';

const birds = {
  id: 'birds',
  label: 'Birds',
  groups: {
    Ducks: [
      { id: '001', name: 'Lesser Whistling-Duck', drawn: '2024-10-10', dhiv_script: 'ރޭރު' },
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
      firstDrawn: '2024-10-10',
      lastDrawn: '2025-10-07',
    },
    {
      id: 'sharks',
      label: 'Sharks',
      total: 1,
      drawn: 0,
      groups: 1,
      firstDrawn: null,
      lastDrawn: null,
    },
    {
      id: 'shells',
      label: 'Shells',
      total: 1,
      drawn: 1,
      groups: 1,
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
  // The Dhivehi name travels with a drawing that has one.
  const all = computeStats([birds]).newest;
  assertEquals(all.at(-1), {
    collection: 'birds',
    id: '001',
    name: 'Lesser Whistling-Duck',
    dhivehi: 'ރޭރު',
    drawn: '2024-10-10',
  });
});

test('no drawings anywhere: zero drawn and no newest, not an error', () => {
  const stats = computeStats([sharks]);
  assertEquals([stats.drawn, stats.newest], [0, []]);
});

test('the file text is stable: the same lists always write the same bytes', () => {
  const text = formatStats(computeStats([birds]));
  assertEquals(text, formatStats(computeStats([birds])));
  assert(text.endsWith('}\n'));
});

test('writeStats writes the file, and statsAreCurrent knows when it has gone stale', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_stats_'));
  try {
    const json = `${dir}/birds.json`;
    await writeFile(json, JSON.stringify(birds.groups));
    const col = { id: 'birds', label: 'Birds', emoji: '', paths: { json } } as Collection;
    const path = `${dir}/stats.json`;

    assertEquals(await statsAreCurrent([col], path), false); // no file yet
    const stats = await writeStats([col], path);
    assertEquals(stats.drawn, 3);
    assertEquals(await statsAreCurrent([col], path), true);

    // A drawing added to the list without a build leaves the numbers wrong.
    await writeFile(
      json,
      JSON.stringify({ ...birds.groups, Owls: [{ id: '150', name: 'Owl', drawn: '2026-04-01' }] }),
    );
    assertEquals(await statsAreCurrent([col], path), false);

    // Any other failure to read is not hidden as "stale".
    await assertRejects(() => statsAreCurrent([col], dir));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
