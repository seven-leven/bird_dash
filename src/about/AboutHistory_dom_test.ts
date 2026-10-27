import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h } from 'vue';
import AboutHistory from './AboutHistory.vue';
import { mountComponent } from '../testing/mount.ts';

test('the history is dated events, oldest first, ending with the write-up, which leaves the site', () => {
  const host = mountComponent(() => h(AboutHistory));
  const when = [...host.querySelectorAll('ol > li')].map((li) =>
    li.firstElementChild!.textContent!.trim()
  );
  assertEquals(when, ['October 2024', 'October 2025', 'February 2026', 'March 2026']);
  const link = host.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
  assertEquals(link.getAttribute('href'), 'https://seven-leven.github.io/folio/code-wildlife.html');
  assert(link.textContent!.includes('(opens in a new tab)'));
});
