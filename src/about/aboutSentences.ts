// The About page's words, worked out from collections.json and stats.json, so none is typed by
// hand and a new collection shows up on its own. However many collections there are, the page
// holds them: past NAMES_FIT a sentence counts them instead of naming each.
import type { Collection } from '../domain/toCollectionItems.ts';
import type { CollectionCounts } from '../data/files.ts';
import { drawnOf, plural } from '../domain/countWords.ts';
import { viewName } from '../domain/viewName.ts';
import { dayName, monthName, parseDay } from '../domain/dates.ts';

/** Collections a sentence names one by one; past this it counts them. */
export const NAMES_FIT = 3;

/** "birds, sharks and shells". */
export const joinAnd = (words: string[]): string =>
  words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

/** The collections of species: what "species", the Dhivehi names and the references are about. */
export const speciesOf = (collections: Collection[]): Collection[] =>
  collections.filter((c) => c.kind === 'species');

/** The series of studies, counted on their own. */
export const seriesOf = (collections: Collection[]): Collection[] =>
  collections.filter((c) => c.kind === 'series');

/** "the birds, sharks and shells in its lists", or with many, "the wildlife in its 7 collections".
 * Where a collection's species come from is its own business (not every list is Maldivian). */
export const subjectOf = (collections: Collection[]): string =>
  collections.length > NAMES_FIT
    ? `the wildlife in its ${collections.length} collections`
    : `the ${joinAnd(collections.map((c) => c.label.toLowerCase()))} in its lists`;

/** "Beside them, a series of studies: butterflies, in colour pencil." Empty without a series;
 * past NAMES_FIT, "Beside them, 6 series of studies, each in one medium." */
export const seriesLine = (series: Collection[]): string => {
  if (!series.length) return '';
  const count = series.length === 1 ? 'a series' : `${series.length} series`;
  if (series.length > NAMES_FIT) return `Beside them, ${count} of studies, each in one medium.`;
  const each = series.map((s) => `${s.label.toLowerCase()}, in ${s.medium}`);
  return `Beside them, ${count} of studies: ${joinAnd(each)}.`;
};

// Dates in the lists are `YYYY-MM-DD`, read as UTC like the month view's (domain/dates.ts).
/** "March 2025". */
export const monthOf = (iso: string): string => monthName(parseDay(iso));
/** "5 March 2025". */
export const dayOf = (iso: string): string => dayName(parseDay(iso));

/** A species with two Dhivehi names ("a / b") is captioned by the first. */
export const firstScript = (script: string): string => script.split('/')[0].trim();

/** One collection's card in the Progress section. */
export interface CollectionCard {
  id: string;
  label: string;
  icon?: string;
  emoji: string;
  accent?: string;
  /** "12 of 204 drawn", or "Nothing drawn yet". */
  count: string;
  percent: number;
  /** "41 families · since October 2024", or "8 orders · 42 sharks planned". */
  meta: string;
}

/** One card per collection in collections.json, numbered from stats.json. */
export const cardsOf = (collections: Collection[], counts: CollectionCounts[]): CollectionCard[] =>
  collections.flatMap((col) => {
    const s = counts.find((c) => c.id === col.id);
    if (!s) return [];
    const groupWord = s.groups === 1 ? col.groupLabel : viewName('group', col.groupLabel);
    const groups = `${s.groups} ${groupWord.toLowerCase()}`;
    return [{
      id: col.id,
      label: col.label,
      icon: col.icon,
      emoji: col.emoji,
      accent: col.accent,
      count: s.drawn ? drawnOf(s.drawn, s.total) : 'Nothing drawn yet',
      percent: s.total ? Math.round((s.drawn / s.total) * 100) : 0,
      meta: s.firstDrawn
        ? `${groups} · since ${monthOf(s.firstDrawn)}`
        : `${groups} · ${plural(s.total, col.itemLabel)} planned`,
    }];
  });

/** "191 of the 204 birds and 19 of the 42 sharks"; collections with no names are left out.
 * With more than NAMES_FIT of them, one sum: "210 of the 246 species in 4 collections". */
export const namedLine = (counts: CollectionCounts[], collections: Collection[]): string => {
  const byId = new Map(collections.map((c) => [c.id, c]));
  const named = counts.filter((s) => s.named && byId.has(s.id));
  if (named.length > NAMES_FIT) {
    const sum = (key: 'named' | 'total') => named.reduce((n, s) => n + s[key], 0);
    return `${sum('named')} of the ${sum('total')} species in ${named.length} collections`;
  }
  return joinAnd(
    named.map((s) => `${s.named} of the ${plural(s.total, byId.get(s.id)!.itemLabel)}`),
  );
};

/** "eBird, BirdLife and Wiki for birds; iNaturalist and Wiki for sharks", from collections.json.
 * With more than NAMES_FIT collections, just the sites, each once. */
export const referencesLine = (collections: Collection[]): string => {
  const linked = collections.filter((c) => c.links.length);
  if (linked.length > NAMES_FIT) {
    return joinAnd([...new Set(linked.flatMap((c) => c.links.map((l) => l.label)))]);
  }
  return linked
    .map((c) => `${joinAnd(c.links.map((l) => l.label))} for ${c.label.toLowerCase()}`)
    .join('; ');
};
