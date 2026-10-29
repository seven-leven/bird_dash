// B2 A swipe pages the viewer on a touch screen: real touch input, which the browser turns into
// pointer events itself, in a real Chrome on the built site.
// Keeps: phoneWidth (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { openSite } from '../testing/realBrowser.ts';

test('a finger swiping left across the drawing pages to the next one, and right comes back', async () => {
  await using site = await openSite({ width: 375, height: 812, touch: true });
  const { page } = site;
  await site.open('birds/001');
  const box = (await page.locator('dialog[open] img').boundingBox())!;
  const y = box.y + box.height / 2;
  const middle = box.x + box.width / 2;
  const cdp = await page.context().newCDPSession(page);
  /** A finger from `from` to `to` across the middle of the drawing, in five moves. */
  const swipe = async (from: number, to: number) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from, y }],
    });
    for (let i = 1; i <= 5; i++) {
      const x = from + ((to - from) * i) / 5;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  await swipe(middle + 120, middle - 120);
  await page.waitForFunction(() => location.hash === '#birds/002');
  await swipe(middle - 120, middle + 120);
  await page.waitForFunction(() => location.hash === '#birds/001');
});
