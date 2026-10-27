// J7 About: the numbers and the newest drawings are the archive's, as the build works them out
// (stats.json); a drawing links into the viewer; a failure says so and offers to try again.
import { test } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { fails, inTurn, json } from '../testing/fakes/fakeFetch.ts';
import { archiveStats } from '../testing/scenarios/archive.ts';

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

test("the About tab opens the page, with the archive's numbers", async () => {
  using app = await renderApp();
  app.control('About', app.host.querySelector('nav[aria-label="Collections"]')!).click();
  await app.until(() => app.text().includes('Progress'), 'the numbers');
  const progress = app.host.querySelector('[aria-labelledby="about-progress"]')!;
  assertStringIncludes(app.text(progress), '2 of 4 drawn');
  assertStringIncludes(app.text(progress), 'The latest drawing is the Grey Heron, in March 2025.');
  assertEquals(app.all('[aria-labelledby="about-progress"] li').length, 2); // a card each
});

test('the first and the newest drawings are shown, and each opens the viewer', async () => {
  using app = await renderApp({ at: 'about' });
  await app.until(() => app.text().includes('Recently drawn'), 'the newest drawings');
  assertStringIncludes(app.text(), 'The first drawing');
  const recent = app.host.querySelector('[aria-labelledby="about-recent"]')!;
  // Newest first, each with its month.
  assertEquals(app.all('[aria-labelledby="about-recent"] li').map((li) => app.text(li)), [
    'Grey HeronMarch 2025',
    'MallardJanuary 2025',
  ]);

  app.control(/Grey Heron/, recent).click();
  await app.until(dialog, 'the viewer');
  assertEquals(dialog()!.getAttribute('aria-label'), 'Grey Heron, #003');
});

test('a collection card opens that collection', async () => {
  using app = await renderApp({ at: 'about' });
  await app.until(() => app.text().includes('Progress'), 'the numbers');
  app.control(/^Sharks/, app.host.querySelector('[aria-labelledby="about-progress"]')!).click();
  await app.until(() => location.hash === '#sharks', 'the sharks');
  await app.until(() => app.text().includes('Nothing drawn yet'), 'the sharks to show');
});

test('when the numbers fail to load, the page says so and tries again', async () => {
  using app = await renderApp({
    at: 'about',
    routes: { '/stats.json': inTurn(fails(new Error('offline')), json(archiveStats())) },
  });
  await app.until(() => app.text().includes("Couldn't load the numbers"), 'the failure');
  app.control('Try again').click();
  await app.until(() => app.text().includes('Progress'), 'the numbers, the second time');
});
