// @vitest-environment happy-dom
import { afterEach, test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { computed, h, nextTick, ref } from 'vue';
import AboutPage from './AboutPage.vue';
import { makeCollection } from '../../testing/fixtures.ts';
import { mountComponent } from '../../testing/mountComponent.ts';
import type {
  CollectionConfig,
  CollectionCounts,
  NewestDrawing,
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

// fetch answers with each response in turn; restored after each test.
const original = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = original;
});
function answer(...responses: (Stats | number | Error | string)[]): string[] {
  const urls: string[] = [];
  globalThis.fetch = ((input: string) => {
    urls.push(String(input));
    const next = responses.shift();
    if (next instanceof Error || typeof next === 'string') return Promise.reject(next);
    if (typeof next === 'number') return Promise.resolve(new Response('', { status: next }));
    return Promise.resolve(new Response(JSON.stringify(next)));
  }) as typeof fetch;
  return urls;
}

/** Wait for the fetch and the render after it. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  await nextTick();
};

function mount(list: CollectionConfig[] = [birds, sharks, shells], active?: CollectionConfig) {
  const host = mountComponent(() => h(AboutPage), {
    stores: { collections: { list: ref(list), activeCollection: computed(() => active) } },
  });
  const text = () => host.textContent!.replace(/\s+/g, ' ');
  const hrefs = () => [...host.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  return { host, text, hrefs };
}

test('it shows the grey shape while the numbers load, then the numbers from stats.json', async () => {
  const urls = answer(STATS);
  const { host, text } = mount();
  assert(host.querySelector('[aria-busy="true"]'));
  await settle();
  assertEquals(urls, ['/stats.json']);
  assertEquals(host.querySelector('[aria-busy="true"]'), null);

  assert(text().includes('sets out to draw the birds, sharks and shells of the Maldives'));
  assert(text().includes('18 of 276 drawn'));
  assert(text().includes('The latest drawing is the Sand Dollar, in March 2026.'));
  assert(text().includes('191 of the 204 birds and 19 of the 42 sharks carry their Dhivehi name'));
  assert(text().includes('eBird, BirdLife and Wiki for birds; iNaturalist and Wiki for sharks.'));
});

test('one card per collection: its count, its bar, its groups and how long it has been drawn', async () => {
  answer(STATS);
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
  answer(STATS);
  const { host, text, hrefs } = mount([birds, sharks, shells], sharks);
  await settle();
  const figure = host.querySelector('figure')!;
  assert(figure.textContent!.includes('Reyru'));
  assert(figure.textContent!.includes('The first drawing · 10 October 2024'));
  assertEquals(figure.querySelector('img')!.getAttribute('src'), '/thumb/birds/001.webp');

  // Browse goes to the collection last open; the drawings to their own pages.
  assertEquals(hrefs().filter((h) => h?.startsWith('#')), [
    '#sharks',
    '#birds/001',
    '#birds',
    '#sharks',
    '#shells',
    '#shells/029',
    '#birds/029',
    '#birds/001',
  ]);
  // A bird with two Dhivehi names is captioned by the first; one with none keeps the line.
  const recent = [...host.querySelectorAll('[aria-labelledby="about-recent"] [lang="dv"]')];
  assertEquals(recent.map((s) => s.textContent!.trim()), ['', 'ވަލު ކުކުޅު', 'ރޭރު']);
  assertEquals(recent[0].getAttribute('aria-hidden'), 'true');
  assert(text().includes('Watercock'));
});

test('the write-up, the manifesto and the source are links that leave the site', async () => {
  answer(STATS);
  const { host } = mount();
  await settle();
  const external = [...host.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
  assertEquals(external.map((a) => a.getAttribute('href')), [
    FOLIO,
    FOLIO,
    'https://github.com/seven-leven/bird_dash/blob/main/docs/DESIGN.md',
    'https://github.com/seven-leven/bird_dash',
  ]);
  for (const a of external) {
    assertEquals(a.rel, 'noopener noreferrer');
    assert(a.textContent!.includes('(opens in a new tab)'));
  }
});

test('a failed load says so, and Try again loads it again', async () => {
  answer(404, new Error('offline'), 'no reason', STATS);
  const { host, text } = mount();
  await settle();
  assert(text().includes("Couldn't load the numbers"));
  assert(text().includes('stats.json answered 404'));

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
  answer({
    drawn: 0,
    total: 30,
    collections: [counts('shells', { total: 0 })],
    first: null,
    newest: [],
  });
  // Crabs are in collections.json but not yet in stats.json: no card until the next build.
  const { host, text, hrefs } = mount([shells, makeCollection('crabs', { label: 'Crabs' })]);
  await settle();
  assert(text().includes('sets out to draw the shells and crabs of the Maldives'));
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
  answer({ ...STATS, first: { ...dollar, collection: 'gone' } });
  const { host, hrefs } = mount([]);
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
  answer({
    ...STATS,
    collections: many.map((c) => counts(c.id, { named: 1 })),
    first: null,
    newest: [],
  });
  const { host, text } = mount(many);
  await settle();
  assert(text().includes('sets out to draw the wildlife of the Maldives, in 8 collections'));
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
