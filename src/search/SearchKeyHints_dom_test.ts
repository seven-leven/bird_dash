import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import SearchKeyHints from './SearchKeyHints.vue';
import { mountComponent } from '../testing/mount.ts';

test('the keys that work in the results, each named for a screen reader and labelled', () => {
  const host = mountComponent(() => h(SearchKeyHints));
  const keys = [...host.querySelectorAll('kbd')];
  assertEquals(keys.map((k) => k.getAttribute('aria-label')), [
    'Up and down arrow keys',
    'Enter',
    'Escape',
  ]);
  assertEquals(keys.map((k) => k.nextElementSibling!.textContent), ['navigate', 'select', 'close']);
});

test('the arrows and return are drawn as icons, not Unicode, which every font sizes differently', () => {
  const keys = [...mountComponent(() => h(SearchKeyHints)).querySelectorAll('kbd')];
  assertEquals(keys.map((k) => k.querySelector('svg') !== null), [true, true, false]);
  assertEquals(keys[2].textContent!.trim(), 'esc');
});
