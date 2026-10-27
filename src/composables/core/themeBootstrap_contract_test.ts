import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert } from '@std/assert';
import { BAR_COLOR } from './useTheme.ts';

// index.html sets the theme before first paint, with an inline script that cannot import
// useTheme; this keeps the two from drifting apart.

test("index.html's theme script colours the browser bar as useTheme does", async () => {
  const html = await readFile('./index.html', 'utf8');
  assert(html.includes('<meta name="theme-color"'), 'index.html has no theme-color meta tag');
  for (const color of [BAR_COLOR.light, BAR_COLOR.dark]) {
    assert(html.includes(`'${color}'`), `index.html's theme script does not set ${color}`);
  }
});
