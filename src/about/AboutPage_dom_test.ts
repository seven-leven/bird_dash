// The page itself: it loads the numbers, shows their shape while they come, says when they
// cannot, and lays out its sections (each tested in its own file) with what the app places
// after them.
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { computed, h, ref, shallowRef } from 'vue';
import AboutPage from './AboutPage.vue';
import { makeCollection } from '../testing/fixtures.ts';
import { settle } from '../testing/settle.ts';
import { mountComponent } from '../testing/mount.ts';
import type { Collection } from '../domain/toCollectionItems.ts';
import type { Stats } from '../data/files.ts';

const birds = makeCollection('birds', { label: 'Birds' });
const sharks = makeCollection('sharks', { label: 'Sharks' });

const duck = { collection: 'birds', id: '001', name: 'Duck', drawn: '2024-10-10' };
const STATS: Stats = {
  drawn: 1,
  total: 2,
  collections: [{
    id: 'birds',
    label: 'Birds',
    total: 2,
    drawn: 1,
    groups: 1,
    named: 0,
    firstDrawn: duck.drawn,
    lastDrawn: duck.drawn,
  }],
  first: duck,
  newest: [duck],
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

function mount(list: Collection[], active?: Collection, stats = fakeStats(STATS)) {
  const host = mountComponent(
    () => h(AboutPage, null, { default: () => h('footer', { id: 'placed' }) }),
    {
      stores: {
        collections: { collections: ref(list), activeCollection: computed(() => active) },
        stats,
      },
    },
  );
  const text = () => host.textContent!.replace(/\s+/g, ' ');
  /** Each section by what names it: its heading, or its label; the intro has neither. */
  const sections = () =>
    [...host.querySelectorAll('section')].map((s) => {
      const heading = s.getAttribute('aria-labelledby');
      return heading
        ? document.getElementById(heading)!.textContent!.trim()
        : s.getAttribute('aria-label') ?? 'intro';
    });
  return { host, text, sections };
}

test('it loads the numbers once, showing their shape while they come, then every section', async () => {
  const stats = fakeStats(STATS);
  const { host, text, sections } = mount([birds], undefined, stats);
  assert(host.querySelector('[aria-busy="true"]'));
  assert(text().includes('Loading the numbers'));
  assertEquals(sections(), ['intro', 'So far', 'Design']);
  await settle();
  assertEquals(stats.loads(), 1);
  assertEquals(host.querySelector('[aria-busy="true"]'), null);
  assertEquals(sections(), [
    'intro',
    'Progress',
    'Recently drawn',
    'How it is made',
    'So far',
    'Design',
  ]);
  assert(text().includes('1 of 2 drawn'));
  assertEquals(host.querySelector('figure a')!.getAttribute('href'), '#birds/001');
});

test('the page is named by its title, each section by its heading, with ids unique on the page', async () => {
  const { host } = mount([birds]);
  await settle();
  const title = document.getElementById(
    host.querySelector('article')!.getAttribute('aria-labelledby')!,
  );
  assertEquals(title!.tagName, 'H1');
  const ids = [...host.querySelectorAll('[id]')].map((el) => el.id);
  assertEquals(new Set(ids).size, ids.length);
});

test('what the app places after the page comes last (the footer)', async () => {
  const { host } = mount([birds]);
  await settle();
  assertEquals(host.querySelector('article')!.lastElementChild!.id, 'placed');
});

test('a failed load says so, and Try again loads it again', async () => {
  const { host, text } = mount(
    [birds],
    undefined,
    fakeStats('HTTP 404 loading stats.json', 'offline', STATS),
  );
  await settle();
  assert(host.querySelector('[role="alert"]'));
  assert(text().includes("Couldn't load the numbers"));
  assert(text().includes('HTTP 404 loading stats.json'));

  const retry = () =>
    [...host.querySelectorAll('button')].find((b) => b.textContent!.includes('Try again'))!;
  retry().click();
  await settle();
  assert(text().includes('offline'));
  retry().click();
  await settle();
  assert(text().includes('1 of 2 drawn'));
});

test('Browse opens the collection last open, else the first, else nowhere', () => {
  const browse = (list: Collection[], active?: Collection) =>
    mount(list, active).host.querySelector('a.btn-primary')!.getAttribute('href');
  assertEquals(browse([birds, sharks], sharks), '#sharks');
  assertEquals(browse([birds, sharks]), '#birds');
  assertEquals(browse([]), '#');
});
