// J8 Theme: dark and back; the choice is remembered on the next visit; the placeholders follow.
import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';

const placeholder = () =>
  document.querySelector<HTMLImageElement>('img[alt="Garganey (not drawn yet)"]')!;

test('the theme switch turns the page dark and back, placeholders included', async () => {
  using app = await renderApp();
  assert(!document.documentElement.classList.contains('dark'));
  assert(!placeholder().src.includes('-dark'));

  app.control('Switch to dark mode').click();
  await app.until(() => document.documentElement.classList.contains('dark'), 'the dark theme');
  await app.until(() => placeholder().src.includes('-dark'), 'the dark placeholder');

  app.control('Switch to light mode').click();
  await app.until(() => !document.documentElement.classList.contains('dark'), 'the light theme');
  assert(!placeholder().src.includes('-dark'));
});

test('the choice is remembered on the next visit', async () => {
  {
    using app = await renderApp();
    app.control('Switch to dark mode').click();
    await app.until(() => document.documentElement.classList.contains('dark'), 'the dark theme');
  }
  document.documentElement.classList.remove('dark'); // a new page starts unstyled

  using app = await renderApp();
  await app.until(() => document.documentElement.classList.contains('dark'), 'dark again');
  assertEquals(app.control('Switch to light mode').tagName, 'BUTTON');
  assertStringIncludes(placeholder().src, '-dark');
});
