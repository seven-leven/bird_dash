/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { createSearchStore } from './search.ts';
import { runInScope } from '../../test/fixtures.ts';

Deno.test('setQuery updates the query and opens the dropdown for non-empty input', () => {
  const { value: s, stop } = runInScope(() => createSearchStore());
  assertEquals(s.query.value, '');
  assertEquals(s.dropdownOpen.value, false);

  s.setQuery('mallard');
  assertEquals(s.query.value, 'mallard');
  assertEquals(s.dropdownOpen.value, true);
  stop();
});

Deno.test('setQuery with blank input does not open the dropdown', () => {
  const { value: s, stop } = runInScope(() => createSearchStore());
  s.setQuery('   ');
  assertEquals(s.dropdownOpen.value, false);
  stop();
});

Deno.test('setDropdown toggles independently; clear resets both', () => {
  const { value: s, stop } = runInScope(() => createSearchStore());
  s.setQuery('x');
  s.setDropdown(false);
  assertEquals(s.dropdownOpen.value, false);
  assertEquals(s.query.value, 'x');

  s.clear();
  assertEquals(s.query.value, '');
  assertEquals(s.dropdownOpen.value, false);
  stop();
});
