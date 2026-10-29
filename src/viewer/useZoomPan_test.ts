import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { clampScale, pinchScale, swipeDirection } from './useZoomPan.ts';

test('a zoom in range is kept as it is', () => {
  assertEquals(clampScale(1.25), 1.25);
  assertEquals(clampScale(3), 3);
  assertEquals(clampScale(5), 5);
});

test('the zoom stops at 5', () => {
  assertEquals(clampScale(6), 5);
  assertEquals(clampScale(100), 5);
});

test('a zoom at or below 1 snaps to 1', () => {
  assertEquals(clampScale(1), 1);
  assertEquals(clampScale(0.9), 1);
  assertEquals(clampScale(0.3), 1);
  assertEquals(clampScale(-2), 1);
});

test('a zoom of NaN falls back to 1 instead of poisoning the transform', () => {
  assertEquals(clampScale(NaN), 1);
});

test('spreading two fingers zooms in, and pinching zooms out', () => {
  assertEquals(pinchScale(1, 100, 200), 2); // fingers twice as far apart
  assertEquals(pinchScale(2, 100, 50), 1); // half as far apart
  assertEquals(pinchScale(1.5, 100, 100), 1.5); // no movement, no change
});

test('a pinch that starts at zero distance does not divide by zero', () => {
  assertEquals(pinchScale(1.5, 0, 80), 1.5);
});

test('a long horizontal drag pages, and to the left is next', () => {
  assertEquals(swipeDirection(-120, 10), 'next');
  assertEquals(swipeDirection(120, -10), 'prev');
});

test('a short or mostly vertical drag is not a swipe', () => {
  assertEquals(swipeDirection(30, 0), null); // under the threshold
  assertEquals(swipeDirection(-80, 70), null); // more diagonal than horizontal
  assertEquals(swipeDirection(0, 200), null); // a vertical scroll
});

test('the swipe threshold can be set', () => {
  assertEquals(swipeDirection(-40, 0, 30), 'next');
  assertEquals(swipeDirection(-40, 0, 60), null);
});
