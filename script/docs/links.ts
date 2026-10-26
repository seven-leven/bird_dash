// How the docs site keeps the Markdown's links working: links to a file outside docs/
// (source code, the README, the CHANGELOG) go to GitHub, and headings get GitHub's
// anchors, so `TESTING.md#3-tiers` lands on the same heading on GitHub and on the site.
import { posix } from 'node:path';

import { REPO_URL } from '../lib/project.ts';

/** Whether an href points somewhere else entirely: a URL, a mail link, an anchor on this page. */
const isExternal = (href: string) => /^([a-z][a-z0-9+.-]*:|\/\/|#|\/)/i.test(href);

/**
 * The GitHub URL for a relative link in a docs page, or null to leave it as it is.
 * `from` is the page's path in the repository (`docs/DESIGN.md`). A link to another
 * Markdown page inside docs/ stays: the site has that page too. Anything else (a
 * source file, a folder, an image linked rather than shown, a page outside docs/) is
 * opened on GitHub, a folder as a tree and a file as a blob.
 */
export function githubHref(href: string, from: string): string | null {
  if (!href || isExternal(href)) return null;
  const hashAt = href.indexOf('#');
  const path = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? '' : href.slice(hashAt);
  const target = posix.normalize(posix.join(posix.dirname(from), path));
  if (target.startsWith('docs/') && target.endsWith('.md')) return null;
  const kind = path.endsWith('/') ? 'tree' : 'blob';
  return `${REPO_URL}/${kind}/main/${target.replace(/\/$/, '')}${hash}`;
}

/**
 * A heading's anchor as GitHub makes it: lower case, punctuation dropped, spaces to
 * hyphens. "3. Before you open a pull request" → `3-before-you-open-a-pull-request`.
 * (VitePress's own would start that one with an underscore.)
 */
export function githubSlug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-');
}

/** The parts of a markdown-it token this plugin reads and writes. */
interface LinkToken {
  type: string;
  children: LinkToken[] | null;
  attrGet(name: string): string | null;
  attrSet(name: string, value: string): void;
}

/**
 * A markdown-it plugin: rewrites each page's links with `githubHref`. VitePress gives
 * the page's path within docs/ as `env.relativePath`.
 */
export function githubLinks(md: {
  core: {
    ruler: {
      push(
        name: string,
        rule: (state: { tokens: LinkToken[]; env: { relativePath?: string } }) => void,
      ): void;
    };
  };
}): void {
  md.core.ruler.push('github-links', (state) => {
    const from = `docs/${state.env.relativePath ?? 'index.md'}`;
    for (const token of state.tokens) {
      for (const child of token.children ?? []) {
        if (child.type !== 'link_open') continue;
        const next = githubHref(child.attrGet('href') ?? '', from);
        if (next) child.attrSet('href', next);
      }
    }
  });
}
