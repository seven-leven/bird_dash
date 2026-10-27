// J4 Search: typing finds items by any name, in every collection, grouped by collection; long
// groups fold; the keyboard alone picks one, which is shown in its collection.
import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { press, type } from '../testing/events.ts';
import { json } from '../testing/fakes/fakeFetch.ts';

const searchBox = () => document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const listbox = () => document.querySelector<HTMLElement>('#global-search-listbox');

test('typing finds items in every collection, grouped by collection', async () => {
  using app = await renderApp();
  type(searchBox(), 'grey');
  await app.until(() => listbox(), 'the results');
  assertEquals(searchBox().getAttribute('aria-expanded'), 'true');
  const groups = app.all('#global-search-listbox [role="group"]');
  assertEquals(groups.map((g) => g.getAttribute('aria-label')), ['Birds', 'Sharks']);
  assertStringIncludes(app.text(groups[0]), 'Grey Heron');
  assertStringIncludes(app.text(groups[1]), 'Grey Reef Shark');
  assertStringIncludes(app.text(groups[1]), 'Not drawn yet');
  assertEquals(app.text(app.host.querySelector('[role="status"][aria-live]')!), '2 matches');
});

test('a scientific name finds the item too, and the grid is filtered while searching', async () => {
  using app = await renderApp();
  type(searchBox(), 'querquedula');
  await app.until(() => listbox(), 'the results');
  assertStringIncludes(app.text(listbox()!), 'Garganey');
  await app.until(() => !app.text().includes('Mallard'), 'the grid to be filtered');

  const chip = app.control(/^Clear filter querquedula/);
  chip.click();
  await app.until(() => app.text().includes('Mallard'), 'the grid to be whole again');
  assertEquals(searchBox().value, '');
});

test('↓ and ↵ pick a result: its collection opens and its tile is ringed', async () => {
  using app = await renderApp({ at: 'sharks' });
  type(searchBox(), 'grey');
  await app.until(() => listbox(), 'the results');
  press('ArrowDown', searchBox());
  press('ArrowDown', searchBox());
  press('ArrowUp', searchBox());
  await app.until(() => searchBox().getAttribute('aria-activedescendant'), 'a result in focus');
  const active = document.getElementById(searchBox().getAttribute('aria-activedescendant')!)!;
  assertStringIncludes(app.text(active), 'Grey Heron');
  assertEquals(active.getAttribute('aria-selected'), 'true');

  press('Enter', searchBox());
  await app.until(() => location.hash === '#birds', 'the birds to open');
  await app.until(() => document.getElementById('item-003'), 'the tile');
  assert(document.getElementById('item-003')!.classList.contains('ring-2'), 'the tile is ringed');
  assertEquals(listbox(), null);
});

test('↵ with no result in focus closes the results and keeps the page', async () => {
  using app = await renderApp();
  type(searchBox(), 'grey');
  await app.until(() => listbox(), 'the results');
  press('Enter', searchBox());
  await app.until(() => !listbox(), 'the results to close');
  assertEquals(location.hash, '');
});

test('a click picks a result too, and Escape closes the results', async () => {
  using app = await renderApp({ at: 'sharks' });
  type(searchBox(), 'mallard');
  await app.until(() => listbox(), 'the results');
  press('Escape', searchBox());
  await app.until(() => !listbox(), 'the results to close');
  searchBox().dispatchEvent(new FocusEvent('focus'));
  await app.until(() => listbox(), 'the results to open again on focus');

  app.control(/Mallard/, listbox()!).click();
  await app.until(() => location.hash === '#birds', 'the birds to open');
});

test('a search with no match says so, in the results and in the grid', async () => {
  using app = await renderApp();
  type(searchBox(), 'zebra');
  await app.until(() => app.text().includes("No matches for 'zebra'"), 'the empty results');
  await app.until(() => app.all('main section').length === 0, 'the grid to empty');
  assertEquals(app.text(app.host.querySelector('[role="status"][aria-live]')!), 'No matches found');

  app.control('Clear search', app.host.querySelector('main')!).click();
  await app.until(() => app.all('main section').length === 2, 'the grid to come back');
});

