import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { h } from 'vue';
import ItemTile from './ItemTile.vue';
import { at, makeItem } from '../testing/fixtures.ts';
import type { Item } from '../domain/toCollectionItems.ts';
import { mountComponent } from '../testing/mount.ts';

const drawn = makeItem({
  itemId: '042',
  commonName: 'Greater Sand-Plover',
  drawnTime: at(2025, 10, 1),
  imageUrl: '/thumb/birds/042.webp',
  meta: { dhiv_script: 'ވަލު ބޮނޑަނަ' },
});
const teal = { itemId: '005', commonName: 'Green-winged Teal', isDrawn: false };
const undrawn = makeItem(teal);
const birds = { icon: 'bird', emoji: '🐦' };

/** Mount a tile and record what it emits. */
function mount(props: { item: Item; eager?: boolean; collection?: typeof birds }) {
  const clicked: Item[] = [];
  const host = mountComponent(() =>
    h(ItemTile, {
      collection: birds,
      ...props,
      onCardClick: (item: Item) => clicked.push(item),
    })
  );
  const tile = host.querySelector<HTMLElement>(`#item-${props.item.itemId}`)!;
  return {
    tile,
    clicked,
    img: tile.querySelector('img')!,
    /** What stands in for a drawing: the collection's icon. */
    stand: () => tile.querySelector<HTMLElement>('[role="img"]'),
  };
}

const key = (el: HTMLElement, k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
};

test('a drawn tile is a button named after the drawing, and opens it by click, Enter or Space', () => {
  const { tile, clicked } = mount({ item: drawn });
  assertEquals(tile.getAttribute('role'), 'button');
  assertEquals(tile.getAttribute('tabindex'), '0');
  assertEquals(tile.getAttribute('aria-label'), 'Greater Sand-Plover, #042');

  tile.click();
  key(tile, 'Enter');
  const space = key(tile, ' ');
  assert(space.defaultPrevented, 'Space must not also scroll the page');
  assertEquals(clicked.map((i) => i.itemId), ['042', '042', '042']);
});

test('the caption sits under the image: Dhivehi first, then English, both shown', () => {
  const { tile, img } = mount({ item: drawn });
  const caption = tile.lastElementChild as HTMLElement;
  assert(!caption.contains(img), 'the names are not laid over the drawing');
  const [dhivehi, english] = [...caption.children] as HTMLElement[];
  assertEquals(dhivehi.textContent?.trim(), 'ވަލު ބޮނޑަނަ');
  assertEquals(dhivehi.getAttribute('dir'), 'rtl');
  assertEquals(english.textContent?.trim(), 'Greater Sand-Plover');
  assertStringIncludes(tile.className, 'bg-white'); // paper
});

test('an undrawn tile is not a button, says so to screen readers, and does nothing', () => {
  const { tile, clicked, img, stand } = mount({ item: undrawn });
  assertEquals(tile.getAttribute('role'), null);
  assertEquals(tile.getAttribute('tabindex'), null);
  assertEquals(img, null);
  assertEquals(stand()!.getAttribute('aria-label'), 'Green-winged Teal (not drawn yet)');
  assertStringIncludes(tile.className, 'bg-slate-100'); // the interface grey, not paper

  tile.click();
  const space = key(tile, ' ');
  assert(!space.defaultPrevented);
  assertEquals(clicked, []);
});

test('without a Dhivehi name the English name is the only line', () => {
  for (const item of [undrawn, { ...undrawn, meta: { family: 'Anatidae' } }]) {
    const { tile } = mount({ item });
    const caption = tile.lastElementChild as HTMLElement;
    assertEquals(caption.children.length, 1);
    assertEquals(caption.textContent?.trim(), 'Green-winged Teal');
  }
});

test("what is not drawn shows its collection's icon, faint on the tile grey in either theme", () => {
  const icon = mount({ item: undrawn }).stand()!;
  // Light: slate-400 on slate-100; dark: slate-600 on slate-900 (docs/DESIGN.md, Reference).
  assertStringIncludes(icon.className, 'text-slate-400 dark:text-slate-600');
  assert(icon.querySelector('svg'), 'the line icon');
  // A collection with no icon has its emoji instead.
  const emoji = mount({ item: undrawn, collection: { icon: '', emoji: '🐚' } }).stand()!;
  assertEquals(emoji.textContent!.trim(), '🐚');
});

test('a drawn tile offers both sizes, so a screen takes the smaller where it is enough', () => {
  const { img } = mount({ item: drawn });
  assertEquals(img.getAttribute('srcset'), '/small/042.webp 240w, /thumb/birds/042.webp 400w');
  assertEquals(img.getAttribute('sizes'), '(min-width: 640px) 220px, 46vw');
});

test('drawn tiles load lazily, the first screen at once', () => {
  assertEquals(mount({ item: drawn }).img.getAttribute('loading'), 'lazy');
  const eager = mount({ item: drawn, eager: true });
  assertEquals(eager.img.getAttribute('loading'), 'eager');
  assertEquals(eager.img.getAttribute('fetchpriority'), 'high');
});

test('a drawing that fails to load shows the icon instead, named for the drawing', async () => {
  const { img, stand } = mount({ item: drawn });
  assertStringIncludes(img.getAttribute('src')!, '/thumb/birds/042.webp');
  img.dispatchEvent(new Event('error'));
  await Promise.resolve();
  assertEquals(stand()!.getAttribute('aria-label'), 'Greater Sand-Plover');
});

test("an undrawn tile's names are muted, Dhivehi included", () => {
  const { tile } = mount({ item: makeItem({ ...teal, meta: { dhiv_script: 'ސަޓު' } }) });
  const [dhivehi, english] = [...(tile.lastElementChild as HTMLElement).children];
  for (const line of [dhivehi, english]) assertStringIncludes(line.className, 'text-slate-600');
});

test("the id badge's layer stays inside its tile, under the sticky section heading", () => {
  // The badge is z-10 to sit over the drawing; the heading is z-10 too. Without
  // its own stacking context the tile would let the badge paint over the heading.
  const { tile } = mount({ item: drawn });
  assertStringIncludes(tile.className, 'isolate');
  assertStringIncludes(tile.querySelector('img')!.parentElement!.innerHTML, 'z-10');
});
