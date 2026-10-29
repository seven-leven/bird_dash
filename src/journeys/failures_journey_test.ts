// J9 Failures: a failure says what failed and offers to try again. If the list of collections
// fails, nothing can be shown; if one collection's list fails, the rest still works.
// Keeps: failures (docs/TESTING.md, "Promises").
import { test, vi } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { fails, json, status } from '../testing/fakes/fakeFetch.ts';

/** Stand in for `location.reload`, which happy-dom cannot do, and count the calls. */
function reloads() {
  const reload = vi.spyOn(location, 'reload').mockImplementation(() => {});
  return { count: () => reload.mock.calls.length, [Symbol.dispose]: () => reload.mockRestore() };
}

test('when the collections fail to load, the page says so and offers to try again', async () => {
  using reload = reloads();
  using app = await renderApp({ routes: { '/collections.json': status(500) } });
  const alert = app.host.querySelector('[role="alert"]')!;
  assertStringIncludes(app.text(alert), "Couldn't load the gallery");
  assertEquals(app.all('main').length, 0);

  app.control('Try again').click();
  assertEquals(reload.count(), 1);
});

test('when one collection fails, it says which, and the others still work', async () => {
  using reload = reloads();
  using app = await renderApp({ routes: { '/lists/sharks.json': fails(new Error('offline')) } });
  assertStringIncludes(app.text(), 'Mallard');

  app.control('Sharks').click();
  await app.until(() => app.text().includes("Couldn't load Sharks"), 'the failure');
  app.control('Try again').click();
  assertEquals(reload.count(), 1);

  app.control('Birds').click();
  await app.until(() => app.text().includes('Mallard'), 'the birds, still there');
});

test('an archive with no collections says so, rather than showing an empty page', async () => {
  using app = await renderApp({ routes: { '/collections.json': json([]) } });
  assertStringIncludes(app.text(app.host.querySelector('[role="alert"]')!), 'No collections');
});

test('a list not of its shape says which field is wrong, and the others still work', async () => {
  using app = await renderApp({
    routes: { '/lists/sharks.json': json({ Requiem: [{ id: '001', sci: 'Carcharhinus' }] }) },
  });
  app.control('Sharks').click();
  await app.until(() => app.text().includes("Couldn't load Sharks"), 'the failure');
  assertStringIncludes(app.text(), 'Sharks is not as expected: Requiem[0].name is missing');
  app.control('Birds').click();
  await app.until(() => app.text().includes('Mallard'), 'the birds, still there');
});
