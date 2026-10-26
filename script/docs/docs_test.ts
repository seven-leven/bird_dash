import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { githubHref, githubLinks, githubSlug, REPO_URL } from './links.ts';
import { liveBlocks, liveNames } from './live_blocks.ts';
import { accentHues, missingSteps, STEPS } from './accents.ts';

test('githubHref: a page inside docs/ stays a link to the site', () => {
  assertEquals(githubHref('TESTING.md', 'docs/README.md'), null);
  assertEquals(githubHref('TESTING.md#3-tiers', 'docs/DESIGN.md'), null);
  assertEquals(githubHref('../DESIGN.md', 'docs/plans/TODO.md'), null);
});

test('githubHref: a file or folder outside the pages opens on GitHub, anchor kept', () => {
  assertEquals(
    githubHref('../src/pages.ts', 'docs/ARCHITECTURE.md'),
    `${REPO_URL}/blob/main/src/pages.ts`,
  );
  assertEquals(
    githubHref('../README.md#documentation', 'docs/README.md'),
    `${REPO_URL}/blob/main/README.md#documentation`,
  );
  assertEquals(githubHref('assets/', 'docs/README.md'), `${REPO_URL}/tree/main/docs/assets`);
  assertEquals(
    githubHref('assets/icons.png', 'docs/DESIGN.md'),
    `${REPO_URL}/blob/main/docs/assets/icons.png`,
  );
});

test('githubHref: URLs, anchors on the page and empty links are left alone', () => {
  for (const href of ['https://example.org', 'mailto:a@b.c', '#p1', '/bird_dash/', '//cdn.x', '']) {
    assertEquals(githubHref(href, 'docs/DESIGN.md'), null);
  }
});

test("githubSlug: GitHub's anchors, digits first included", () => {
  assertEquals(githubSlug('3. Before you open a pull request'), '3-before-you-open-a-pull-request');
  assertEquals(
    githubSlug('01. Colour — quiet ground, clear signal'),
    '01-colour--quiet-ground-clear-signal',
  );
  assertEquals(githubSlug('P1 — Drawings first'), 'p1--drawings-first');
  assertEquals(githubSlug('`useLightbox` and <code>x</code>'), 'uselightbox-and-x');
  assertEquals(githubSlug('Node on the LTS line'), 'node-on-the-lts-line');
});

test('githubLinks: rewrites the links in a page, using its path', () => {
  const link = (href: string) => {
    const attrs = new Map([['href', href]]);
    return {
      type: 'link_open',
      children: null,
      attrGet: (n: string) => attrs.get(n) ?? null,
      attrSet: (n: string, v: string) => void attrs.set(n, v),
    };
  };
  const [a, b, text] = [link('../src/x.ts'), link('DATA.md'), { ...link(''), type: 'text' }];
  let rule: ((state: never) => void) | undefined;
  githubLinks({ core: { ruler: { push: (_name, r) => void (rule = r as never) } } });
  const state = {
    tokens: [{ ...link(''), type: 'inline', children: [a, b, text] }, {
      ...link(''),
      type: 'paragraph_open',
    }],
    env: { relativePath: 'ARCHITECTURE.md' },
  };
  rule!(state as never);
  assertEquals([a.attrGet('href'), b.attrGet('href')], [
    `${REPO_URL}/blob/main/src/x.ts`,
    'DATA.md',
  ]);

  const c = link('x.ts'); // a page without a path is taken to be the index, in docs/
  const bare = { ...link(''), attrGet: () => null }; // a link with no href stays one
  rule!({ tokens: [{ ...link(''), type: 'inline', children: [c, bare] }], env: {} } as never);
  assertEquals(c.attrGet('href'), `${REPO_URL}/blob/main/docs/x.ts`);
});

test('liveBlocks: each marked section becomes its component; the rest is untouched', () => {
  const page = [
    '# Colour',
    '<!-- live: AccentRamps -->',
    '| Step | slate |',
    '| ---- | ----- |',
    '<!-- /live -->',
    'Between.',
    '<!-- live: IconSheet -->',
    '- bird',
    '<!-- /live -->',
  ].join('\n');
  assertEquals(liveBlocks(page), '# Colour\n<AccentRamps />\nBetween.\n<IconSheet />');
  assertEquals(liveNames(page), ['AccentRamps', 'IconSheet']);
  assertEquals(liveBlocks('No markers.'), 'No markers.');
});

test('accentHues: the palettes accents.css defines, in order', () => {
  const css = ":root {}\n[data-accent='teal'] {}\n[data-accent='sky-blue'] {}";
  assertEquals(accentHues(css), ['teal', 'sky-blue']);
});

test("missingSteps: the steps of a colour Tailwind's theme does not define", () => {
  const theme = STEPS.slice(0, -1).map((s) => `  --color-teal-${s}: oklch(${s}% 0.1 180);`)
    .join('\n');
  assertEquals(missingSteps('teal', theme), ['950']);
  assertEquals(missingSteps('lime', theme), STEPS);
});
