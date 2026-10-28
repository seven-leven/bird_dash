import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h, ref } from 'vue';
import AppFooter from './AppFooter.vue';
import { PAGES } from '../app/pages.ts';
import { buildInfo } from '../app/buildInfo.ts';
import type { Page } from '../types/index.ts';
import { mountComponent } from '../testing/mount.ts';

function mount(page: Page) {
  const host = mountComponent(() => h(AppFooter, { build: buildInfo }), {
    stores: { layout: { pages: PAGES, page: ref(page) } },
  });
  return { host, text: host.textContent!.replace(/\s+/g, ' ') };
}

test('it says which build this is: the version, the drawings and the commit', () => {
  const { text } = mount('gallery');
  assert(text.includes(`Wildlife Illustrated © ${new Date().getFullYear()}`));
  assert(text.includes(`v${buildInfo.version}`));
  assert(text.includes(buildInfo.commit));
  assert(text.includes('Thaana set in Faruma'));
});

test('it links every page, marking the one you are on, the docs and the source', () => {
  const gallery = mount('gallery').host;
  const pageLinks = () =>
    [...gallery.querySelectorAll<HTMLAnchorElement>('a:not([target])')].map((a) =>
      a.getAttribute('href')
    );
  // The docs site sits beside the gallery (/bird_dash/docs/), so its link is relative.
  assertEquals(pageLinks(), [...PAGES.map((p) => `#${p.id}`), 'docs/']);
  assertEquals(gallery.querySelector('a[aria-current]'), null);

  const about = mount('about').host;
  assertEquals(about.querySelector('a[aria-current="page"]')!.getAttribute('href'), '#about');

  const source = gallery.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
  assertEquals(source.getAttribute('href'), 'https://github.com/seven-leven/bird_dash');
  assertEquals(source.rel, 'noopener noreferrer');
  assert(source.textContent!.includes('(opens in a new tab)'));
});
