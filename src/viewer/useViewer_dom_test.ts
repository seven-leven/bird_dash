import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { nextTick, reactive } from 'vue';
import { useViewer } from './useViewer.ts';
import { at, makeCollection, makeItem } from '../testing/fixtures.ts';
import type { Item } from '../types/index.ts';
import { mountComposable, runInScope } from '../testing/mount.ts';

const items = [
  makeItem({ itemId: '001', drawnTime: at(2025, 1, 10) }),
  makeItem({ itemId: '002', drawnTime: at(2025, 2, 10) }),
  makeItem({ itemId: '003', drawnTime: at(2025, 3, 10) }),
];

/** A lightbox with a real dialog element (2 buttons + 1 link) attached to the fake DOM. */
function setup(startAt = 0) {
  const props = reactive({
    isOpen: false,
    item: items[startAt] as Item | undefined,
    drawnItems: items,
    fullImageBaseUrl: '/full/x/',
    collection: makeCollection('x'),
  });
  const emitted: Array<[string, Item | undefined]> = [];
  const emit = ((event: string, payload?: Item) => emitted.push([event, payload])) as never;

  const dialog = document.createElement('div');
  dialog.tabIndex = -1;
  dialog.innerHTML =
    '<button id="first">a</button><button id="mid">b</button><a id="last" href="#">c</a>';
  document.body.append(dialog);

  const { value: lb, stop } = runInScope(() => useViewer({ props, emit }));
  lb.dialogRef.value = dialog;

  const key = (k: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(e);
    return e;
  };
  const open = async () => {
    props.isOpen = true;
    await nextTick();
    await nextTick();
  };
  const el = (id: string) => dialog.querySelector<HTMLElement>(`#${id}`)!;

  return { props, lb, emitted, dialog, key, open, el, stop };
}

const pointer = (type: string, id: number, x: number, y: number, kind = 'touch') =>
  new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: kind });

test('opening moves focus into the dialog and locks page scroll', async () => {
  const t = setup();
  await t.open();
  assertEquals(document.activeElement, t.dialog);
  assertEquals(document.body.style.overflow, 'hidden');
  t.stop();
});

test('closing restores focus to what opened it and unlocks scroll', async () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();

  const t = setup();
  await t.open();
  assert(document.activeElement !== opener);

  t.props.isOpen = false;
  await nextTick();
  assertEquals(document.activeElement, opener);
  assertEquals(document.body.style.overflow, '');
  t.stop();
});

test('+ / - / 0 zoom, and Escape asks the parent to close', async () => {
  const t = setup();
  await t.open();

  t.key('+');
  t.key('+');
  assertEquals(t.lb.scale.value, 1.5);
  t.key('-');
  assertEquals(t.lb.scale.value, 1.25);
  t.key('0');
  assertEquals(t.lb.scale.value, 1);

  t.key('Escape');
  assertEquals(t.emitted, [['close', undefined]]);
  t.stop();
});

test('arrow keys page through the drawn items and stop at the ends', async () => {
  const t = setup(0);
  await t.open();

  t.key('ArrowLeft'); // already first: nothing to go back to
  assertEquals(t.emitted, []);

  t.key('ArrowRight');
  assertEquals(t.emitted.map(([e, p]) => [e, p?.itemId]), [['update:item', '002']]);
  t.stop();
});

test('up and down page too, as left and right do, and keep the page from scrolling', async () => {
  const t = setup(1);
  await t.open();
  const up = t.key('ArrowUp');
  const down = t.key('ArrowDown');
  assertEquals(t.emitted.map(([, p]) => p?.itemId), ['001', '003']);
  assert(up.defaultPrevented && down.defaultPrevented);
  t.stop();
});

test('keys typed into a text field do not zoom or page the image', async () => {
  const t = setup();
  await t.open();
  const input = document.createElement('input');
  document.body.append(input);

  t.key('+', {}, input);
  t.key('ArrowRight', {}, input);
  assertEquals(t.lb.scale.value, 1);
  assertEquals(t.emitted, []);
  t.stop();
});

