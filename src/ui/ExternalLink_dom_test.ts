import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import ExternalLink from './ExternalLink.vue';
import { mountComponent } from '../testing/mount.ts';

const mount = (props: { href: string; icon?: 'github' }) => {
  const host = mountComponent(() =>
    h(ExternalLink, { ...props, class: 'underline' }, () => 'GitHub')
  );
  return host.querySelector('a')!;
};

test('a link out opens in a new tab, says so to screen readers, and takes the caller’s look', () => {
  const link = mount({ href: 'https://example.org/' });
  assertEquals(link.getAttribute('href'), 'https://example.org/');
  assertEquals([link.target, link.rel], ['_blank', 'noopener noreferrer']);
  assertEquals(link.textContent?.trim().startsWith('GitHub'), true);
  assertEquals(link.querySelector('.sr-only')?.textContent, '(opens in a new tab)');
  assertEquals(link.classList.contains('underline'), true);
});

test('without an icon the "leaves the site" arrow trails the text; with one, it leads instead', () => {
  const iconFirst = (link: HTMLAnchorElement) =>
    link.innerHTML.indexOf('<svg') < link.innerHTML.indexOf('GitHub');
  const arrow = mount({ href: '/' });
  assertEquals(arrow.querySelectorAll('svg').length, 1);
  assertEquals(iconFirst(arrow), false);

  const github = mount({ href: '/', icon: 'github' });
  assertEquals(github.querySelectorAll('svg').length, 1);
  assertEquals(iconFirst(github), true);
});
