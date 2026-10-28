// The frame: where it places each feature, and the little it does itself (the search's filter bar,
// the drawer's backdrop, a page opening at its top). On the app's real stores over the fixture
// archive; the journeys (src/journeys/) drive the same frame through whole visits.
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h, ref } from 'vue';
import AppShell from './AppShell.vue';
import { appStores } from '../testing/appStores.ts';
import { fakeFetch } from '../testing/fakes/fakeFetch.ts';
import { archiveRoutes } from '../testing/scenarios/archive.ts';
import { mountComponent } from '../testing/mount.ts';
import { settle } from '../testing/settle.ts';
import { SEARCH_DELAY } from '../search/searchStore.ts';

/** The frame on the real stores, the first collection loaded; `fetch` is put back after the test. */
async function mount(overrides: Partial<ReturnType<typeof appStores>> = {}) {
  using _fetch = fakeFetch(archiveRoutes());
  const stores = { ...appStores(), ...overrides };
  await stores.collections.init();
  const host = mountComponent(() => h(AppShell), { stores });
  await settle();
  return { host, stores, main: () => host.querySelector('main')! };
}

/** The scroll container inside <main>, where the gallery or a page and the footer sit. */
const scroller = (main: Element) => main.lastElementChild as HTMLElement;

test('the search box sits in the top bar, the one row along the top', async () => {
  const { host } = await mount();
  const header = host.querySelector('header')!;
  assert(header.querySelector('input[role="combobox"]'), 'the search box is in the header');
});

test('the gallery has its sidebar, and the footer comes after its drawings', async () => {
  const { host, main } = await mount();
  assert(host.querySelector('#appSidebar'));
  const gallery = scroller(main()).firstElementChild!;
  assert(gallery.querySelector('section'), 'the gallery shows its sections');
  assertEquals(gallery.lastElementChild!.tagName, 'FOOTER');
});

test('a page takes the place of the gallery and its sidebar, the footer after it too', async () => {
  using _fetch = fakeFetch(archiveRoutes());
  const { host, stores, main } = await mount();
  stores.layout.showPage('about');
  // The page's code loads when it is first shown.
  for (let i = 0; i < 100 && !scroller(main()).querySelector('article'); i++) await settle();
  assertEquals(host.querySelector('#appSidebar'), null);
  const page = scroller(main()).querySelector('article')!;
  assertEquals(page.getAttribute('aria-labelledby'), 'about-title');
  assertEquals(page.lastElementChild!.tagName, 'FOOTER');
});

test('a page opens at its top', async () => {
  using _fetch = fakeFetch(archiveRoutes());
  const { stores, main } = await mount();
  const scroll = scroller(main());
  scroll.scrollTop = 120;
  stores.layout.showPage('about');
  await settle();
  assertEquals(scroll.scrollTop, 0);
});

test('while searching, a bar above the grid says what filters it, and clears it', async () => {
  const { host, stores } = await mount();
  const bar = () => host.querySelector<HTMLButtonElement>('button[aria-label^="Clear filter"]');
  assertEquals(bar(), null);
  stores.search.setQuery('grey');
  await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY + 20));
  await settle();
  assertEquals(bar()!.getAttribute('aria-label'), 'Clear filter grey');
  assertEquals(bar()!.textContent!.replace(/\s+/g, ' ').trim(), '1 match, 1 drawn for “grey”');
  // While the results are open over it, it keeps its place unseen: one ✕ at a time.
  assert(bar()!.parentElement!.classList.contains('invisible'));
  stores.search.setDropdown(false);
  await settle();
  assert(!bar()!.parentElement!.classList.contains('invisible'));
  // In the month view it counts drawings alone.
  stores.view.setViewMode('month');
  await settle();
  assertEquals(bar()!.textContent!.replace(/\s+/g, ' ').trim(), '1 match for “grey”');

  bar()!.click();
  await settle();
  assertEquals([stores.search.query.value, bar()], ['', null]);
});

test('on a narrow screen the sidebar is a drawer, with a backdrop that closes it', async () => {
  const stores = appStores();
  const { host, stores: s } = await mount({ layout: { ...stores.layout, isNarrow: ref(true) } });
  const backdrop = () => host.querySelector<HTMLElement>('.backdrop-blur-sm[aria-hidden="true"]');
  assert(backdrop()!.className.includes('invisible'), 'hidden while the drawer is shut');
  s.layout.toggleSidebar();
  await settle();
  assert(backdrop()!.className.includes('visible'));
  backdrop()!.click();
  await settle();
  assertEquals(s.layout.sidebarOpen.value, false);
});

test('a wide screen has no backdrop', async () => {
  const { host } = await mount();
  assertEquals(host.querySelector('.backdrop-blur-sm[aria-hidden="true"]'), null);
});
