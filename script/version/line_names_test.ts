import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { lineName, lineNames, loadLineNames } from './line_names.ts';
import type { Collection } from '../lib/collections.ts';

const birds = {
  id: 'birds',
  data: {
    Ducks: [
      {
        id: '002',
        name: 'Cotton Pygmy-Goose',
        drawn: '2024-10-15',
        dhiv: 'Reyru',
        dhiv_script: 'ރޭރު',
      },
      {
        id: '001',
        name: 'Lesser Whistling-Duck',
        drawn: '2024-10-10',
        dhiv: 'Reyru',
        dhiv_script: 'ރޭރު',
      },
      { id: '005', name: 'Garganey', dhiv: 'Kunburu Reyru', dhiv_script: 'ކުންބުރު ރޭރު' }, // not drawn
    ],
    Herons: [
      {
        id: '138',
        name: 'Gray Heron',
        drawn: '2025-10-07',
        dhiv: 'Alhi Maakanaa / Maakanaa',
        dhiv_script: 'އަޅި މާކަނާ / މާކަނާ',
      },
      {
        id: '137',
        name: 'Cattle Egret',
        drawn: '2025-10-07',
        dhiv: 'Iruvaihudhu',
        dhiv_script: 'އިރުވައިހުދު',
      },
      { id: '140', name: 'Night Heron', drawn: '2025-11-01', dhiv_script: 'ރާތާ' }, // no romanisation
    ],
  },
};
const shells = {
  id: 'shells',
  data: {
    Bivalves: [{
      id: '001',
      name: 'Scallop',
      drawn: '2025-10-07',
      dhiv: 'Kaha',
      dhiv_script: 'ކަހަ',
    }, { id: '002', name: 'Clam', drawn: '2025-07-09' }], // no Dhivehi name: names nothing
  },
};

test('names come from the drawings in drawing order, each Dhivehi name once', () => {
  assertEquals(lineNames([birds, shells]).map((n) => n.roman), [
    'Reyru', // the first drawing; the second Reyru is skipped
    'Iruvaihudhu', // same day: birds before shells, then by id (137 before 138)
    'Alhi Maakanaa', // a drawing with two names gives its first
    'Kaha',
  ]);
  // A drawing with no romanisation, or not drawn, names nothing.
  assertEquals(lineNames([birds]).at(-1), {
    roman: 'Alhi Maakanaa',
    script: 'އަޅި މާކަނާ',
    species: 'Gray Heron',
  });
  // Collection order breaks a tie on the same day.
  assertEquals(lineNames([shells, birds])[1].roman, 'Kaha');
});

test('line 0.n takes the n-th name; past the last, or from 1.0, there is none', () => {
  const names = lineNames([birds, shells]);
  assertEquals(lineName(names, 0, 1)?.roman, 'Reyru');
  assertEquals(lineName(names, 0, 4)?.roman, 'Kaha');
  assertEquals(lineName(names, 0, 5), null);
  assertEquals(lineName(names, 1, 0), null);
});

test('a collection whose list is not written yet has nothing to name', async () => {
  const ghost = { id: 'ghosts', paths: { json: './public/lists/no-such-list.json' } } as Collection;
  assertEquals(await loadLineNames([ghost]), []);
});
