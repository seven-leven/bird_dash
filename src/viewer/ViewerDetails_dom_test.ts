import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { h, nextTick, ref } from 'vue';
import ViewerDetails from './ViewerDetails.vue';
import { at, makeCollection, makeItem } from '../testing/fixtures.ts';
import type { Item } from '../types/index.ts';
import { settle } from '../testing/settle.ts';
import { mountComponent } from '../testing/mount.ts';

const birds = makeCollection('birds', {
  label: 'Birds',
  links: [{ label: 'eBird', url: () => 'https://ebird.org/x' }],
});
// The goose's fields, so a test can build a variant with other names (`names` is
// built from them, so spreading a built item with new `meta` would keep the old ones).
const gooseFields = {
  itemId: '002',
  commonName: 'Cotton Pygmy-Goose',
  scientificName: 'Nettapus coromandelianus',
  group: 'Ducks, Geese, and Swans',
  drawnTime: at(2024, 10, 10),
  meta: { dhiv: 'Reyru', dhiv_script: 'ރޭރު', habitat: 'Wetlands' },
  illustratorNote: 'Experimented with markers. Compare #1.',
};
const goose = makeItem(gooseFields);
const gooseWith = (o: Partial<Item>) => makeItem({ ...gooseFields, ...o });

/** Mount the panel for `item` (reactive, so a test can swap the drawing). */
function mount(start: Item) {
  const item = ref(start);
  const groups: string[] = [];
  const host = mountComponent(() =>
    h(ViewerDetails, {
      item: item.value,
      collection: birds,
      'onGo-to-group': (g: string) => groups.push(g),
    })
  );
  return { host, item, groups };
}

test('the names are one block, one language per line: Dhivehi (and how to say it), English, scientific', () => {
  const { host } = mount(goose);
  const dhivehiLine = host.querySelector('h2')!.parentElement!;
  const [dhivehi, romanised] = [...dhivehiLine.children] as HTMLElement[];
  assertEquals(dhivehi.textContent?.trim(), 'ރޭރު');
  assertStringIncludes(dhivehi.className, 'text-3xl');
  assertEquals(dhivehi.getAttribute('dir'), 'rtl');
  // "Reyru" shares the Thaana's line, so it cannot read as part of the English title.
  assertEquals(romanised.textContent?.trim(), 'Reyru');
  assertEquals(romanised.querySelector('[lang="dv-Latn"]')?.textContent, 'Reyru');
  const [, english, scientific] = [...dhivehiLine.parentElement!.children] as HTMLElement[];
  assertEquals(english.textContent?.trim(), 'Cotton Pygmy-Goose');
  assertEquals(scientific.textContent?.trim(), 'Nettapus coromandelianus');
  // The romanised name is not repeated as a field of its own; other facts are.
  assert(!host.textContent!.includes('romanised'));
  assertStringIncludes(host.textContent!, 'Habitat');
});

test('without a Dhivehi name, the English name is the title', () => {
  const { host } = mount(gooseWith({ meta: {} }));
  assertEquals(host.querySelector('h2')?.textContent?.trim(), 'Cotton Pygmy-Goose');
  assertStringIncludes(host.querySelector('h2')!.className, 'text-xl');
});

test('the top line says where it sits and when: id, group (a link back), month drawn', () => {
  const { host, groups } = mount(goose);
  assertStringIncludes(host.textContent!, '#002');
  assertStringIncludes(host.textContent!, 'Drawn October 2024');
  const group = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Ducks'))!;
  group.click();
  assertEquals(groups, ['Ducks, Geese, and Swans']);
});

test('an undated drawing has no month', () => {
  const { host } = mount({ ...goose, drawnTime: 0 });
  assert(!host.textContent!.includes('Drawn '));
});

test('a short note is shown whole, with "#1" a link to that drawing', () => {
  const { host } = mount(goose);
  const note = host.querySelector('#illustrator-note')!;
  assert(!note.className.includes('max-h-36'), 'a short note is not folded');
  assertEquals(note.querySelector('a')?.getAttribute('href'), '#birds/001');
  assert(![...host.querySelectorAll('button')].some((b) => b.textContent?.includes('Read more')));
});

test('a long note opens folded, in paragraphs, and "Read more" unfolds it', async () => {
  const long = 'A first thought about the pen.\n\n' + 'Long. '.repeat(80) + '\n\nAnd a last one.';
  const { host, item } = mount({ ...goose, illustratorNote: long });
  const note = host.querySelector('#illustrator-note')!;
  assertEquals(note.querySelectorAll('p').length, 3);
  assertStringIncludes(note.className, 'max-h-36');

  const more = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Read'))!;
  assertEquals(more.getAttribute('aria-expanded'), 'false');
  more.click();
  await nextTick();
  assert(!note.className.includes('max-h-36'));
  assertEquals(more.getAttribute('aria-expanded'), 'true');
  assertEquals(more.textContent?.trim(), 'Show less');

  // The next drawing's note starts folded again.
  item.value = { ...goose, id: 'birds-003', itemId: '003', illustratorNote: long };
  await nextTick();
  assertStringIncludes(host.querySelector('#illustrator-note')!.className, 'max-h-36');
});

test('three short paragraphs also fold; no note means no section', () => {
  const three = mount({ ...goose, illustratorNote: 'One.\n\nTwo.\n\nThree.' });
  assertStringIncludes(three.host.querySelector('#illustrator-note')!.className, 'max-h-36');

  const none = mount({ ...goose, illustratorNote: undefined, meta: undefined });
  assertEquals(none.host.querySelector('#illustrator-note'), null);
});

