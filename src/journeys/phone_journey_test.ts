// J10 On a phone: the sections are a drawer, opened from the header and closed by a tap outside,
// Escape or a choice; below 420px the search is a button that opens it across the row.
// (Layout itself, nothing cut off at 375px, needs a real browser: TEST-OVERHAUL.md, B1.)
// Keeps: phoneWidth (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { press, type } from '../testing/events.ts';

const PHONE = 375;
const sidebar = () => document.querySelector<HTMLElement>('#appSidebar')!;
const isOpen = () => !sidebar().hasAttribute('inert');
const searchBox = () => document.querySelector<HTMLInputElement>('input[role="combobox"]')!;

test('the sections are a drawer: the header opens it, a tap outside closes it', async () => {
  using app = await renderApp({ width: PHONE });
  const toggle = app.control('Show sections');
  assertEquals(toggle.getAttribute('aria-expanded'), 'false');
  assert(!isOpen(), 'closed, and out of the tab order');

  toggle.click();
  await app.until(isOpen, 'the drawer to open');
  assertEquals(app.control('Hide sections').getAttribute('aria-expanded'), 'true');

  app.host.querySelector<HTMLElement>('.fixed.inset-0[aria-hidden="true"]')!.click();
  await app.until(() => !isOpen(), 'a tap outside to close it');
});

test('Escape closes the drawer, and so does choosing a section', async () => {
  using app = await renderApp({ width: PHONE });
  app.control('Show sections').click();
  await app.until(isOpen, 'the drawer to open');
  press('Escape', sidebar());
  await app.until(() => !isOpen(), 'Escape to close it');

  app.control('Show sections').click();
  await app.until(isOpen, 'the drawer to open again');
  app.control(/^Herons/).click();
  await app.until(() => !isOpen(), 'a choice to close it');
});

test('below 420px the search is a button that opens the box across the row', async () => {
  using app = await renderApp({ width: PHONE });
  app.control('Search all collections').click();
  await app.until(() => document.activeElement === searchBox(), 'the box, focused');
  app.control('Done searching').click();
  await app.until(() => app.all('[aria-label="Done searching"]').length === 0, 'the box to close');
});

test('leaving an empty search closes it; one with a query stays, as the filter it is', async () => {
  using app = await renderApp({ width: PHONE });
  app.control('Search all collections').click();
  await app.until(() => document.activeElement === searchBox(), 'the box, focused');
  searchBox().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  await app.until(() => app.all('[aria-label="Done searching"]').length === 0, 'the box to close');

  app.control('Search all collections').click();
  await app.until(() => document.activeElement === searchBox(), 'the box again');
  type(searchBox(), 'grey');
  searchBox().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  await app.until(() => app.all('[aria-label^="Clear filter"]').length, 'the filter');
  assertEquals(app.all('[aria-label="Done searching"]').length, 1);
});
