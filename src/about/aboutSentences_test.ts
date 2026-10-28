import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import {
  cardsOf,
  joinAnd,
  namedLine,
  NAMES_FIT,
  referencesLine,
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
    '8 of the 40 subjects in 4 collections',
  );

  assertEquals(referencesLine(fit), 'WoRMS for c0; Wiki for c1; WoRMS for c2');
  assertEquals(referencesLine(past), 'WoRMS and Wiki'); // each site once
});

test('a collection with nothing in its list has an empty bar, not a broken one', () => {
  const [card] = cardsOf([makeCollection('crabs')], [counts('crabs', { total: 0 })]);
  assertEquals(card!.percent, 0);
});
