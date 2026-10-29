// B4 The focus ring shows on every control reached by keyboard: Tab through the page in a real
// Chrome, where :focus-visible decides, and check each stop draws a ring or an outline.
// Keeps: keyboard (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { openSite } from '../testing/realBrowser.ts';

/** The focused element, named, and whether a ring or an outline marks it. */
const focusMark = () => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return null;
  const style = getComputedStyle(el);
  const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
  const name = el.getAttribute('aria-label') || el.textContent!.trim().slice(0, 30) ||
    el.tagName.toLowerCase();
  const key = [...document.querySelectorAll('*')].indexOf(el);
  return { name, marked: outline || style.boxShadow !== 'none', key };
};

test('every control Tab reaches on the gallery and the About page shows where focus is', async () => {
  await using site = await openSite({ width: 1280, height: 900 });
  const { page } = site;
  const unmarked: string[] = [];
  let reached = 0;
  for (const hash of ['birds', 'about']) {
    await site.open(hash);
    const seen = new Set<number>();
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      const mark = await page.evaluate(focusMark);
      if (!mark) continue;
      if (seen.has(mark.key)) break; // round the page and back to the start
      seen.add(mark.key);
      reached++;
      if (!mark.marked) unmarked.push(`#${hash}: ${mark.name}`);
    }
  }
  assert(reached > 20, `Tab reached only ${reached} controls`);
  assertEquals(unmarked, []);
});
