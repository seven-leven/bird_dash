import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { nextTick } from 'vue';
import { BAR_COLOR, useTheme } from './useTheme.ts';
import { runInScope } from '../testing/mount.ts';

const isDarkClass = () => document.documentElement.classList.contains('dark');
const barColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

/** Pretend the OS reports a colour-scheme preference. */
const osPrefersDark = (dark: boolean) => {
  globalThis.matchMedia = (() => ({ matches: dark })) as unknown as typeof matchMedia;
};

test('with nothing stored, the OS preference decides and nothing is saved', async () => {
  osPrefersDark(true);
  const { value: t, stop } = runInScope(() => useTheme());
  assertEquals(t.theme.isDark, true);
  assertEquals(isDarkClass(), true);
  assertEquals(localStorage.getItem('theme'), null); // only an explicit toggle is saved
  stop();
  await nextTick();
});

test('a stored choice wins over the OS preference', () => {
  osPrefersDark(true);
  localStorage.setItem('theme', 'light');
  const { value: t, stop } = runInScope(() => useTheme());
  assertEquals(t.theme.isDark, false);
  assertEquals(isDarkClass(), false);
  stop();
});

test('toggling flips the class and persists the choice', async () => {
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
});

test("the phone's browser bar follows the theme", async () => {
  osPrefersDark(false);
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.append(meta);
  const { value: t, stop } = runInScope(() => useTheme());
  assertEquals(barColor(), BAR_COLOR.light);
  t.toggleTheme();
  await nextTick();
  assertEquals(barColor(), BAR_COLOR.dark);
  stop();
});

test('blocked storage does not break the theme', async () => {
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
});

test('a browser without matchMedia starts light', async () => {
  const original = globalThis.matchMedia;
  delete (globalThis as { matchMedia?: unknown }).matchMedia;
  try {
    const { value: t, stop } = runInScope(() => useTheme());
    assertEquals(t.theme.isDark, false);
    stop();
    await nextTick();
  } finally {
    globalThis.matchMedia = original;
  }
});
