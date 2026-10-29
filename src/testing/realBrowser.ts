// The browser tier's one way to a page (docs/TESTING.md, rule 5): the built site in dist/,
// served by Vite's preview server, in a real Chrome driven by Playwright. Nothing is faked;
// what a test reads is what a visitor's browser lays out and paints.
//
//   await using site = await openSite({ width: 375, touch: true });
//   await site.open('birds/001');                    the address after the #
//   await site.page.keyboard.press('Tab');           the page, as Playwright drives it
//
// Leaving the `await using` block closes the browser and stops the server. Run with
// `npm run build:site` first; CI's browser job does (.github/workflows/browser.yml). The
// browser is the installed Chrome (`BROWSER_CHANNEL` picks another, such as `msedge`), so no
// browser is downloaded.
import { access } from 'node:fs/promises';
import { chromium, type Page } from 'playwright-core';
import { preview } from 'vite';

export interface Site {
  page: Page;
  /** Go to `#<hash>` on the site and wait for the page to show its main content. */
  open(hash?: string): Promise<void>;
}

export async function openSite(
  { width = 1280, height = 800, touch = false }: {
    width?: number;
    height?: number;
    touch?: boolean;
  } = {},
): Promise<Site & AsyncDisposable> {
  try {
    await access('dist/index.html');
  } catch {
    throw new Error('no built site in dist/: run `npm run build:site` before the browser tests');
  }
  const server = await preview({ preview: { port: 0 }, logLevel: 'silent' });
  const base = server.resolvedUrls!.local[0]!;
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome' });
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
  });
  const page = await context.newPage();

  return {
    page,
    async open(hash = '') {
      // A fresh load each time: a change of hash alone is not a navigation to wait for.
      await page.goto('about:blank');
      await page.goto(`${base}#${hash}`);
      await page.waitForLoadState('networkidle');
    },
    async [Symbol.asyncDispose]() {
      await browser.close();
      await server.close();
    },
  };
}
