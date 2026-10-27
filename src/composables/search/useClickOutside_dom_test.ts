import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { useClickOutside } from './useClickOutside.ts';
import { withDom } from '../../testing/withDom.ts';
import { mountComposable } from '../../testing/mount.ts';

/** A box with a child, a separate element outside it, and a way to press the mouse on any of them. */
function page() {
  const box = document.createElement('div');
  const inside = document.createElement('span');
  const outside = document.createElement('p');
  box.append(inside);
  document.body.append(box, outside);
  const press = (el: Element) => el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  return { box, inside, outside, press };
}

test('a press outside the target calls the handler; a press inside it does not', () =>
  withDom(() => {
    const { box, inside, outside, press } = page();
    let calls = 0;
    const { unmount } = mountComposable(() => useClickOutside(() => box, () => calls++));

    press(inside);
    press(box);
    assertEquals(calls, 0);
    press(outside);
    assertEquals(calls, 1);
    unmount();
  }));

test('while there is no target yet, nothing happens', () =>
  withDom(() => {
    const { outside, press } = page();
    let calls = 0;
    const { unmount } = mountComposable(() => useClickOutside(() => null, () => calls++));
    press(outside);
    assertEquals(calls, 0);
    unmount();
  }));

test('after the component is gone, the listener is gone too', () =>
  withDom(() => {
    const { box, outside, press } = page();
    let calls = 0;
    const { unmount } = mountComposable(() => useClickOutside(() => box, () => calls++));
    unmount();
    press(outside);
    assertEquals(calls, 0);
  }));