test('Tab wraps from the last control to the first, Shift+Tab the other way', async () => {
  const t = setup();
  await t.open();

  t.el('last').focus();
  const forward = t.key('Tab', {}, t.el('last'));
  assert(forward.defaultPrevented, 'Tab on the last control must be intercepted');
  assertEquals(document.activeElement, t.el('first'));

  const back = t.key('Tab', { shiftKey: true }, t.el('first'));
  assert(back.defaultPrevented, 'Shift+Tab on the first control must be intercepted');
  assertEquals(document.activeElement, t.el('last'));

  t.el('mid').focus();
  const middle = t.key('Tab', {}, t.el('mid'));
  assert(!middle.defaultPrevented, 'Tab in the middle is left to the browser');
  t.stop();
});

test('keys are ignored while closed', async () => {
  const t = setup();
  t.key('+'); // never opened, so the window listener was never attached
  assertEquals(t.lb.scale.value, 1);
  await t.open();
  t.props.isOpen = false;
  await nextTick();
  t.key('+'); // closed again: listener removed
  assertEquals(t.lb.scale.value, 1);
  t.stop();
});

test('a two-finger pinch zooms by how far the fingers spread', async () => {
  const t = setup();
  await t.open();

  t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.lb.handlePointerDown(pointer('pointerdown', 2, 400, 300)); // 100px apart
  t.lb.handlePointerMove(pointer('pointermove', 2, 550, 300)); // 250px apart
  assertEquals(t.lb.scale.value, 2.5);

  t.lb.handlePointerUp(pointer('pointerup', 2, 550, 300));
  t.lb.handlePointerUp(pointer('pointerup', 1, 300, 300));
  t.stop();
});

test('a finger swipe pages; a mouse drag at 1x does not', async () => {
  const t = setup(0);
  await t.open();

  // mouse drag left at 1x: no paging
  t.lb.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
  t.lb.handlePointerUp(pointer('pointerup', 1, 200, 300, 'mouse'));
  assertEquals(t.emitted, []);

  // finger swipe left: next item
  t.lb.handlePointerDown(pointer('pointerdown', 1, 400, 300));
  t.lb.handlePointerUp(pointer('pointerup', 1, 250, 305));
  assertEquals(t.emitted.map(([e, p]) => [e, p?.itemId]), [['update:item', '002']]);
  t.stop();
});

test('dragging while zoomed pans by the distance divided by the scale', async () => {
  const t = setup();
  await t.open();
  t.key('+');
  t.key('+'); // 1.5x

  t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.lb.handlePointerMove(pointer('pointermove', 1, 360, 330)); // (60, 30) / 1.5
  await new Promise((r) => requestAnimationFrame(() => r(null))); // the write is per-frame
  assertEquals([t.lb.translateX.value, t.lb.translateY.value], [40, 20]);
  assertEquals(t.lb.isDragging.value, true);

  t.lb.handlePointerUp(pointer('pointerup', 1, 360, 330));
  assertEquals(t.lb.isDragging.value, false);
  t.stop();
});

const clickOn = (target: object, currentTarget: object = target) =>
  ({ target, currentTarget }) as unknown as MouseEvent;

test('a click on empty space closes; a click that bubbled from a child does not', async () => {
  const t = setup();
  await t.open();
  t.lb.handleBackdropClick(clickOn(t.el('first'), t.dialog)); // came from a control
  assertEquals(t.emitted, []);
  t.lb.handleBackdropClick(clickOn(t.dialog));
  assertEquals(t.emitted.map(([e]) => e), ['close']);
  t.stop();
});

test('the click that ends a drag does not close; the next plain click does', async () => {
  const t = setup();
  await t.open();
  t.lb.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
  t.lb.handlePointerUp(pointer('pointerup', 1, 300, 300, 'mouse')); // moved 100px
  t.lb.handleBackdropClick(clickOn(t.dialog));
  assertEquals(t.emitted, [], 'a drag was treated as a click');

  t.lb.handlePointerDown(pointer('pointerdown', 2, 400, 300, 'mouse'));
  t.lb.handlePointerUp(pointer('pointerup', 2, 402, 301, 'mouse')); // a real click
  t.lb.handleBackdropClick(clickOn(t.dialog));
  assertEquals(t.emitted.map(([e]) => e), ['close']);
  t.stop();
});

