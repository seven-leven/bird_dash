// The box as a combobox: what it tells a screen reader, and what its keys and buttons ask of the
// search store and the app. The search journey (src/journeys/search_journey_test.ts) drives the
// same through the whole app; here the box stands alone, on a real search store over the fixture
// archive, and the app's action is a stand-in that keeps what it is asked.
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h, ref } from 'vue';
import SearchBox from './SearchBox.vue';
import { createSearchStore, SEARCH_DELAY } from './searchStore.ts';
import { type Item, toCollection, toCollectionItems } from '../domain/toCollectionItems.ts';
import { archiveCollections, archiveLists } from '../testing/scenarios/archive.ts';
import { mountComponent, runInScope } from '../testing/mount.ts';
import { press, type } from '../testing/events.ts';
import { settle } from '../testing/settle.ts';

function mount() {
  const collections = archiveCollections().map((entry) => toCollection(entry, '/'));
  const lists = archiveLists();
  const itemsByCollection = Object.fromEntries(
    collections.map((c) => [c.id, toCollectionItems(c, lists[c.id as keyof typeof lists])]),
  );
  const search =
    runInScope(() => createSearchStore({ collections: ref(collections), itemsByCollection })).value;
  const picked: [string, string][] = [];
  const host = mountComponent(() => h(SearchBox), {
    stores: {
      search,
      actions: {
        selectGlobalResult: async (id: string, item: Item) => {
          picked.push([id, item.commonName]);
        },
      },
    },
  });
  const input = host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  return {
    host,
    input,
    search,
    picked,
    /** Type, and wait for the results to follow (they wait for typing to pause). */
    async typeAndWait(text: string) {
      type(input, text);
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY + 20));
      await settle();
    },
    announced: () => host.querySelector('[role="status"]')!.textContent,
    expanded: () => input.getAttribute('aria-expanded'),
    clearButton: () => host.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]'),
  };
}

test('empty: the shortcut hint, no clear button, and the results closed', () => {
  const { host, input, expanded, announced, clearButton } = mount();
  assertEquals(expanded(), 'false');
  assertEquals(input.getAttribute('aria-controls'), 'global-search-listbox');
  assert(host.querySelector('kbd')!.textContent!.includes('K'));
  assertEquals(clearButton(), null);
  assertEquals(announced(), '');
});

test('typing opens the results and announces how many there are', async () => {
  const { host, typeAndWait, expanded, announced, clearButton } = mount();
  await typeAndWait('grey');
  assertEquals(expanded(), 'true');
  assertEquals(announced(), '2 matches');
  assertEquals(host.querySelectorAll('[role="option"]').length, 2);
  assert(clearButton());
  assertEquals(host.querySelector('kbd[aria-label="Escape"]') !== null, true);
});

test('↓ makes the first result the active option; ↵ picks it, and the results close', async () => {
  const { input, typeAndWait, picked, expanded } = mount();
  await typeAndWait('mallard');
  assertEquals(input.getAttribute('aria-activedescendant'), null);
  assertEquals(press('ArrowDown', input).defaultPrevented, true);
  await settle();
  assertEquals(input.getAttribute('aria-activedescendant'), 'search-result-0');
  press('Enter', input);
  await settle();
  assertEquals(picked, [['birds', 'Mallard']]);
  assertEquals(expanded(), 'false');
});

test("↵ with no result in focus closes the results and keeps the query, the grid's filter", async () => {
  const { input, typeAndWait, picked, expanded, search } = mount();
  await typeAndWait('grey');
  press('Enter', input);
  await settle();
  assertEquals([picked.length, expanded(), search.query.value], [0, 'false', 'grey']);
});

test('Escape closes the results; focusing the box again opens them while there is a query', async () => {
  const { input, typeAndWait, expanded } = mount();
  await typeAndWait('grey');
  press('Escape', input);
  await settle();
  assertEquals(expanded(), 'false');
  input.dispatchEvent(new FocusEvent('focus'));
  await settle();
  assertEquals(expanded(), 'true');
});

test('focusing an empty box opens nothing', async () => {
  const { input, expanded, search } = mount();
  input.dispatchEvent(new FocusEvent('focus'));
  await settle();
  assertEquals([expanded(), search.dropdownOpen.value], ['false', false]);
});

test('the clear button empties the box, closes the results and keeps the focus there', async () => {
  const { input, typeAndWait, expanded, search, clearButton } = mount();
  await typeAndWait('grey');
  clearButton()!.click();
  await settle();
  assertEquals([search.query.value, expanded()], ['', 'false']);
  assertEquals(document.activeElement === input, true);
  assertEquals(clearButton(), null);
});

test('a search with no match is announced, and no option is active', async () => {
  const { input, typeAndWait, announced } = mount();
  await typeAndWait('zebra');
  press('ArrowDown', input);
  await settle();
  assertEquals(announced(), 'No matches found');
  assertEquals(input.getAttribute('aria-activedescendant'), null);
});

test('a click outside the box closes the results', async () => {
  const { typeAndWait, expanded } = mount();
  await typeAndWait('grey');
  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await settle();
  assertEquals(expanded(), 'false');
});

test('Ctrl+K finds the box from anywhere on the page', () => {
  const { input } = mount();
  press('k', document.body, { ctrlKey: true });
  assertEquals(document.activeElement === input, true);
});
