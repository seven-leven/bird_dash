// What useViewer adds to the parts it is made of: which key does what, paging through the
// drawings and their images, loading each image, and when a click closes it. The parts have their
// own files: the dialog and its keys (useDialogKeys_dom_test.ts), zoom and pan
// (useZoomPan_dom_test.ts) and where a drawing sits (useDrawingNav_test.ts).
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { nextTick, reactive } from 'vue';
import { useViewer } from './useViewer.ts';
import { at, makeCollection, makeItem } from '../testing/fixtures.ts';
import type { Item } from '../domain/toCollectionItems.ts';
import { runInScope } from '../testing/mount.ts';
import { pointer, press } from '../testing/events.ts';

const items = [
  makeItem({ itemId: '001', drawnTime: at(2025, 1, 10) }),
  makeItem({ itemId: '002', drawnTime: at(2025, 2, 10) }),
  makeItem({ itemId: '003', drawnTime: at(2025, 3, 10) }),
];

/** The viewer on the drawing at `startAt`, closed, with a dialog element; records what it emits. */
function mountViewer(startAt = 0) {
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
  dialog.innerHTML = '<button id="first">a</button>';
  document.body.append(dialog);

  const { value: viewer, stop } = runInScope(() => useViewer({ props, emit }));
  viewer.dialogRef.value = dialog;

  const key = (k: string) => press(k, document.body);
  const open = async () => {
    props.isOpen = true;
    await nextTick();
    await nextTick();
  };
  /** Which drawings it asked to move to, by id. */
  const movedTo = () => emitted.filter(([e]) => e === 'update:item').map(([, p]) => p?.itemId);
  return { props, viewer, emitted, dialog, key, open, movedTo, stop };
}

const clickOn = (target: object, currentTarget: object = target) =>
  ({ target, currentTarget }) as unknown as MouseEvent;

test('+ / - / 0 zoom, and Escape asks the parent to close', async () => {
  const t = mountViewer();
  await t.open();

  t.key('+');
  t.key('+');
  assertEquals(t.viewer.scale.value, 1.5);
  t.key('-');
  assertEquals(t.viewer.scale.value, 1.25);
  t.key('0');
  assertEquals(t.viewer.scale.value, 1);

  t.key('Escape');
  assertEquals(t.emitted, [['close', undefined]]);
  t.stop();
});

test('arrow keys page through the drawn items and stop at the ends', async () => {
  const t = mountViewer(0);
  await t.open();
  t.key('ArrowLeft'); // already first: nothing to go back to
  t.key('ArrowRight');
  assertEquals(t.movedTo(), ['002']);
  t.stop();
});

test('up and down page too, as left and right do, and keep the page from scrolling', async () => {
  const t = mountViewer(1);
  await t.open();
  const up = t.key('ArrowUp');
  const down = t.key('ArrowDown');
  assertEquals(t.movedTo(), ['001', '003']);
  assert(up.defaultPrevented && down.defaultPrevented, 'the arrows do not scroll the page');
  t.stop();
});

test('a finger swipe pages to the next or previous drawing, and not past the first', async () => {
  const t = mountViewer(1);
  await t.open();
  t.viewer.handlePointerDown(pointer('pointerdown', 1, 400, 300));
  t.viewer.handlePointerUp(pointer('pointerup', 1, 250, 305)); // left: next
  t.viewer.handlePointerDown(pointer('pointerdown', 1, 200, 300));
  t.viewer.handlePointerUp(pointer('pointerup', 1, 350, 305)); // right: back
  assertEquals(t.movedTo(), ['003', '001']);
  t.stop();

  const first = mountViewer(0);
  await first.open();
  first.viewer.handlePointerDown(pointer('pointerdown', 1, 200, 300));
  first.viewer.handlePointerUp(pointer('pointerup', 1, 350, 305));
  assertEquals(first.emitted, []);
  first.stop();
});

test('a click on empty space closes; a click that bubbled from a child does not', async () => {
  const t = mountViewer();
  await t.open();
  t.viewer.handleBackdropClick(clickOn(t.dialog.querySelector('#first')!, t.dialog));
  assertEquals(t.emitted, []);
  t.viewer.handleBackdropClick(clickOn(t.dialog));
  assertEquals(t.emitted.map(([e]) => e), ['close']);
  t.stop();
});

