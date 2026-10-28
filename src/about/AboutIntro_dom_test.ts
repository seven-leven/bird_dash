import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h } from 'vue';
import AboutIntro from './AboutIntro.vue';
import { makeCollection } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { NewestDrawing } from '../data/files.ts';

const birds = makeCollection('birds', { label: 'Birds', imageBase: '/thumb/birds/' });
const sharks = makeCollection('sharks', { label: 'Sharks' });
const duck: NewestDrawing = {
  collection: 'birds',
  id: '001',
  name: 'Lesser Whistling-Duck',
  dhivehi: 'ރޭރު',
  roman: 'Reyru',
  drawn: '2024-10-10',
};

function mount(first: NewestDrawing | null, collections: Collection[] = [birds, sharks]) {
  const host = mountComponent(() =>
    h(AboutIntro, { titleId: 'intro-title', collections, browseId: 'sharks', first })
  );
  return { host, text: host.textContent!.replace(/\s+/g, ' ') };
}

test('it says what the archive sets out to draw, from the collections', () => {
  const { host, text } = mount(null);
  assertEquals(host.querySelector('h1')!.id, 'intro-title'); // the page is named by it
  assert(text.includes('sets out to draw the birds and sharks in its lists'));
});

test('Browse opens the collection it is given; the write-up leaves the site', () => {
  const { host } = mount(null);
  assertEquals(host.querySelector('a.btn-primary')!.getAttribute('href'), '#sharks');
  const out = host.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
  assertEquals(out.getAttribute('href'), 'https://seven-leven.github.io/folio/code-wildlife.html');
  assertEquals(out.rel, 'noopener noreferrer');
});

test('the first drawing, once known: its picture links to it, captioned in Dhivehi, English and its day', () => {
  const { host } = mount(duck);
  const figure = host.querySelector('figure')!;
  assertEquals(figure.querySelector('a')!.getAttribute('href'), '#birds/001');
  assertEquals(figure.querySelector('img')!.getAttribute('src'), '/thumb/birds/001.webp');
  assertEquals(figure.querySelector('[lang="dv"]')!.textContent!.trim(), 'ރޭރު');
  assertEquals(figure.querySelector('[lang="dv-Latn"]')!.textContent, 'Reyru');
  assert(figure.textContent!.includes('The first drawing · 10 October 2024'));
});

test('without numbers there is no figure; without a Dhivehi name, no Dhivehi line', () => {
  assertEquals(mount(null).host.querySelector('figure'), null);
  const unnamed = mount({ ...duck, dhivehi: undefined, roman: undefined }).host;
  assertEquals(unnamed.querySelector('figure [lang="dv"]'), null);
  const unromanised = mount({ ...duck, roman: undefined }).host;
  assertEquals(unromanised.querySelector('figure [lang="dv-Latn"]'), null);
});

test('a drawing whose collection is gone has no image folder to look in', () => {
  const { host } = mount({ ...duck, collection: 'gone' }, []);
  assertEquals(host.querySelector('figure img')!.getAttribute('src'), '001.webp');
});

test('a series of studies is named with the rest, one collection like any other', () => {
  const butterflies = makeCollection('butterflies', {
    label: 'Butterflies',
    medium: 'colour pencil',
  });
  const both = mount(null, [birds, butterflies]).text;
  assert(both.includes('sets out to draw the birds and butterflies in its lists, one at a time.'));
  assert(!both.includes('species'));
  // Before the collections load, no sentence about them.
  assert(!mount(null, []).text.includes('sets out to draw'));
});
