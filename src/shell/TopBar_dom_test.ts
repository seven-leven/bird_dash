import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import TopBar from './TopBar.vue';
import { makeCollection } from '../testing/fixtures.ts';
import { appStores } from '../testing/appStores.ts';
import { mountComponent } from '../testing/mount.ts';
import { settle } from '../testing/settle.ts';

// The journeys (src/journeys/) drive the header in the whole app; this covers what the app hands
// it (the collections, and what it places in it) and the moment before any collection is known,
// which the app never draws (it waits for one: App.vue).

const birds = makeCollection('birds', { label: 'Birds' });
const sharks = makeCollection('sharks', { label: 'Sharks' });

test('with no collection yet, the logo leads to the top', () => {
  const host = mountComponent(() => h(TopBar, { collections: [] }), { stores: appStores() });
  assertEquals(
    host.querySelector('a[aria-label="Wildlife Illustrated"]')!.getAttribute('href'),
    '#',
  );
});

test('a tab per collection, the current one marked; choosing one asks the app for it', () => {
  const chosen: string[] = [];
  const host = mountComponent(
    () =>
      h(TopBar, {
        collections: [birds, sharks],
        active: birds,
        onSelect: (id: string) => chosen.push(id),
      }),
    { stores: appStores() },
  );
  const tabs = [...host.querySelectorAll<HTMLButtonElement>('nav[aria-label="Collections"] button')]
    .filter((b) => !b.hasAttribute('aria-controls'));
  assertEquals(tabs.map((b) => b.getAttribute('aria-current')), ['page', null]);
  tabs[1]!.click();
  assertEquals(chosen, ['sharks']);
  assertEquals(
    host.querySelector('a[aria-label="Wildlife Illustrated"]')!.getAttribute('href'),
    '#birds',
  );
});

test('the search box and the view switch go where the app places them', () => {
  const host = mountComponent(
    () =>
      h(TopBar, { collections: [birds] }, {
        search: () => h('input', { id: 'placed-search' }),
        view: () => h('div', { id: 'placed-view' }),
      }),
    { stores: appStores() },
  );
  const header = host.querySelector('header')!;
  assertEquals(header.querySelector('#placed-search') !== null, true);
  assertEquals(header.querySelector('#placed-view') !== null, true);
});

test('on a phone the search opens across the row; leaving it empty closes it, a query keeps it', async () => {
  const host = mountComponent(
    () =>
      h(TopBar, { collections: [birds] }, {
        search: () => [h('input', { id: 'box' }), h('button', { id: 'clear' })],
      }),
    { stores: appStores() },
  );
  const closeButton = () => host.querySelector('button[aria-label="Done searching"]');
  host.querySelector<HTMLButtonElement>('button[aria-label="Search all collections"]')!.click();
  await settle();
  const box = host.querySelector<HTMLInputElement>('#box')!;
  assertEquals(document.activeElement === box, true, 'opening it puts the cursor in it');
  const leave = (to: Element | null) =>
    box.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));

  leave(host.querySelector('#clear')); // within the search: still open
  await settle();
  assertEquals(closeButton() !== null, true);
  box.value = 'heron';
  leave(document.body); // with a query, it stays as the filter it is
  await settle();
  assertEquals(closeButton() !== null, true);
  box.value = '';
  leave(document.body);
  await settle();
  assertEquals(closeButton(), null);
});
