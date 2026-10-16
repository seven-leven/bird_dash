import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { applyAccent, DEFAULT_ACCENT } from './accent.ts';
import { withDom } from '../test_helpers/with_dom.ts';

test('applyAccent sets the collection accent on <html>', () =>
  withDom(() => {
    applyAccent('blue');
    assertEquals(document.documentElement.dataset.accent, 'blue');
    applyAccent('rose');
    assertEquals(document.documentElement.dataset.accent, 'rose');
  }));

test('applyAccent falls back to the default when a collection names none', () =>
  withDom(() => {
    applyAccent('blue');
    applyAccent(undefined);
    assertEquals(document.documentElement.dataset.accent, DEFAULT_ACCENT);
    applyAccent('  ');
    assertEquals(document.documentElement.dataset.accent, DEFAULT_ACCENT);
  }));
