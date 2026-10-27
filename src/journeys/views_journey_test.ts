// J3 Views: by group and by month; drawn only; the sidebar jumps to a section and marks it.
import { test } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { json } from '../testing/fakes/fakeFetch.ts';

const headings = (app: { all(s: string): HTMLElement[]; text(el: Element): string }) =>
  app.all('main section h2').map((h) => app.text(h));

test('the month view shows the drawings by when they were drawn, newest first', async () => {
  using app = await renderApp();
  const months = app.control('Months view');
  months.click();
  await app.until(() => months.getAttribute('aria-pressed') === 'true', 'the month view');
  assertEquals(headings(app), ['March 2025 1 drawing', 'January 2025 1 drawing']);
  assertEquals(app.control('Families view').getAttribute('aria-pressed'), 'false');
  assertEquals(app.text().includes('Garganey'), false); // only drawings have a month

  app.control('Families view').click();
  await app.until(() => headings(app)[0] === 'Ducks 1 of 2 drawn', 'the family view again');
});

test('drawn only hides what is not drawn yet, and All brings it back', async () => {
  using app = await renderApp();
  const sidebar = app.host.querySelector<HTMLElement>('#appSidebar')!;
  app.control('Drawn 2', sidebar).click();
  await app.until(() => !app.text().includes('Garganey'), 'the undrawn to go');
  assertEquals(app.control('Drawn 2', sidebar).getAttribute('aria-pressed'), 'true');
  assertStringIncludes(app.text(), 'Mallard');

  app.control('All 3', sidebar).click();
  await app.until(() => app.text().includes('Garganey'), 'the undrawn to come back');
});

test('below the sidebar breakpoint the same filter sits above the grid', async () => {
  using app = await renderApp();
  const main = app.host.querySelector<HTMLElement>('main')!;
  app.control('Drawn 2', main).click();
  await app.until(() => !app.text().includes('Garganey'), 'the undrawn to go');
  app.control('Drawn 2', main).click(); // choosing what is already chosen changes nothing
  await app.until(() => true, 'a moment');
  assertEquals(app.text().includes('Garganey'), false);
});

test('the sidebar jumps to a section and marks it as the one in view', async () => {
  using app = await renderApp();
  const herons = app.control(/^Herons/);
  herons.click();
  await app.until(() => herons.getAttribute('aria-current') === 'true', 'Herons to be marked');
  assertEquals(app.control(/^Ducks/).getAttribute('aria-current'), null);
});

test('a drawing dated after this month still counts in its month', async () => {
  const ahead = { id: '001', name: 'Mallard', drawn: '2999-01-10' }; // a date typed ahead
  using app = await renderApp({ routes: { '/lists/birds.json': json({ Ducks: [ahead] }) } });
  app.control('Months view').click();
  await app.until(() => headings(app).length === 1, 'the month');
  assertEquals(headings(app), ['January 2999 1 drawing']);
});
