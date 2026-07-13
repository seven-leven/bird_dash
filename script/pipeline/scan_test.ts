/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { toIds } from './scan.ts';

Deno.test('toIds strips .png/.webp (case-insensitive) to bare ids', () => {
  assertEquals(
    [...toIds(['001.png', '002.webp', '003.PNG', '004.WEBP'])].sort(),
    ['001', '002', '003', '004'],
  );
});

Deno.test('toIds dedupes ids shared across extensions', () => {
  assertEquals([...toIds(['001.png', '001.webp'])], ['001']);
});
