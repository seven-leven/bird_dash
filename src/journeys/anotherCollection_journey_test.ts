// J2 Another collection: by a tab or the menu; the accent, the address and the sidebar follow,
// and a collection with nothing drawn says so.
import { test } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { json } from '../testing/fakes/fakeFetch.ts';
import { archiveCollections } from '../testing/scenarios/archive.ts';

test('a tab opens the collection: the address, the accent and the sidebar follow', async () => {
  using app = await renderApp();
  assertEquals(document.documentElement.dataset.accent, 'teal');

  app.control('Sharks').click();
  await app.until(() => location.hash === '#sharks', 'the address to name the collection');
  await app.until(() => app.text().includes('Nothing drawn yet'), 'the sharks to load');
  assertEquals(app.control('Sharks').getAttribute('aria-current'), 'page');
  assertEquals(app.control('Birds').getAttribute('aria-current'), null);
  assertEquals(document.documentElement.dataset.accent, 'sky');
  assertStringIncludes(app.text(app.host.querySelector('#appSidebar')!), 'Sharks');
});

test("a collection with nothing drawn says so, and can still show what's planned", async () => {
  using app = await renderApp({ at: 'sharks' });
  assertStringIncludes(app.text(), 'Nothing drawn yet');
  assertStringIncludes(app.text(), '1 planned');
  app.control("Show what's planned").click();
  await app.until(() => app.text().includes('Grey Reef Shark'), 'the planned list');
  assertEquals(app.all('main section h2').map((h) => app.text(h)), ['Requiem 0 of 1 drawn']);

  // Back in the first collection and out again, the list is folded away once more.
  app.control('Birds').click();
  await app.until(() => app.text().includes('Mallard'), 'the birds');
  app.control('Sharks').click();
  await app.until(() => app.text().includes('Nothing drawn yet'), 'the sharks, folded again');
});

test('the collection menu lists every collection and the pages, and switches too', async () => {
  using app = await renderApp();
  const menu = app.control('Birds, choose a collection');
  menu.click();
  await app.until(() => menu.getAttribute('aria-expanded') === 'true', 'the menu to open');
  const list = app.host.querySelector('#collection-menu')!;
  assertStringIncludes(app.text(list), 'Sharks');
  assertStringIncludes(app.text(list), 'About');

  app.control('Sharks', list).click();
  await app.until(() => location.hash === '#sharks', 'the menu to switch collection');
  assertEquals(app.control('Sharks, choose a collection').getAttribute('aria-expanded'), 'false');
});

test('the logo leads back to the current collection', async () => {
  using app = await renderApp({ at: 'about' });
  assertEquals(app.control('Wildlife Illustrated').getAttribute('href'), '#birds');
});

test('past four collections the tabs give way to the menu', async () => {
  const more = ['shells', 'moths', 'frogs'].map((id) => ({
    ...archiveCollections()[0],
    id,
    label: id,
  }));
  using app = await renderApp({
    routes: { '/collections.json': json([...archiveCollections(), ...more]) },
  });
  const nav = app.host.querySelector<HTMLElement>('nav[aria-label="Collections"]')!;
  const tabs = app.all('button').filter((b) => app.text(b) === 'Birds');
  assertEquals(tabs.length, 0);
  assertEquals(app.control('Birds, choose a collection', nav).tagName, 'BUTTON');
});
