// B1 No sideways scroll at 375px: every page, and the viewer open, in a real Chrome on the
// built site. The fake DOM lays nothing out, so it cannot see this.
// Keeps: phoneWidth (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { openSite } from '../testing/realBrowser.ts';

/** Everything that would scroll sideways: the page, or a scroll container wider than its box. */
const sidewaysScrollers = () => {
  const wide: string[] = [];
  const root = document.scrollingElement!;
  if (root.scrollWidth > root.clientWidth + 1) wide.push(`the page (${root.scrollWidth}px)`);
  for (const el of document.querySelectorAll<HTMLElement>('*')) {
    const { overflowX } = getComputedStyle(el);
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) {
      wide.push(`${el.tagName.toLowerCase()} (${el.scrollWidth}px)`);
    }
  }
  return wide;
};

test('at 375px no page scrolls sideways, nor the viewer', async () => {
  await using site = await openSite({ width: 375, height: 812, touch: true });
  const wide: Record<string, string[]> = {};
  for (const hash of ['birds', 'sharks', 'shells', 'about', 'birds/001']) {
    await site.open(hash);
    if (hash.includes('/')) await site.page.locator('dialog[open] img').waitFor();
    wide[hash] = await site.page.evaluate(sidewaysScrollers);
  }
  assertEquals(wide, { birds: [], sharks: [], shells: [], about: [], 'birds/001': [] });
});
