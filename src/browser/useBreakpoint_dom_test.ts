import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { NARROW_BELOW, useBreakpoint } from './useBreakpoint.ts';
import { mountComposable } from '../testing/mount.ts';

/** Pretend the window is `width` pixels wide and tell the page it was resized. */
function resizeTo(width: number) {
  Object.defineProperty(globalThis, 'innerWidth', { value: width, configurable: true });
  globalThis.dispatchEvent(new Event('resize'));
}

test('isNarrow is measured when the component mounts', () => {
  resizeTo(500);
  const narrow = mountComposable(() => useBreakpoint());
  assertEquals(narrow.result.isNarrow.value, true);
  narrow.unmount();

  resizeTo(1400);
  const wide = mountComposable(() => useBreakpoint());
  assertEquals(wide.result.isNarrow.value, false);
  wide.unmount();
});

test('the breakpoint itself counts as wide: mobile is strictly below it', () => {
  resizeTo(1024);
  const at = mountComposable(() => useBreakpoint());
  assertEquals(at.result.isNarrow.value, false);
  resizeTo(1023);
  assertEquals(at.result.isNarrow.value, true);
  at.unmount();
});

test('it follows the window as it is resized, until the component is gone', () => {
  resizeTo(1400);
  const { result, unmount } = mountComposable(() => useBreakpoint());
  resizeTo(600);
  assertEquals(result.isNarrow.value, true);
  resizeTo(1400);
  assertEquals(result.isNarrow.value, false);

  unmount();
  resizeTo(600);
  assertEquals(result.isNarrow.value, false, 'still listening after unmount');
});

test("the switch is at Tailwind's lg, 1024px", () => {
  assertEquals(NARROW_BELOW, 1024);
});