test('position reports where the open item sits among the drawn items', () => {
  const t = setup(1);
  assertEquals(t.lb.position.value, '2 of 3');
  t.props.item = undefined;
  assertEquals(t.lb.position.value, '');
  t.stop();
});

test('the image URL is empty while closed and points at the full image while open', async () => {
  const t = setup(1);
  assertEquals(t.lb.imageUrl.value, '');
  await t.open();
  assertEquals(t.lb.imageUrl.value, '/full/x/002.webp');
  t.stop();
});

test('opening shows the spinner until the image loads; a failed image shows an error', async () => {
  const t = setup();
  await t.open();
  assertEquals([t.lb.loading.value, t.lb.error.value], [true, null]);

  t.lb.handleImageLoad();
  assertEquals([t.lb.loading.value, t.lb.error.value], [false, null]);

  t.props.item = items[1]; // paging starts a new load
  await nextTick();
  assertEquals(t.lb.loading.value, true);
  t.lb.handleImageError();
  assertEquals([t.lb.loading.value, t.lb.error.value], [false, 'Image not found']);
  t.stop();
});

test('the wheel zooms in steps, never below 1x or above 5x', async () => {
  const t = setup();
  await t.open();
  const wheel = (deltaY: number) => t.lb.handleWheel({ deltaY } as WheelEvent);

  wheel(100); // zooming out at 1x stays at 1x
  assertEquals(t.lb.scale.value, 1);
  wheel(-100);
  assert(t.lb.scale.value > 1);
  for (let i = 0; i < 100; i++) wheel(-100);
  assertEquals(t.lb.scale.value, 5);
  for (let i = 0; i < 100; i++) wheel(100);
  assertEquals(t.lb.scale.value, 1);
  t.stop();
});

test('paging to another item resets the zoom', async () => {
  const t = setup();
  await t.open();
  t.lb.zoomIn();
  t.lb.zoomIn();
  assert(t.lb.scale.value > 1);
  t.props.item = items[1];
  await nextTick();
  assertEquals(t.lb.scale.value, 1);
  t.stop();
});

test('previous and next are offered only where there is somewhere to go', () => {
  const first = setup(0);
  assertEquals([first.lb.hasPrevious.value, first.lb.hasNext.value], [false, true]);
  first.stop();

  const last = setup(2);
  assertEquals([last.lb.hasPrevious.value, last.lb.hasNext.value], [true, false]);
  last.lb.goToNext(); // nothing after the last item
  assertEquals(last.emitted, []);
  last.stop();

  const none = setup(0);
  none.props.item = undefined;
  assertEquals([none.lb.hasPrevious.value, none.lb.hasNext.value], [false, false]);
  none.stop();
});

test('pointer events for a pointer that never went down are ignored', async () => {
  const t = setup();
  await t.open();
  t.lb.handlePointerMove(pointer('pointermove', 7, 500, 500));
  t.lb.handlePointerUp(pointer('pointerup', 7, 500, 500));
  assertEquals([t.lb.scale.value, t.lb.isDragging.value, t.emitted], [1, false, []]);
  t.stop();
});

test('a finger swipe right pages back, and does nothing on the first drawing', async () => {
  const t = setup(1);
  await t.open();
  t.lb.handlePointerDown(pointer('pointerdown', 1, 200, 300));
  t.lb.handlePointerUp(pointer('pointerup', 1, 350, 305));
  assertEquals(t.emitted.map(([e, p]) => [e, p?.itemId]), [['update:item', '001']]);
  t.stop();

  const first = setup(0);
  await first.open();
  first.lb.handlePointerDown(pointer('pointerdown', 1, 200, 300));
  first.lb.handlePointerUp(pointer('pointerup', 1, 350, 305));
  assertEquals(first.emitted, []);
  first.stop();
});

test('a tap (a finger that hardly moves) neither pages nor counts as a drag', async () => {
  const t = setup(1);
  await t.open();
  t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.lb.handlePointerMove(pointer('pointermove', 1, 302, 301));
  t.lb.handlePointerUp(pointer('pointerup', 1, 302, 301));
  assertEquals(t.emitted, []);
  t.lb.handleBackdropClick(clickOn(t.dialog)); // the tap's click still closes
  assertEquals(t.emitted.map(([e]) => e), ['close']);
  t.stop();
});

