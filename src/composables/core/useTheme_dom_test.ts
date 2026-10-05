/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { nextTick } from 'vue';
import { useTheme } from './useTheme.ts';
import { runInScope } from '../../../script/test/helpers/fixtures.ts';
import { withDom } from '../../../script/test/helpers/dom.ts';

const isDarkClass = () => document.documentElement.classList.contains('dark');

/** Pretend the OS reports a colour-scheme preference. */
const osPrefersDark = (dark: boolean) => {
  globalThis.matchMedia = (() => ({ matches: dark })) as unknown as typeof matchMedia;
};

Deno.test('with nothing stored, the OS preference decides and nothing is saved', () =>
  withDom(async () => {
    osPrefersDark(true);
    const { value: t, stop } = runInScope(() => useTheme());
    assertEquals(t.theme.isDark, true);
    assertEquals(isDarkClass(), true);
    assertEquals(localStorage.getItem('theme'), null); // only an explicit toggle is saved
    stop();
    await nextTick();
  }));

Deno.test('a stored choice wins over the OS preference', () =>
  withDom(() => {
    osPrefersDark(true);
    localStorage.setItem('theme', 'light');
    const { value: t, stop } = runInScope(() => useTheme());
    assertEquals(t.theme.isDark, false);
    assertEquals(isDarkClass(), false);
    stop();
  }));

Deno.test('toggling flips the class and persists the choice', () =>
  withDom(async () => {
    osPrefersDark(false);
    const { value: t, stop } = runInScope(() => useTheme());
    assertEquals(isDarkClass(), false);

    t.toggleTheme();
    await nextTick();
    assertEquals(isDarkClass(), true);
    assertEquals(localStorage.getItem('theme'), 'dark');

    t.toggleTheme();
    await nextTick();
    assertEquals(isDarkClass(), false);
    assertEquals(localStorage.getItem('theme'), 'light');
    stop();
  }));

Deno.test('blocked storage does not break the theme', () =>
  withDom(async () => {
    osPrefersDark(false);
    // e.g. private mode / sandboxed iframe: any access to localStorage throws
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    const { value: t, stop } = runInScope(() => useTheme());
    t.toggleTheme(); // must not throw
    await nextTick();
    assertEquals(isDarkClass(), true);
    stop();
  }));
