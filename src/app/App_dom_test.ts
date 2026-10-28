// App.vue makes the stores, provides them, and starts the router once the collections are known.
// The journeys (src/journeys/) run it whole; this covers what they wait past or never look at:
// the loading screen, and the accent following the collection on screen.
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h } from 'vue';
import App from './App.vue';
import { fakeFetch } from '../testing/fakes/fakeFetch.ts';
import { archiveRoutes } from '../testing/scenarios/archive.ts';
import { mountComponent } from '../testing/mount.ts';
import { renderApp } from '../testing/renderApp.ts';
import { settle } from '../testing/settle.ts';

test("while the collections load: the page's shape in grey, and a word for screen readers alone", async () => {
  // collections.json never answers.
  using _fetch = fakeFetch({ ...archiveRoutes(), '/collections.json': new Promise(() => {}) });
  const host = mountComponent(() => h(App));
  await settle();
  const busy = host.querySelector('[aria-busy="true"]')!;
  assert(busy, 'the loading screen is busy');
  assertEquals(busy.querySelector('[role="status"]')!.textContent, 'Loading the gallery');
  assertEquals(busy.querySelector('[role="status"]')!.className, 'sr-only');
  assertEquals(busy.querySelectorAll('.tile-grid > *').length, 10);
  assertEquals(host.querySelector('header, main'), null);
});

test("the accent is the collection on screen's, or the default where it names none", async () => {
  using app = await renderApp();
  assertEquals(document.documentElement.dataset.accent, 'teal'); // Birds names no accent
  app.control('Sharks').click();
  await app.until(() => document.documentElement.dataset.accent === 'sky', "the sharks' accent");
});
