import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { useBreakpoints } from './useBreakpoints.ts';
import { mountComposable } from '../../testing/mountComposable.ts';
import { withDom } from '../../testing/withDom.ts';

/** Pretend the window is `width` pixels wide and tell the page it was resized. */
function resizeTo(width: number) {
  Object.defineProperty(globalThis, 'innerWidth', { value: width, configurable: true });
  globalThis.dispatchEvent(new Event('resize'));
}

test('isMobile is measured when the component mounts', () =>
  withDom(() => {
    resizeTo(500);
    const narrow = mountComposable(() => useBreakpoints(1024));
    assertEquals(narrow.result.isMobile.value, true);
    narrow.unmount();

    resizeTo(1400);
    const wide = mountComposable(() => useBreakpoints(1024));
    assertEquals(wide.result.isMobile.value, false);
    wide.unmount();
  }));

test('the breakpoint itself counts as wide: mobile is strictly below it', () =>
  withDom(() => {
    resizeTo(1024);
    const at = mountComposable(() => useBreakpoints(1024));
    assertEquals(at.result.isMobile.value, false);
    resizeTo(1023);
    assertEquals(at.result.isMobile.value, true);
    at.unmount();
  }));

test('it follows the window as it is resized, until the component is gone', () =>
  withDom(() => {
    resizeTo(1400);
    const { result, unmount } = mountComposable(() => useBreakpoints(1024));
    resizeTo(600);
    assertEquals(result.isMobile.value, true);
    resizeTo(1400);
    assertEquals(result.isMobile.value, false);

    unmount();
    resizeTo(600);
    assertEquals(result.isMobile.value, false, 'still listening after unmount');
  }));

test('the width to switch at can be chosen', () =>
  withDom(() => {
    resizeTo(700);
    const { result, unmount } = mountComposable(() => useBreakpoints(640));
    assertEquals(result.isMobile.value, false);
    unmount();
  }));
