import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { resolveInitialTheme } from './useTheme.ts';

test('an explicit stored choice beats the OS preference', () => {
  assertEquals(resolveInitialTheme('dark', false), true);
  assertEquals(resolveInitialTheme('light', true), false);
});

test('with nothing stored, follow the OS preference', () => {
  assertEquals(resolveInitialTheme(null, true), true);
  assertEquals(resolveInitialTheme(null, false), false);
});

test('an unrecognised stored value is ignored', () => {
  assertEquals(resolveInitialTheme('purple', true), true);
  assertEquals(resolveInitialTheme('', false), false);
});
