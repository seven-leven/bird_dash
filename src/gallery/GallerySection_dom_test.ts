import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import GallerySection from './GallerySection.vue';
import { at, makeItem } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import type { Item } from '../domain/toCollectionItems.ts';

const drawn = (n: number) =>
  Array.from(
    { length: n },
    (_, i) => makeItem({ commonName: `Bird ${i}`, drawnTime: at(2025, 1, 1) }),
  );

/** The section, with the view store it registers in; what it asks to open is kept. */
function mount(items: Item[], { first = false } = {}) {
  const registered: [string, unknown][] = [];
  const opened: Item[] = [];
  const host = mountComponent(
    () =>
      h(GallerySection, {
        name: 'Ducks',
        items,
        count: '4 of 8 drawn',
        first,
        collection: { icon: 'bird', emoji: '🐦' },
        onOpen: (item: Item) => opened.push(item),
      }),
    {
      stores: {
        view: { registerHeader: (name: string, el: unknown) => registered.push([name, el]) },
      },
    },
  );
  return { host, registered, opened };
}

test('its heading names the section and counts it; a tile per item', () => {
  const { host } = mount(drawn(3));
  const heading = host.querySelector('h2')!;
  assertEquals(heading.children[0].textContent!.trim(), 'Ducks');
  assertEquals(heading.children[1].textContent!.trim(), '4 of 8 drawn');
  assertEquals(host.querySelectorAll('img').length, 3);
});

test('the section registers itself under its name, for the scroll-spy', () => {
  const { host, registered } = mount(drawn(1));
  assertEquals(registered.at(-1)![0], 'Ducks');
  assertEquals(registered.at(-1)![1] === host.querySelector('section'), true);
});

test('a tile asks for the viewer on its drawing', () => {
  const items = drawn(2);
  const { host, opened } = mount(items);
  host.querySelectorAll<HTMLElement>('[role="button"]')[1].click();
  assertEquals(opened.map((i) => i.id), [items[1].id]);
});

test("the first section's first six tiles load at once; the rest, and other sections', wait", () => {
  const loading = (host: HTMLElement) =>
    [...host.querySelectorAll('img')].map((img) => img.getAttribute('loading'));
  assertEquals(loading(mount(drawn(8), { first: true }).host), [
    ...Array(6).fill('eager'),
    'lazy',
    'lazy',
  ]);
  assertEquals(loading(mount(drawn(2)).host), ['lazy', 'lazy']);
});
