import { findPage, PAGES } from '../app/pages.ts';
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { computed, h, nextTick, ref } from 'vue';
import CollectionMenu from './CollectionMenu.vue';
import { makeCollection } from '../testing/fixtures.ts';
import type { Page } from './layoutStore.ts';
import { mountComponent } from '../testing/mount.ts';
import { press } from '../testing/events.ts';

/** Mount the menu over three collections, Birds current; record what it switches to. */
function mount(page: Page = 'gallery') {
  const list = ref([
    makeCollection('birds', { label: 'Birds', icon: 'bird' }),
    makeCollection('sharks', { label: 'Sharks', icon: 'shark' }),
    makeCollection('shells', { label: 'Shells', icon: 'shell' }),
  ]);
  const activeId = ref('birds');
  const switched: string[] = [];
  // The app hands it the collections, and switches to the one it asks for.
  const host = mountComponent(
    () =>
      h(CollectionMenu, {
        collections: list.value,
        active: list.value.find((c) => c.id === activeId.value),
        onSelect: (id: string) => {
          switched.push(id);
          activeId.value = id;
        },
      }),
    {
      stores: {
        layout: { pages: PAGES, page: ref(page), currentPage: computed(() => findPage(page)) },
      },
    },
  );
  const button = host.querySelector<HTMLButtonElement>('button[aria-controls]')!;
  /** The list the button opens: what its `aria-controls` names. */
  const menuList = () => document.getElementById(button.getAttribute('aria-controls')!);
  const items = () => [...menuList()?.querySelectorAll<HTMLButtonElement>('button') ?? []];
  const about = () => menuList()?.querySelector<HTMLAnchorElement>('a[href="#about"]') ?? null;
  return { host, button, items, about, switched };
}

test('the button names the current collection and opens the list of all of them', async () => {
  const { button, items } = mount();
  assert(button.textContent!.includes('Birds'));
  assertEquals(button.getAttribute('aria-expanded'), 'false');
  assertEquals(items(), []);

  button.click();
  await nextTick();
  assertEquals(button.getAttribute('aria-expanded'), 'true');
  assertEquals(items().map((b) => b.textContent!.trim()), ['Birds', 'Sharks', 'Shells']);
  assertEquals(items().map((b) => b.getAttribute('aria-current')), ['page', null, null]);
});

test('choosing a collection switches to it, closes the list and returns focus', async () => {
  const { button, items, switched } = mount();
  button.click();
  await nextTick();
  items()[1]!.click();
  await nextTick();
  await nextTick();
  assertEquals(switched, ['sharks']);
  assertEquals(items(), []);
  assert(button.textContent!.includes('Sharks'));
  assertEquals(document.activeElement, button);
});

test('Escape closes the list and returns focus to the button', async () => {
  const { button, items } = mount();
  button.click();
  await nextTick();
  press('Escape', items()[2]!);
  await nextTick();
  await nextTick();
  assertEquals(items(), []);
  assertEquals(document.activeElement, button);

  // With the list already closed, Escape does nothing.
  press('Escape', button);
  await nextTick();
  assertEquals(button.getAttribute('aria-expanded'), 'false');
});

test('a press outside closes the list; a press inside does not', async () => {
  const { button, items } = mount();
  button.click();
  await nextTick();
  items()[0]!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await nextTick();
  assertEquals(items().length, 3);

  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await nextTick();
  assertEquals(items(), []);
});

test('the list ends with the About page; on it, the button says About and no collection is current', async () => {
  const { button, items, about } = mount('about');
  assert(button.textContent!.includes('About'));
  assertEquals(button.querySelectorAll('svg').length, 1); // the chevron, no collection's icon
  button.click();
  await nextTick();
  assertEquals(items().map((b) => b.getAttribute('aria-current')), [null, null, null]);
  assertEquals(about()!.getAttribute('aria-current'), 'page');

  // Following it closes the list (the address change does the rest).
  about()!.click();
  await nextTick();
  assertEquals(items(), []);
});

test('in the gallery, About is in the list but not current', async () => {
  const { button, about } = mount();
  button.click();
  await nextTick();
  assertEquals(about()!.getAttribute('aria-current'), null);
});
