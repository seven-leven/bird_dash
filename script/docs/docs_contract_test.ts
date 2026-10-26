import { test } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { assert, assertEquals } from '@std/assert';
import { liveNames } from './liveBlocks.ts';
import { accentHues, missingSteps } from './accents.ts';

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

test('every accent in accents.css, and slate, has a full ramp in Tailwind', async () => {
  const themeCss = await readFile(
    createRequire(import.meta.url).resolve('tailwindcss/theme.css'),
    'utf8',
  );
  const hues = accentHues(await readFile('./src/styles/accents.css', 'utf8'));
  assert(hues.length > 0, 'accents.css has no accent palettes');
  for (const name of ['slate', ...hues]) {
    assertEquals(missingSteps(name, themeCss), [], `${name} is missing steps in Tailwind`);
  }
});

test("the docs take Tailwind's theme variables only, never its preflight", async () => {
  // Preflight resets headings, lists and tables, which VitePress's own styles need.
  const dir = './docs/.vitepress/theme';
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.css'))) {
    const css = (await readFile(`${dir}/${file}`, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    const imports = [...css.matchAll(/@import\s+['"](tailwindcss[^'"]*)['"]/g)].map((m) => m[1]);
    for (const what of imports) {
      assertEquals(what, 'tailwindcss/theme.css', `${file} imports ${what}`);
    }
  }
});
