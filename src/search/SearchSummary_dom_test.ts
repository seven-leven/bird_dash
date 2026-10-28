import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import SearchSummary from './SearchSummary.vue';
import { mountComponent } from '../testing/mount.ts';

test('the results are headed by how many match and how many of those are drawn', () => {
  const parts = (count: number, drawn: number) =>
    [...mountComponent(() => h(SearchSummary, { count, drawn })).firstElementChild!.children].map(
      (part) => part.textContent!.trim(),
    );
  assertEquals(parts(10, 1), ['Results', '10 matches, 1 drawn']);
  assertEquals(parts(1, 0), ['Results', '1 match, 0 drawn']);
});
