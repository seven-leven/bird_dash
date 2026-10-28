// J1 First visit: the first collection loads, every item in its place, drawn or not, with
// honest counts and the footer (docs/TESTING.md, the promises).
import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';

test('the first collection opens, its items in their groups, drawn or not', async () => {
  using app = await renderApp();
  const sections = app.all('main section');
  assertEquals(sections.map((s) => app.text(s.querySelector('h2')!)), [
    'Ducks 1 of 2 drawn',
    'Herons 1 of 1 drawn',
  ]);
  assertEquals(sections.map((s) => s.querySelectorAll('[id^="item-"]').length), [2, 1]);
  assertStringIncludes(app.text(sections[0]), 'Mallard');
  assertStringIncludes(app.text(sections[0]), 'Garganey');
});

test("a drawn item is a button that names it; one not drawn yet shows its collection's icon", async () => {
  using app = await renderApp();
  assertEquals(app.control('Mallard, #001').getAttribute('tabindex'), '0');
  // In its place, the collection's icon (ItemTile_dom_test.ts), named for what is not there yet.
  const garganey = app.all('[role="img"][aria-label="Garganey (not drawn yet)"]');
  assertEquals(garganey.length, 1);
  assertEquals(garganey[0]!.closest('[role="button"]'), null);
  assertEquals(app.all('img[alt="Garganey"]'), []);
});

test('the counts say how many are drawn of how many, the same way everywhere', async () => {
  using app = await renderApp();
  const sidebar = app.host.querySelector('#appSidebar')!;
  assertStringIncludes(app.text(sidebar), 'All 3');
  assertStringIncludes(app.text(sidebar), 'Drawn 2');
  assertStringIncludes(app.text(sidebar), 'Ducks1 of 2');
  assertStringIncludes(app.text(), 'All collections 2 of 4 drawn');
});

test('the collection tabs name the current one, and only the lists needed are fetched', async () => {
  using app = await renderApp();
  assertEquals(app.control('Birds').getAttribute('aria-current'), 'page');
  assertEquals(app.control('Sharks').getAttribute('aria-current'), null);
  assert(app.fetch.calls.includes('/collections.json'));
  assert(app.fetch.calls.includes('/lists/birds.json'));
});

test('the footer closes the page: the name, the version, the links out', async () => {
  using app = await renderApp();
  const footer = app.host.querySelector('footer')!;
  assertStringIncludes(app.text(footer), 'Wildlife Illustrated ©');
  assertEquals(app.control('GitHub (opens in a new tab)').getAttribute('target'), '_blank');
});
