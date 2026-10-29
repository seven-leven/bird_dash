// B3 Thaana is never clipped: in a tile, the viewer and the search results, as a real Chrome
// sets Faruma. Each Dhivehi line keeps the height its vowel marks need, and nothing around it
// cuts the text off. The line-height rule itself is a contract (thaanaLineHeight).
// Keeps: thaana (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { openSite } from '../testing/realBrowser.ts';

/** Every shown Dhivehi line that is too tight, or cut off by its own box or a clipping parent. */
const clippedThaana = () => {
  const bad: string[] = [];
  for (const el of document.querySelectorAll<HTMLElement>('.font-dhivehi')) {
    if (el.getClientRects().length === 0) continue;
    const style = getComputedStyle(el);
    const ratio = parseFloat(style.lineHeight) / parseFloat(style.fontSize);
    if (!(ratio >= 1.8)) bad.push(`${el.textContent!.trim()}: line height ${ratio.toFixed(2)}`);
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    for (let box: HTMLElement | null = el; box; box = box.parentElement) {
      const { overflowY } = getComputedStyle(box);
      // Past a scrolling box, text out of view is scrolled away, not cut off.
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      if (overflowY !== 'hidden' && overflowY !== 'clip') continue;
      const edge = box.getBoundingClientRect();
      if (text.top < edge.top - 1 || text.bottom > edge.bottom + 1) {
        bad.push(`${el.textContent!.trim()}: cut off by ${box.tagName.toLowerCase()}`);
        break;
      }
    }
  }
  return bad;
};

test('Dhivehi names are not clipped in the tiles, the viewer or the search results', async () => {
  await using site = await openSite({ width: 1280, height: 900 });
  const { page } = site;
  const found: Record<string, string[]> = {};

  await site.open('birds');
  found.tiles = await page.evaluate(clippedThaana);

  await site.open('birds/030'); // a bird with two Dhivehi names
  await page.locator('dialog[open] .font-dhivehi').first().waitFor();
  found.viewer = await page.evaluate(clippedThaana);

  await site.open('birds');
  await page.getByRole('combobox', { name: 'Search all collections' }).fill('kukulhu');
  await page.locator('[role="listbox"] .font-dhivehi').first().waitFor();
  found.search = await page.evaluate(clippedThaana);

  assertEquals(found, { tiles: [], viewer: [], search: [] });
});
