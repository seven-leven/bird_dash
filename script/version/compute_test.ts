/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { formatVersion } from './compute.ts';

Deno.test('formatVersion zero-pads patch and drawn count to 3 digits', () => {
  assertEquals(formatVersion({ major: 0, minor: 8, patch: 5, count: 18 }), '0.8.005+018');
});

Deno.test('formatVersion leaves 3-digit values intact', () => {
  assertEquals(formatVersion({ major: 1, minor: 2, patch: 133, count: 276 }), '1.2.133+276');
});
