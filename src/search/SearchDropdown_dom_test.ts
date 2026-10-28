import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h } from 'vue';
import SearchDropdown from './SearchDropdown.vue';
import { at, makeCollection, makeItem } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import type { SearchResult, VisibleGroup } from './useSearchResults.ts';

const birds = makeCollection('birds', { label: 'Birds' });
const mallard = makeItem({ itemId: '001', commonName: 'Mallard', drawnTime: at(2025, 1, 10) });
const garganey = makeItem({ itemId: '002', commonName: 'Garganey' });
const result = (item = mallard): SearchResult => ({
  item,
  collection: birds,
  matchedFields: ['commonName'],
});
const GROUPS: VisibleGroup[] = [{
  collection: birds,
  results: [result(mallard), result(garganey)],
  count: 2,
  hidden: 0,
}];

/** The dropdown, open on `results` unless told otherwise; what it emits is kept. */
function mount(
  { open = true, results = GROUPS, count = 2, drawn = 1 }: {
    open?: boolean;
    results?: VisibleGroup[];
    count?: number;
    drawn?: number;
  } = {},
) {
  const emitted: [string, unknown][] = [];
  const host = mountComponent(
    () =>
      h(SearchDropdown, {
        open,
        query: 'gar',
        results,
        count,
        drawn,
        focusedIndex: -1,
        getFlatIndex: (_: string, i: number) => i,
        highlight: (text: string) => text,
        onFocus: (i: number) => emitted.push(['focus', i]),
        onSelect: (r: SearchResult) => emitted.push(['select', r]),
        onExpand: (id: string) => emitted.push(['expand', id]),
      }),
  );
  return { host, emitted, text: () => host.textContent!.replace(/\s+/g, ' ') };
}

test('closed, it draws nothing', () => {
  assertEquals(mount({ open: false }).host.textContent, '');
});

test('open: the summary, the results as a listbox, then the keys', () => {
  const { host, text } = mount();
  assert(text().includes('2 matches, 1 drawn'));
  const listbox = host.querySelector('[role="listbox"]')!;
  assertEquals(listbox.id, 'global-search-listbox'); // the box's aria-controls
  assertEquals(listbox.getAttribute('aria-label'), 'Search results');
  assertEquals(listbox.querySelectorAll('[role="option"]').length, 2);
  assert(host.querySelector('kbd'));
});

test('no match: it says so, with no listbox', () => {
  const { host, text } = mount({ results: [], count: 0, drawn: 0 });
  assert(text().includes("No matches for 'gar'"));
  assertEquals(host.querySelector('[role="listbox"]'), null);
});

test('it hands on what the pointer does: focus on hover, select on click', () => {
  const { host, emitted } = mount();
  const second = host.querySelectorAll('[role="option"]')[1] as HTMLElement;
  second.dispatchEvent(new MouseEvent('mouseenter'));
  second.click();
  assertEquals(emitted.map(([name]) => name), ['focus', 'select']);
  assertEquals(emitted[0][1], 1);
  assertEquals((emitted[1][1] as SearchResult).item.commonName, 'Garganey');
});

test('a folded group offers the rest, and asks to open it', () => {
  const folded: VisibleGroup[] = [{ ...GROUPS[0], count: 12, hidden: 10 }];
  const { host, emitted } = mount({ results: folded, count: 12 });
  const more = [...host.querySelectorAll('button')].find((b) =>
    b.textContent!.includes('Show 10 more in Birds')
  )!;
  more.click();
  assertEquals(emitted, [['expand', 'birds']]);
});
