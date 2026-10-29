import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { h, ref } from 'vue';
import AppFooter from './AppFooter.vue';
import { PAGES } from '../app/pages.ts';
import { buildInfo } from '../app/buildInfo.ts';
import type { Page } from './layoutStore.ts';
import { mountComponent } from '../testing/mount.ts';

function mount(page: Page) {
  const host = mountComponent(() => h(AppFooter, { build: buildInfo }), {
    stores: { layout: { pages: PAGES, page: ref(page) } },
  });
  return { host, text: host.textContent!.replace(/\s+/g, ' ') };
}

test('it says how far the archive has come, then which build this is', () => {
  const { host, text } = mount('gallery');
  assert(text.includes('Wildlife Illustrated'));
  assert(text.includes(`${buildInfo.drawn} of ${buildInfo.planned} drawn, by hand`));
  // The small print: the line's name, the version and the commit, then the year.
  const small = host.querySelector('footer > div:last-child')!.textContent!.replace(/\s+/g, ' ');
  assert(small.includes(`v${buildInfo.version}`));
  assert(small.includes(buildInfo.commit));
  if (buildInfo.name) assert(small.includes(buildInfo.name.roman));
  assert(small.includes(`© ${new Date().getFullYear()}`));
});

test('a build whose lists name no line shows the version alone', () => {
  const host = mountComponent(() => h(AppFooter, { build: { ...buildInfo, name: null } }), {
    stores: { layout: { pages: PAGES, page: ref('gallery') } },
  });
  const small = host.querySelector('footer > div:last-child p')!.textContent!.replace(/\s+/g, ' ');
  assertEquals(small.trim(), `v${buildInfo.version} · ${buildInfo.commit}`);
});

test('the links are one list, in one style', () => {
  const links = [...mount('gallery').host.querySelectorAll('nav a')];
  assertEquals(links.map((a) => a.className.includes('footer-link')), links.map(() => true));
  assertEquals(links.length, PAGES.length + 2);
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
