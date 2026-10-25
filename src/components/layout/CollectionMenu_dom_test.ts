// @vitest-environment happy-dom
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { computed, h, nextTick, ref } from 'vue';
import CollectionMenu from './CollectionMenu.vue';
import { makeCollection } from '../../testing/fixtures.ts';
import { mountComponent } from '../../testing/mountComponent.ts';

/** Mount the menu over three collections, Birds current; record what it switches to. */
function mount() {
  const list = ref([
    makeCollection('birds', { label: 'Birds', icon: 'bird' }),
    makeCollection('sharks', { label: 'Sharks', icon: 'shark' }),
    makeCollection('shells', { label: 'Shells', icon: 'shell' }),
  ]);
  const activeId = ref('birds');
  const switched: string[] = [];
  const host = mountComponent(() => h(CollectionMenu), {
    stores: {
      collections: {
        list,
        activeCollection: computed(() => list.value.find((c) => c.id === activeId.value)),
      },
      actions: {
        switchCollection: async (id: string) => {
          switched.push(id);
          activeId.value = id;
        },
      },
    },
  });
  const button = host.querySelector<HTMLButtonElement>('[aria-controls="collection-menu"]')!;
  const items = () => [...host.querySelectorAll<HTMLButtonElement>('#collection-menu button')];
  return { host, button, items, switched };
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
  items()[1].click();
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
  items()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await nextTick();
  await nextTick();
  assertEquals(items(), []);
  assertEquals(document.activeElement, button);

  // With the list already closed, Escape does nothing.
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await nextTick();
  assertEquals(button.getAttribute('aria-expanded'), 'false');
});

test('a press outside closes the list; a press inside does not', async () => {
  const { button, items } = mount();
  button.click();
  await nextTick();
  items()[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await nextTick();
  assertEquals(items().length, 3);

  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await nextTick();
  assertEquals(items(), []);
});
