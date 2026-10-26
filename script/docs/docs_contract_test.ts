import { test } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { assert, assertEquals } from '@std/assert';
import { liveNames } from './live_blocks.ts';
import { accentHues, rampOf } from './accents.ts';

// The docs site builds from these files; a mistake in them would otherwise surface only
// when the site is built, or as an empty section on it.

test('every live section in the docs names a component the docs theme registers', async () => {
  const theme = await readFile('./docs/.vitepress/theme/index.ts', 'utf8');
  const registered = new Set([...theme.matchAll(/app\.component\('(\w+)'/g)].map((m) => m[1]));
  const pages = (await readdir('./docs', { recursive: true })).filter((f) => f.endsWith('.md'));
  const asked = new Set<string>();
  for (const page of pages) {
    for (const name of liveNames(await readFile(`./docs/${page}`, 'utf8'))) {
      assert(registered.has(name), `docs/${page}: <!-- live: ${name} --> is not registered`);
      asked.add(name);
    }
  }
  // And no component is registered that no page uses.
  assertEquals([...registered].filter((n) => !asked.has(n)), []);
});

test('every accent in main.css, and slate, has a full ramp in Tailwind', async () => {
  const themeCss = await readFile(
    createRequire(import.meta.url).resolve('tailwindcss/theme.css'),
    'utf8',
  );
  const hues = accentHues(await readFile('./src/styles/main.css', 'utf8'));
  assert(hues.length > 0, 'main.css has no accent palettes');
  for (const name of ['slate', ...hues]) assertEquals(rampOf(name, themeCss).colors.length, 11);
});