test('the click that ends a drag does not close; the next plain click does', async () => {
  const t = mountViewer();
  await t.open();
  t.viewer.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
  t.viewer.handlePointerUp(pointer('pointerup', 1, 300, 300, 'mouse')); // moved 100px
  t.viewer.handleBackdropClick(clickOn(t.dialog));
  assertEquals(t.emitted, [], 'a drag was treated as a click');

  t.viewer.handlePointerDown(pointer('pointerdown', 2, 400, 300, 'mouse'));
  t.viewer.handlePointerUp(pointer('pointerup', 2, 402, 301, 'mouse')); // a real click
  t.viewer.handleBackdropClick(clickOn(t.dialog));
  assertEquals(t.emitted.map(([e]) => e), ['close']);
  t.stop();
});

test('position reports where the open item sits among the drawn items', () => {
  const t = mountViewer(1);
  assertEquals(t.viewer.position.value, '2 of 3');
  t.props.item = undefined;
  assertEquals(t.viewer.position.value, '');
  t.stop();
});

test('previous and next are offered only where there is somewhere to go', () => {
  const first = mountViewer(0);
  assertEquals([first.viewer.hasPrevious.value, first.viewer.hasNext.value], [false, true]);
  first.stop();

  const last = mountViewer(2);
  assertEquals([last.viewer.hasPrevious.value, last.viewer.hasNext.value], [true, false]);
  last.viewer.goToNext(); // nothing after the last item
  assertEquals(last.emitted, []);
  last.stop();

  const none = mountViewer(0);
  none.props.item = undefined;
  assertEquals([none.viewer.hasPrevious.value, none.viewer.hasNext.value], [false, false]);
  none.stop();
});

test('the image URL is empty while closed and points at the full image while open', async () => {
  const t = mountViewer(1);
  assertEquals(t.viewer.imageUrl.value, '');
  await t.open();
  assertEquals(t.viewer.imageUrl.value, '/full/x/002.webp');
  t.stop();
});

test('opening shows the spinner until the image loads; a failed image shows an error', async () => {
  const t = mountViewer();
  await t.open();
  assertEquals([t.viewer.loading.value, t.viewer.error.value], [true, null]);

  t.viewer.handleImageLoad();
  assertEquals([t.viewer.loading.value, t.viewer.error.value], [false, null]);

  t.props.item = items[1]; // paging starts a new load
  await nextTick();
  assertEquals(t.viewer.loading.value, true);
  t.viewer.handleImageError();
  assertEquals([t.viewer.loading.value, t.viewer.error.value], [false, 'Image not found']);
  t.stop();
});

test('paging to another item resets the zoom', async () => {
  const t = mountViewer();
  await t.open();
  t.viewer.zoomIn();
  t.viewer.zoomIn();
  assert(t.viewer.scale.value > 1, 'zoomed in before paging');
  t.props.item = items[1];
  await nextTick();
  assertEquals(t.viewer.scale.value, 1);
  t.stop();
});

test('a new item while closed does not start loading it', async () => {
  const t = mountViewer(0);
  t.props.item = items[1];
  await nextTick();
  assertEquals([t.viewer.loading.value, t.viewer.scale.value], [false, 1]);
  t.stop();
});

test('closing while a pan is waiting for its frame drops it', async () => {
  const t = mountViewer();
  await t.open();
  t.key('+'); // zoomed, so a drag pans
  t.viewer.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  t.viewer.handlePointerMove(pointer('pointermove', 1, 360, 300)); // a frame is now pending
  t.props.isOpen = false;
  await nextTick();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  assertEquals(t.viewer.translateX.value, 0);
  t.stop();
});

test("the arrows page through an item's images, each loaded afresh at fit, then on to the next", async () => {
  const t = mountViewer(0);
  t.props.item = makeItem({ itemId: '001', imageIds: ['001', '001-2'] });
  t.props.drawnItems = [t.props.item, items[1]!];
  await t.open();
  assertEquals(t.viewer.imageUrl.value, '/full/x/001.webp');
  t.viewer.handleImageLoad();
  t.viewer.zoomIn();

  t.key('ArrowRight');
  await nextTick();
  assertEquals(t.viewer.imageUrl.value, '/full/x/001-2.webp');
  assertEquals([t.viewer.loading.value, t.viewer.scale.value], [true, 1]);
  assertEquals(t.viewer.imagePosition.value, 'image 2 of 2');
  assertEquals(t.emitted, []);

  t.key('ArrowRight');
  assertEquals(t.movedTo(), ['002']);
  t.stop();
});
