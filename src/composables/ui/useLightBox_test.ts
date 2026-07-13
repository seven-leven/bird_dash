/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { clampScale } from './useLightBox.ts';

Deno.test('clampScale: values in range pass through', () => {
  assertEquals(clampScale(1.25), 1.25);
  assertEquals(clampScale(3), 3);
  assertEquals(clampScale(5), 5);
});

Deno.test('clampScale: caps at 5', () => {
  assertEquals(clampScale(6), 5);
  assertEquals(clampScale(100), 5);
});

Deno.test('clampScale: anything at or below 1 snaps to 1', () => {
  assertEquals(clampScale(1), 1);
  assertEquals(clampScale(0.9), 1);
  assertEquals(clampScale(0.3), 1);
  assertEquals(clampScale(-2), 1);
});
