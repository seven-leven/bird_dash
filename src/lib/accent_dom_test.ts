import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { applyAccent, DEFAULT_ACCENT } from './accent.ts';

test('applyAccent sets the collection accent on <html>', () => {
  applyAccent('blue');
  assertEquals(document.documentElement.dataset.accent, 'blue');
  applyAccent('rose');
  assertEquals(document.documentElement.dataset.accent, 'rose');
});

test('applyAccent falls back to the default when a collection names none', () => {
  applyAccent('blue');
  applyAccent(undefined);
  assertEquals(document.documentElement.dataset.accent, DEFAULT_ACCENT);
  applyAccent('  ');
  assertEquals(document.documentElement.dataset.accent, DEFAULT_ACCENT);
});