test('several moves in one frame are written once, with the latest position', async () => {
  const t = setup();
  await t.open();
  t.key('+');
  t.key('+'); // 1.5x
  t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.lb.handlePointerMove(pointer('pointermove', 1, 315, 300));
  t.lb.handlePointerMove(pointer('pointermove', 1, 330, 300)); // same frame
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  assertEquals(t.lb.translateX.value, 20); // 30px / 1.5, not 10 then 20
  t.lb.handlePointerUp(pointer('pointerup', 1, 330, 300));
  t.stop();
});

test('closing while a move is waiting for its frame cancels it', async () => {
  const t = setup();
  await t.open();
  t.key('+'); // zoomed, so a drag pans
  t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.lb.handlePointerMove(pointer('pointermove', 1, 360, 300)); // a frame is now pending
  t.props.isOpen = false;
  await nextTick();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  assertEquals(t.lb.translateX.value, 0);
  t.stop();
});

test('with nothing focusable in the dialog, Tab keeps focus on the dialog itself', async () => {
  const t = setup();
  t.dialog.innerHTML = '<p>only text</p>';
  await t.open();
  const e = t.key('Tab', {}, t.dialog);
  assert(e.defaultPrevented);
  assertEquals(document.activeElement, t.dialog);
  t.stop();
});

test('Tab from outside the dialog pulls focus back in; Shift+Tab on the dialog goes to the end', async () => {
  const t = setup();
  await t.open();
  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();
  assert(t.key('Tab', {}, outside).defaultPrevented);
  assertEquals(document.activeElement, t.el('first'));

  t.dialog.focus();
  assert(t.key('Tab', { shiftKey: true }, t.dialog).defaultPrevented);
  assertEquals(document.activeElement, t.el('last'));
  t.stop();
});

test('without a dialog element the focus trap does nothing', async () => {
  const t = setup();
  t.lb.dialogRef.value = null;
  await t.open();
  const e = t.key('Tab');
  assert(e.defaultPrevented); // still kept inside: there is nowhere to go
  t.stop();
});

test('lifting one of three fingers keeps the pinch going', async () => {
  const t = setup();
  await t.open();
  t.lb.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.lb.handlePointerDown(pointer('pointerdown', 2, 400, 300));
  t.lb.handlePointerDown(pointer('pointerdown', 3, 500, 500));
  t.lb.handlePointerUp(pointer('pointerup', 3, 500, 500)); // two fingers still down
  t.lb.handlePointerMove(pointer('pointermove', 2, 500, 300)); // 100px → 200px apart
  assertEquals(t.lb.scale.value, 2);
  t.stop();
});

test('a new item while closed does not start loading it', async () => {
  const t = setup(0);
  t.props.item = items[1];
  await nextTick();
  assertEquals([t.lb.loading.value, t.lb.scale.value], [false, 1]);
  t.stop();
});

test('if nothing focusable had focus when it opened, closing leaves focus alone', async () => {
  const t = setup();
  // Shadow the inherited getter for the moment of opening, then remove the shadow.
  Object.defineProperty(document, 'activeElement', { configurable: true, get: () => null });
  try {
    await t.open();
  } finally {
    delete (document as unknown as Record<string, unknown>).activeElement;
  }
  t.props.isOpen = false;
  await nextTick(); // must not throw trying to focus nothing
  assertEquals(document.body.style.overflow, '');
  t.stop();
});

test('unmounting while open unlocks the page and stops listening for keys', async () => {
  const props = reactive({
    isOpen: false,
    item: items[0] as Item | undefined,
    drawnItems: items,
    fullImageBaseUrl: '/full/x/',
    collection: makeCollection('x'),
  });
  const emitted: string[] = [];
  const { result: lb, unmount } = mountComposable(() =>
    useViewer({ props, emit: ((e: string) => emitted.push(e)) as never })
  );
  props.isOpen = true;
  await nextTick();
  assertEquals(document.body.style.overflow, 'hidden');

  unmount();
  assertEquals(document.body.style.overflow, '');
  globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assertEquals(emitted, []);
  assertEquals(lb.scale.value, 1);
});
