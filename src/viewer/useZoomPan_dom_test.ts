import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { useZoomPan } from './useZoomPan.ts';
import { runInScope } from '../testing/mount.ts';
import { pointer } from '../testing/events.ts';

/** Zoom and pan at 1×, recording the swipes it reports. */
function mountZoomPan() {
  const swipes: string[] = [];
  const { value: zoom, stop } = runInScope(() => useZoomPan({ onSwipe: (d) => swipes.push(d) }));
  return { zoom, swipes, stop };
}

/** The pan is written once per frame: wait for it. */
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

test('a two-finger pinch zooms by how far the fingers spread', () => {
  const { zoom, stop } = mountZoomPan();
  zoom.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  zoom.handlePointerDown(pointer('pointerdown', 2, 400, 300)); // 100px apart
  zoom.handlePointerMove(pointer('pointermove', 2, 550, 300)); // 250px apart
  assertEquals(zoom.scale.value, 2.5);
  stop();
});

test('lifting one of three fingers keeps the pinch going', () => {
  const { zoom, stop } = mountZoomPan();
  zoom.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  zoom.handlePointerDown(pointer('pointerdown', 2, 400, 300));
  zoom.handlePointerDown(pointer('pointerdown', 3, 500, 500));
  zoom.handlePointerUp(pointer('pointerup', 3, 500, 500)); // two fingers still down
  zoom.handlePointerMove(pointer('pointermove', 2, 500, 300)); // 100px → 200px apart
  assertEquals(zoom.scale.value, 2);
  stop();
});

test('a finger swipe reports its direction; a mouse drag at 1x does not', () => {
  const { zoom, swipes, stop } = mountZoomPan();
  zoom.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
  zoom.handlePointerUp(pointer('pointerup', 1, 200, 300, 'mouse'));
  assertEquals(swipes, []);

  zoom.handlePointerDown(pointer('pointerdown', 1, 400, 300));
  zoom.handlePointerUp(pointer('pointerup', 1, 250, 305)); // to the left
  zoom.handlePointerDown(pointer('pointerdown', 1, 200, 300));
  zoom.handlePointerUp(pointer('pointerup', 1, 350, 305)); // to the right
  assertEquals(swipes, ['next', 'prev']);
  stop();
});

test('dragging while zoomed pans by the distance divided by the scale', async () => {
  const { zoom, stop } = mountZoomPan();
  zoom.zoomIn();
  zoom.zoomIn(); // 1.5x

  zoom.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  zoom.handlePointerMove(pointer('pointermove', 1, 360, 330)); // (60, 30) / 1.5
  await nextFrame();
  assertEquals([zoom.translateX.value, zoom.translateY.value, zoom.isDragging.value], [
    40,
    20,
    true,
  ]);

  zoom.handlePointerUp(pointer('pointerup', 1, 360, 330));
  assertEquals(zoom.isDragging.value, false);
  stop();
});

test('several moves in one frame are written once, with the latest position', async () => {
  const { zoom, stop } = mountZoomPan();
  zoom.zoomIn();
  zoom.zoomIn(); // 1.5x
  zoom.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  zoom.handlePointerMove(pointer('pointermove', 1, 315, 300));
  zoom.handlePointerMove(pointer('pointermove', 1, 330, 300)); // same frame
  await nextFrame();
  assertEquals(zoom.translateX.value, 20); // 30px / 1.5, not 10 then 20
  stop();
});

test('a move still waiting for its frame is dropped by a reset', async () => {
  const { zoom, stop } = mountZoomPan();
  zoom.zoomIn(); // zoomed, so a drag pans
  zoom.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  zoom.handlePointerMove(pointer('pointermove', 1, 360, 300)); // a frame is now pending
  zoom.reset();
  await nextFrame();
  assertEquals([zoom.translateX.value, zoom.scale.value], [0, 1]);
  stop();
});

test('the wheel zooms in steps, never below 1x or above 5x', () => {
  const { zoom, stop } = mountZoomPan();
  const wheel = (deltaY: number) => zoom.handleWheel({ deltaY } as WheelEvent);

  wheel(100); // zooming out at 1x stays at 1x
  assertEquals(zoom.scale.value, 1);
  wheel(-100);
  assert(zoom.scale.value > 1, 'the wheel zooms in');
  for (let i = 0; i < 100; i++) wheel(-100);
  assertEquals(zoom.scale.value, 5);
  for (let i = 0; i < 100; i++) wheel(100);
  assertEquals(zoom.scale.value, 1);
  stop();
});

test('events from a pointer that never went down are ignored', () => {
  const { zoom, swipes, stop } = mountZoomPan();
  zoom.handlePointerMove(pointer('pointermove', 7, 500, 500));
  zoom.handlePointerUp(pointer('pointerup', 7, 500, 500));
  assertEquals([zoom.scale.value, zoom.isDragging.value, swipes], [1, false, []]);
  stop();
});

test('a gesture that moved is reported once, so the click that ends it can be ignored', () => {
  const { zoom, stop } = mountZoomPan();
  zoom.handlePointerDown(pointer('pointerdown', 1, 400, 300, 'mouse'));
  zoom.handlePointerUp(pointer('pointerup', 1, 300, 300, 'mouse')); // moved 100px
  assertEquals([zoom.consumeGestureMoved(), zoom.consumeGestureMoved()], [true, false]);
  stop();
});

test('a tap (a finger that hardly moves) neither swipes nor counts as moving', () => {
  const { zoom, swipes, stop } = mountZoomPan();
  zoom.handlePointerDown(pointer('pointerdown', 1, 300, 300));
  zoom.handlePointerMove(pointer('pointermove', 1, 302, 301));
  zoom.handlePointerUp(pointer('pointerup', 1, 302, 301));
  assertEquals([swipes, zoom.consumeGestureMoved()], [[], false]);
  stop();
});
