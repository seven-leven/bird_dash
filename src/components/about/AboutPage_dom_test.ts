import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { computed, h, nextTick, ref, shallowRef } from 'vue';
import AboutPage from './AboutPage.vue';
import { makeCollection } from '../../testing/fixtures.ts';
import { settle } from '../../testing/settle.ts';
import { mountComponent } from '../../testing/mount.ts';
import type {
  Collection,
  CollectionCounts,
  NewestDrawing,
  Page,
  Stats,
} from '../../types/index.ts';

const FOLIO = 'https://seven-leven.github.io/folio/code-wildlife.html';

const link = (label: string) => ({ label, url: () => '' });
const birds = makeCollection('birds', {
  label: 'Birds',
  icon: 'bird',
  accent: 'teal',
  groupLabel: 'Family',
  itemLabel: 'bird',
  imageBase: '/thumb/birds/',
  links: [link('eBird'), link('BirdLife'), link('Wiki')],
});
const sharks = makeCollection('sharks', {
  label: 'Sharks',
  icon: 'shark',
  accent: 'blue',
  groupLabel: 'Order',
  itemLabel: 'shark',
  imageBase: '/thumb/sharks/',
  links: [link('iNaturalist'), link('Wiki')],
});
const shells = makeCollection('shells', {
  label: 'Shells',
  groupLabel: 'Group',
  itemLabel: 'shell',
  imageBase: '/thumb/shells/',
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
const duck: NewestDrawing = {
  collection: 'birds',
  id: '001',
  name: 'Lesser Whistling-Duck',
  dhivehi: 'ރޭރު',
  roman: 'Reyru',
  drawn: '2024-10-10',
};
const dollar: NewestDrawing = {
  collection: 'shells',
  id: '029',
  name: 'Sand Dollar',
  drawn: '2026-03-09',
};
const waterhen: NewestDrawing = {
  collection: 'birds',
  id: '029',
  name: 'Watercock',
  dhivehi: 'ވަލު ކުކުޅު / ކުލީ ކުކުޅު',
  drawn: '2026-01-04',
};

const STATS: Stats = {
  drawn: 18,
  total: 276,
  collections: [
    counts('birds', { total: 204, drawn: 15, groups: 56, named: 191, firstDrawn: '2024-10-10' }),
    counts('sharks', { total: 42, groups: 6, named: 19 }),
    counts('shells', { total: 30, drawn: 3, groups: 1, firstDrawn: '2025-07-06' }),
  ],
  first: duck,
  newest: [dollar, waterhen, duck],
};

/**
 * A stand-in for the stats store: each load answers with the next of `answers`, the
 * numbers or an error message, after a tick (as a fetch would).
 */
function fakeStats(...answers: (Stats | string)[]) {
  const stats = shallowRef<Stats | null>(null);
  const error = ref('');
  let loads = 0;
  const load = async () => {
    loads++;
    error.value = '';
    await Promise.resolve();
    const next = answers.shift()!;
    if (typeof next === 'string') error.value = next;
    else stats.value = next;
  };
  return { stats, error, load, loads: () => loads };
}

/** Wait for the load and the render after it. */

function mount(
  list: Collection[] = [birds, sharks, shells],
  active?: Collection,
  stats = fakeStats(STATS),
) {
  const host = mountComponent(() => h(AboutPage), {
    stores: {
      collections: { list: ref(list), activeCollection: computed(() => active) },
      stats,
      ui: { page: ref<Page>('about') }, // for the footer
    },
  });
  const text = () => host.textContent!.replace(/\s+/g, ' ');
  const hrefs = () => [...host.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  return { host, text, hrefs };
}

test('it shows the grey shape while the numbers load, then the numbers from stats.json', async () => {
  const stats = fakeStats(STATS);
  const { host, text } = mount(undefined, undefined, stats);
  assert(host.querySelector('[aria-busy="true"]'));
  await settle();
  assertEquals(stats.loads(), 1);
  assertEquals(host.querySelector('[aria-busy="true"]'), null);

  assert(text().includes('sets out to draw the birds, sharks and shells in its lists'));
  assert(text().includes('18 of 276 drawn'));
  assert(text().includes('The latest drawing is the Sand Dollar, in March 2026.'));
  assert(text().includes('191 of the 204 birds and 19 of the 42 sharks carry their Dhivehi name'));
  assert(text().includes('eBird, BirdLife and Wiki for birds; iNaturalist and Wiki for sharks.'));
});

test('one card per collection: its count, its bar, its groups and how long it has been drawn', async () => {
  const { host } = mount();
  await settle();
  const lines = [...host.querySelectorAll('ul')][0].querySelectorAll(':scope > li');
  assertEquals(
    [...lines].map((li) =>
      [...li.querySelector('a')!.children].map((c) => c.textContent!.trim()).filter(Boolean).join(
        ' | ',
      )
    ),
    [
      'Birds | 15 of 204 drawn | 56 families · since October 2024',
      'Sharks | Nothing drawn yet | 6 orders · 42 sharks planned',
      '🐦 Shells | 3 of 30 drawn | 1 group · since July 2025', // no icon: the emoji,
    ],
  );
  assertEquals([...lines].map((li) => li.getAttribute('data-accent')), ['teal', 'blue', null]);
  const bars = [...lines].map((li) =>
    (li.querySelector('.bg-accent-500') as HTMLElement).style.width
  );
  assertEquals(bars, ['7%', '0%', '10%']);
});

test('the first drawing heads the page; the newest five link to their pages in the viewer', async () => {
  const { host, text, hrefs } = mount([birds, sharks, shells], sharks);
  await settle();
  const figure = host.querySelector('figure')!;
  assert(figure.textContent!.includes('Reyru'));
  assert(figure.textContent!.includes('The first drawing · 10 October 2024'));
  assertEquals(figure.querySelector('img')!.getAttribute('src'), '/thumb/birds/001.webp');

  // Browse goes to the collection last open; the drawings to their own pages; then the
  // footer's pages.
  assertEquals(hrefs().filter((h) => h?.startsWith('#')), [
    '#sharks',
    '#birds/001',
    '#birds',
    '#sharks',
    '#shells',
    '#shells/029',
    '#birds/029',
    '#birds/001',
    '#about',
  ]);
  // A bird with two Dhivehi names is captioned by the first; one with none keeps the line.
  const recent = [...host.querySelectorAll('[aria-labelledby="about-recent"] [lang="dv"]')];
  assertEquals(recent.map((s) => s.textContent!.trim()), ['', 'ވަލު ކުކުޅު', 'ރޭރު']);
  assertEquals(recent[0].getAttribute('aria-hidden'), 'true');
  assert(text().includes('Watercock'));
});

test('the write-up and the source are links that leave the site; the manifesto is in the docs', async () => {
  const { host } = mount();
  await settle();
  const external = [...host.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
  assertEquals(external.map((a) => a.getAttribute('href')), [
    FOLIO,
    FOLIO,
    'https://github.com/seven-leven/bird_dash',
  ]);
  for (const a of external) {
    assertEquals(a.rel, 'noopener noreferrer');
    assert(a.textContent!.includes('(opens in a new tab)'));
  }
  // The docs site is served beside the gallery, so the manifesto opens in this tab.
  const manifesto = [...host.querySelectorAll('a')].find((a) =>
    a.textContent!.includes('manifesto')
  )!;
  assertEquals([manifesto.getAttribute('href'), manifesto.target], ['docs/DESIGN.html', '']);
});

test('a failed load says so, and Try again loads it again', async () => {
  const { host, text } = mount(
    undefined,
    undefined,
    fakeStats('HTTP 404 loading stats.json', 'offline', 'no reason', STATS),
  );
  await settle();
  assert(text().includes("Couldn't load the numbers"));
  assert(text().includes('HTTP 404 loading stats.json'));

  const retry = () =>
    [...host.querySelectorAll('button')].find((b) => b.textContent!.includes('Try again'))!;
  retry().click();
  await settle();
  assert(text().includes('offline'));
  retry().click();
  await settle();
  assert(text().includes('no reason'));
  retry().click();
  await settle();
  assert(text().includes('18 of 276 drawn'));
});

test('an archive with nothing drawn and no names still reads', async () => {
  const empty = fakeStats({
    drawn: 0,
    total: 30,
    collections: [counts('shells', { total: 0 })],
    first: null,
    newest: [],
  });
  // Crabs are in collections.json but not yet in stats.json: no card until the next build.
  const { host, text, hrefs } = mount(
    [shells, makeCollection('crabs', { label: 'Crabs' })],
    undefined,
    empty,
  );
  await settle();
  assert(text().includes('sets out to draw the shells and crabs in its lists'));
  assert(text().includes('Each species carries its Dhivehi name in Thaana where it has one.'));
  assert(text().includes('Every page links to where to learn more.'));
  assertEquals(host.querySelector('figure'), null);
  assertEquals(host.querySelector('[aria-labelledby="about-recent"]'), null);
  assert(!text().includes('The latest drawing'));
  assertEquals(host.querySelectorAll('ul')[0].children.length, 1);
  assertEquals((host.querySelector('.bg-accent-500') as HTMLElement).style.width, '0%');
  assertEquals(hrefs()[0], '#shells'); // no collection open yet: the first
});

test('with no collections, Browse has nowhere to go; a drawing whose collection is gone has no image base', async () => {
  const { host, hrefs } = mount(
    [],
    undefined,
    fakeStats({ ...STATS, first: { ...dollar, collection: 'gone' } }),
  );
  await settle();
  assertEquals(hrefs()[0], '#');
  assertEquals(host.querySelector('figure img')!.getAttribute('src'), '029.webp');
  // The figure has no Dhivehi line for a drawing without one.
  assertEquals(host.querySelector('figure [lang="dv"]'), null);
  // stats.json lists collections that collections.json no longer has: no card, no name line.
  assertEquals(host.querySelectorAll('ul')[0].children.length, 0);
});

test('many collections fold: six cards, then Show all; the prose counts them instead of naming each', async () => {
  const many = Array.from(
    { length: 8 },
    (_, i) =>
      makeCollection(`c${i}`, {
        label: `C${i}`,
        itemLabel: 'thing',
        links: [link(i % 2 ? 'Wiki' : 'WoRMS')],
      }),
  );
  const numbers = fakeStats({
    ...STATS,
    collections: many.map((c) => counts(c.id, { named: 1 })),
    first: null,
    newest: [],
  });
  const { host, text } = mount(many, undefined, numbers);
  await settle();
  assert(text().includes('sets out to draw the wildlife in its 8 collections'));
  assert(text().includes('8 of the 80 species in 8 collections carry'));
  assert(text().includes('learn more: WoRMS and Wiki.'));

  const cards = () => host.querySelectorAll('ul')[0].children.length;
  const toggle = [...host.querySelectorAll('button')].find((b) => b.hasAttribute('aria-expanded'))!;
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
