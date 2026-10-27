import { afterEach, test, vi } from 'vitest';
import { assertEquals } from '@std/assert';
import { scrollBehavior } from './scrollBehavior.ts';

afterEach(() => vi.unstubAllGlobals());

const prefers = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
  }));

test('scrolling is smooth by default', () => {
  prefers(false);
  assertEquals(scrollBehavior(), 'smooth');
});

test('scrolling jumps when the system asks for reduced motion', () => {
  prefers(true);
  assertEquals(scrollBehavior(), 'auto');
});

test('without matchMedia (an old browser, a test) scrolling is smooth', () => {
  vi.stubGlobal('matchMedia', undefined);
  assertEquals(scrollBehavior(), 'smooth');
});
