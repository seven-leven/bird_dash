// J8 Theme: dark and back; the choice is remembered on the next visit. Everything follows the
// class on <html>, the icons standing in for undrawn drawings included (no image per theme).
import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';

test('the theme switch turns the page dark and back', async () => {
  using app = await renderApp();
  assert(!document.documentElement.classList.contains('dark'));

  app.control('Switch to dark mode').click();
  await app.until(() => document.documentElement.classList.contains('dark'), 'the dark theme');

  app.control('Switch to light mode').click();
  await app.until(() => !document.documentElement.classList.contains('dark'), 'the light theme');
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
});
