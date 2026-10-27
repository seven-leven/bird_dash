// J5 The viewer: a tile opens it; the arrows page through the drawings in order; zoom; Escape
// closes it and gives focus back to the tile; the group link shows the group in the grid.
import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { press } from '../testing/events.ts';

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const zoom = (app: { text(el: Element): string }) => app.text(dialog()!).match(/\d+%/)?.[0];

test('a drawn tile opens the viewer on it, and the address names it', async () => {
  using app = await renderApp();
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  assertEquals(dialog()!.getAttribute('aria-label'), 'Mallard, #001');
  assertEquals(dialog()!.getAttribute('aria-modal'), 'true');
  await app.until(() => location.hash === '#birds/001', 'the address');
  assertStringIncludes(app.text(dialog()!), 'Anas platyrhynchos');
  await app.until(() => document.activeElement === dialog(), 'focus to move into the viewer');
});

test('the arrows page through the drawings in order, and stop at the ends', async () => {
  using app = await renderApp();
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  assertEquals(app.all('[role="dialog"] button[aria-label="Previous"]').length, 0);

  press('ArrowRight');
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Grey Heron, #003', 'the next');
  await app.until(() => location.hash === '#birds/003', 'the address to follow');
  assertEquals(app.all('[role="dialog"] button[aria-label="Next"]').length, 0);

  app.control('Previous').click();
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Mallard, #001', 'the previous');
  press('ArrowDown');
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Grey Heron, #003', 'down: next');
  press('ArrowUp');
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Mallard, #001', 'up: previous');
  app.control('Next').click();
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Grey Heron, #003', 'next');
  press('ArrowLeft');
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Mallard, #001', 'left');
});

test('zoom by the buttons and the keys, and back to fit', async () => {
  using app = await renderApp();
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  assertEquals(zoom(app), '100%');
  app.control('Zoom in').click();
  press('+');
  await app.until(() => zoom(app) === '150%', 'two steps in');
  press('-');
  await app.until(() => zoom(app) === '125%', 'one step out');
  app.control('Zoom out').click();
  await app.until(() => zoom(app) === '100%', 'back to fit');
  press('=');
  press('0');
  await app.until(() => zoom(app) === '100%', 'reset');
  app.control('Zoom in').click();
  app.control('Reset zoom').click();
  await app.until(() => zoom(app) === '100%', 'reset by the button');
});

test('the image shows a spinner until it loads, and says so if it fails', async () => {
  using app = await renderApp();
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  const img = () => dialog()!.querySelector('img')!;
  assert(dialog()!.querySelector('.animate-spin'), 'a spinner while loading');
  img().dispatchEvent(new Event('load'));
  await app.until(() => !dialog()!.querySelector('.animate-spin'), 'the spinner to go');

  press('ArrowRight');
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Grey Heron, #003', 'the next');
  img().dispatchEvent(new Event('error'));
  await app.until(() => app.text(dialog()!).includes('Could not load image'), 'the failure');
});

test('Escape closes the viewer and gives focus back to the tile', async () => {
  using app = await renderApp();
  const tile = app.control('Mallard, #001');
  tile.focus();
  tile.click();
  await app.until(() => document.activeElement === dialog(), 'focus in the viewer');
  press('Escape');
  await app.until(() => !dialog(), 'the viewer to close');
  assertEquals(document.activeElement, tile);
  await app.until(() => location.hash === '#birds', 'the address to drop the item');
});

test('a zoomed drawing is dragged around, and the drag is not taken for a click', async () => {
  using app = await renderApp();
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  app.control('Zoom in').click();
  const img = () => dialog()!.querySelector('img')!;
  await app.until(() => img().style.cursor === 'grab', 'the hand that says it can be dragged');

  const area = img().parentElement!; // the gesture area around the image
  const pointer = (type: string, x: number) =>
    area.dispatchEvent(
      new PointerEvent(type, { pointerId: 1, clientX: x, clientY: 0, bubbles: true }),
    );
  pointer('pointerdown', 0);
  await app.until(() => img().style.cursor === 'grabbing', 'the hand that is dragging');
  pointer('pointermove', 40);
  pointer('pointerup', 40);
  area.click(); // the click the browser sends after a drag
  await app.until(() => img().style.cursor === 'grab', 'the drag to end');
  assert(dialog(), 'still open: the drag was not a click on the backdrop');

  pointer('pointerdown', 40);
  pointer('pointercancel', 40); // the browser took the pointer over (a scroll, say)
  await app.until(() => img().style.cursor === 'grab', 'a cancelled drag to end');

  area.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
  await app.until(() => zoom(app) === '115%', 'the wheel to zoom out a step');

  area.click(); // a plain click beside the drawing closes the viewer
  await app.until(() => !dialog(), 'the viewer to close');
});

test('the close button closes it too', async () => {
  using app = await renderApp();
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  app.control('Close').click();
  await app.until(() => !dialog(), 'the viewer to close');
});

test('the group link closes the viewer and shows the group in the family view', async () => {
  using app = await renderApp();
  app.control('Months view').click();
  await app.until(() => app.text().includes('March 2025'), 'the month view');
  app.control('Grey Heron, #003').click();
  await app.until(dialog, 'the viewer');

  app.control('Herons', dialog()!).click();
  await app.until(() => !dialog(), 'the viewer to close');
  await app.until(
    () => app.control('Families view').getAttribute('aria-pressed') === 'true',
    'the family view',
  );
  await app.until(
    () => app.control(/^Herons/).getAttribute('aria-current') === 'true',
    'Herons to be the section in view',
  );
});

test('while searching, the viewer pages through the matches and says so', async () => {
  using app = await renderApp();
  const box = document.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  box.value = 'a';
  box.dispatchEvent(new Event('input', { bubbles: true }));
  await app.until(() => app.all('[aria-label^="Clear filter"]').length, 'the grid filtered');
  press('Escape', box);
  app.control('Mallard, #001').click();
  await app.until(dialog, 'the viewer');
  assertStringIncludes(app.text(dialog()!), "matching 'a'");
});
