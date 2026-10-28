import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import {
  cardsOf,
  joinAnd,
  namedLine,
  NAMES_FIT,
  referencesLine,
  seriesLine,
  seriesOf,
  speciesOf,
  subjectOf,
} from './aboutSentences.ts';
import { makeCollection } from '../testing/fixtures.ts';
import type { CollectionCounts } from '../data/files.ts';

const link = (label: string) => ({ label, url: () => '' });
const counts = (id: string, over: Partial<CollectionCounts> = {}): CollectionCounts => ({
  id,
  label: id,
  total: 10,
  drawn: 0,
  groups: 1,
  named: 0,
  firstDrawn: null,
  lastDrawn: null,
  ...over,
});
/** `n` collections, the odd ones checked against Wiki, the even ones against WoRMS. */
const many = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    makeCollection(`c${i}`, {
      label: `C${i}`,
      itemLabel: 'thing',
      links: [link(i % 2 ? 'Wiki' : 'WoRMS')],
    }));

test('a list is joined with commas and a last "and"', () => {
  assertEquals(joinAnd([]), '');
  assertEquals(joinAnd(['birds']), 'birds');
  assertEquals(joinAnd(['birds', 'sharks', 'shells']), 'birds, sharks and shells');
});

test('up to NAMES_FIT collections are named one by one; past it they are counted', () => {
  const fit = many(NAMES_FIT);
  assertEquals(subjectOf(fit), 'the c0, c1 and c2 in its lists');
  assertEquals(subjectOf(many(NAMES_FIT + 1)), 'the wildlife in its 4 collections');

  assertEquals(
    namedLine(fit.map((c) => counts(c.id, { named: 2 })), fit),
    '2 of the 10 things, 2 of the 10 things and 2 of the 10 things',
  );
  const past = many(NAMES_FIT + 1);
  assertEquals(
    namedLine(past.map((c) => counts(c.id, { named: 2 })), past),
    '8 of the 40 species in 4 collections',
  );

  assertEquals(referencesLine(fit), 'WoRMS for c0; Wiki for c1; WoRMS for c2');
  assertEquals(referencesLine(past), 'WoRMS and Wiki'); // each site once
});

test('a collection with nothing in its list has an empty bar, not a broken one', () => {
  const [card] = cardsOf([makeCollection('crabs')], [counts('crabs', { total: 0 })]);
  assertEquals(card.percent, 0);
});

test('species and series are told apart by their kind', () => {
  const birds = makeCollection('birds');
  const butterflies = makeCollection('butterflies', { kind: 'series', medium: 'colour pencil' });
  assertEquals(speciesOf([birds, butterflies]), [birds]);
  assertEquals(seriesOf([birds, butterflies]), [butterflies]);
});

test('the series are named with their medium, or past NAMES_FIT counted; none, no line', () => {
  const series = (n: number) =>
    Array.from(
      { length: n },
      (_, i) => makeCollection(`s${i}`, { label: `S${i}`, kind: 'series', medium: `ink ${i}` }),
    );
  assertEquals(seriesLine([]), '');
  assertEquals(seriesLine(series(1)), 'Beside them, a series of studies: s0, in ink 0.');
  assertEquals(
    seriesLine(series(2)),
    'Beside them, 2 series of studies: s0, in ink 0 and s1, in ink 1.',
  );
  assertEquals(
    seriesLine(series(NAMES_FIT + 1)),
    'Beside them, 4 series of studies, each in one medium.',
  );
});
