/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { resolveInitialTheme } from './useTheme.ts';

Deno.test('an explicit stored choice beats the OS preference', () => {
  assertEquals(resolveInitialTheme('dark', false), true);
  assertEquals(resolveInitialTheme('light', true), false);
});

Deno.test('with nothing stored, follow the OS preference', () => {
  assertEquals(resolveInitialTheme(null, true), true);
  assertEquals(resolveInitialTheme(null, false), false);
});

Deno.test('an unrecognised stored value is ignored', () => {
  assertEquals(resolveInitialTheme('purple', true), true);
  assertEquals(resolveInitialTheme('', false), false);
});