test('the clear button and Ctrl+K: the box empties, and the shortcut finds it', async () => {
  using app = await renderApp();
  type(searchBox(), 'grey');
  await app.until(() => listbox(), 'the results');
  app.control('Clear search', app.host.querySelector('header')!).click();
  await app.until(() => !listbox(), 'the results to close');
  assertEquals(searchBox().value, '');

  searchBox().blur();
  const shortcut = press('k', window, { ctrlKey: true });
  assert(shortcut.defaultPrevented);
  assertEquals(document.activeElement, searchBox());
});

test('a long group is folded, and opens in place', async () => {
  const ducks = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1).padStart(3, '0'),
    name: `Duck ${i + 1}`,
    sci: 'Anas',
    drawn: '2025-01-10',
  }));
  using app = await renderApp({ routes: { '/lists/birds.json': json({ Ducks: ducks }) } });
  type(searchBox(), 'duck');
  await app.until(() => listbox(), 'the results');
  assertEquals(app.all('#global-search-listbox [role="option"]').length, 7);

  app.control('Show 5 more in Birds').click();
  await app.until(
    () => app.all('#global-search-listbox [role="option"]').length === 12,
    'the group to open',
  );
});

test('a result shows its Dhivehi name, and why it matched when only its group did', async () => {
  const dhivehi = { id: '001', name: 'Mallard', sci: 'Anas platyrhynchos', dhiv_script: 'ދޫނި' };
  using app = await renderApp({
    routes: { '/lists/birds.json': json({ Ducks: [{ ...dhivehi, drawn: '2025-01-10' }] }) },
  });
  type(searchBox(), 'mallard');
  await app.until(() => listbox(), 'the results');
  const thaana = listbox()!.querySelector('[dir="rtl"]')!;
  assertEquals(app.text(thaana), 'ދޫނި');

  type(searchBox(), 'requiem'); // the sharks' family: no name matches it
  await app.until(() => app.text(listbox() ?? document.body).includes('in Requiem'), 'the why');
});

test('the pointer moves the focus through the results as the arrows do', async () => {
  using app = await renderApp();
  type(searchBox(), 'grey');
  await app.until(() => listbox(), 'the results');
  const shark = app.control(/Grey Reef Shark/, listbox()!);
  shark.dispatchEvent(new MouseEvent('mouseenter'));
  await app.until(() => shark.getAttribute('aria-selected') === 'true', 'the hovered result');
  assertEquals(searchBox().getAttribute('aria-activedescendant'), shark.id);
});

test('a new query folds the groups again', async () => {
  const ducks = Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1).padStart(3, '0'),
    name: `Duck ${i + 1}`,
  }));
  using app = await renderApp({ routes: { '/lists/birds.json': json({ Ducks: ducks }) } });
  type(searchBox(), 'duck');
  await app.until(() => listbox(), 'the results');
  app.control('Show 5 more in Birds').click();
  await app.until(() => app.all('[role="option"]').length === 12, 'the group to open');
  type(searchBox(), 'duc');
  await app.until(() => app.all('[role="option"]').length === 7, 'the group to fold again');
});

test('on a Mac the shortcut hint shows ⌘ instead of Ctrl', async () => {
  const platform = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(navigator), 'platform')!;
  Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
  try {
    using app = await renderApp();
    assertEquals(app.text(app.host.querySelector('kbd')!), 'K');
  } finally {
    delete (navigator as { platform?: string }).platform;
    Object.defineProperty(Object.getPrototypeOf(navigator), 'platform', platform);
  }
});

test('in the month view, the filter counts drawings', async () => {
  using app = await renderApp();
  app.control('Months view').click();
  type(searchBox(), 'grey');
  await app.until(() => app.all('[aria-label^="Clear filter"]').length, 'the filter');
  await app.until(() => app.all('main section').length === 1, 'the grid to be filtered');
  assertEquals(app.text(app.control(/^Clear filter/)), '1 match for “grey”');
});