test('the links are plain links that say they open a new tab', () => {
  const { host } = mount(goose);
  const link = host.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
  assertEquals(link.getAttribute('href'), 'https://ebird.org/x');
  assertStringIncludes(link.textContent!, 'opens in a new tab');
  assert(!link.className.includes('border'), 'links, not bordered buttons');
});

test('links within the site are in the accent; links that leave it are not', () => {
  const { host } = mount({ ...goose, illustratorNote: 'See #1.\n\n' + 'Long. '.repeat(80) });
  const group = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Ducks'))!;
  const noteLink = host.querySelector('#illustrator-note a')!;
  const more = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Read'))!;
  for (const el of [group, noteLink, more]) assertStringIncludes(el.className, 'text-accent-700');
  const external = host.querySelector('a[target="_blank"]')!;
  assert(!external.className.includes('accent'), 'an external link stays neutral');
});

test('section labels are words alone, without icons', () => {
  const { host } = mount(goose);
  const labels = [...host.querySelectorAll('.caps-label')].filter((p) =>
    /illustrator|Learn more/i.test(p.textContent ?? '')
  );
  assertEquals(labels.length, 2);
  for (const label of labels) assertEquals(label.querySelector('svg'), null);
});

test('a Dhivehi name without a romanisation is the Thaana alone', () => {
  const { host } = mount(gooseWith({ meta: { dhiv_script: 'ރޭރު' } }));
  assertEquals(host.querySelector('h2')!.parentElement!.children.length, 1);
});

/** The share button, by its icon. */
const shareButton = (host: Element) =>
  [...host.querySelectorAll('button')].find((b) => b.textContent!.trim() === 'Share') ??
    [...host.querySelectorAll('button')].find((b) => /Copied|Couldn't copy/.test(b.textContent!));

/** A clipboard that keeps what is copied, or refuses. */
function fakeClipboard(refuses = false) {
  const copied: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) =>
        refuses ? Promise.reject(new Error('denied')) : (copied.push(text), Promise.resolve()),
    },
  });
  return copied;
}

test("sharing a drawing copies its link preview's address, and says so", async () => {
  const copied = fakeClipboard();
  const { host, item } = mount(goose);
  const button = shareButton(host)!;
  assertEquals(button.textContent!.trim(), 'Share');
  button.click();
  await settle();
  assertEquals(copied, [new URL('birds/002/', location.href.split('#')[0]).href]);
  // A short word on the button keeps it on the links' line; a screen reader hears it whole.
  assertEquals(button.textContent!.trim(), 'Copied');
  assertEquals(host.querySelector('[role="status"]')!.textContent, 'Link copied');
  // The next drawing's button starts fresh.
  item.value = gooseWith({ itemId: '003', id: 'birds-003' });
  await nextTick();
  assertEquals(shareButton(host)!.textContent!.trim(), 'Share');
});

test('when the clipboard refuses, the button says it could not copy', async () => {
  fakeClipboard(true);
  const { host } = mount(goose);
  shareButton(host)!.click();
  await settle();
  assertEquals(shareButton(host)!.textContent!.trim(), "Couldn't copy");
  assertEquals(host.querySelector('[role="status"]')!.textContent, "Couldn't copy the link");
});

test('Share sits at the end of the Learn more row, after the links that leave the site', () => {
  const { host } = mount(goose);
  const row = shareButton(host)!.parentElement!;
  assertEquals(row.firstElementChild!.textContent!.trim().startsWith('eBird'), true);
  // Its note for screen readers follows it, unseen; Share is the row's last control.
  assert([...row.querySelectorAll('a, button')].at(-1) === shareButton(host));
  assertStringIncludes(shareButton(host)!.className, 'ml-auto');
});

test('a collection with no links still offers Share, without a Learn more label', () => {
  const unlinked = makeCollection('birds', { label: 'Birds', links: [] });
  const host = mountComponent(() => h(ViewerDetails, { item: goose, collection: unlinked }));
  assert(shareButton(host), 'Share is offered');
  assert(!host.textContent!.includes('Learn more'));
  const undrawn = mountComponent(() =>
    h(ViewerDetails, { item: gooseWith({ drawnTime: 0 }), collection: unlinked })
  );
  assertEquals(shareButton(undrawn), undefined);
});

test('a drawing not yet drawn has no link preview, so nothing to share', () => {
  const { host } = mount(gooseWith({ drawnTime: 0 }));
  assertEquals(shareButton(host), undefined);
});

test('a bird with two Dhivehi names gets a line for each, each with its own romanisation', () => {
  const { host } = mount(gooseWith({
    commonName: 'Watercock',
    meta: { dhiv_script: 'ވަލު ކުކުޅު / ކުލީ ކުކުޅު', dhiv: 'Valu Kukulhu / Kulhee Kukulhu' },
  }));
  const title = host.querySelector('h2')!;
  const block = title.parentElement!.parentElement!;
  const [first, second, english] = [...block.children] as HTMLElement[];
  assertEquals(title.textContent?.trim(), 'ވަލު ކުކުޅު');
  const parts = (row: HTMLElement) =>
    [...row.children].map((c) => c.textContent?.replace(/\s+/g, ' ').trim());
  assertEquals(parts(first), ['ވަލު ކުކުޅު', 'Valu Kukulhu']);
  // The alternative is smaller, not a second title, and says it is an alternative.
  const alt = second.firstElementChild as HTMLElement;
  assertEquals(alt.tagName, 'P');
  assertStringIncludes(alt.className, 'text-xl');
  assertEquals(parts(second), ['ކުލީ ކުކުޅު', 'also Kulhee Kukulhu']);
  assertEquals(english.textContent?.trim(), 'Watercock');
});
