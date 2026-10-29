import { test } from 'vitest';
import { glob, readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';

// Faruma's vowel marks reach about 0.5em below the baseline, more than twice what
// the font declares. A Dhivehi line needs a line height of about 1.8 or more, or a
// clipped (truncate) caption cuts the marks off (docs/DESIGN.md §02).

test('.font-dhivehi gives Thaana the line height its marks need', async () => {
  const css = await readFile('./src/styles/base.css', 'utf8');
  const rule = /\.font-dhivehi \{([^}]*)\}/.exec(css)?.[1];
  assert(rule, 'base.css has no .font-dhivehi rule');
  const lineHeight = Number(/line-height: ([\d.]+);/.exec(rule)?.[1]);
  assert(lineHeight >= 1.8, `.font-dhivehi line-height is ${lineHeight}, below 1.8`);
});

test('no Dhivehi text is given a tighter line', async () => {
  const tightened: string[] = [];
  for await (const file of glob('src/**/*.vue')) {
    const source = await readFile(file, 'utf8');
    for (const [cls] of source.matchAll(/class="[^"]*\bfont-dhivehi\b[^"]*"/g)) {
      if (/\bleading-/.test(cls)) tightened.push(`${file}: ${cls}`);
    }
  }
  assertEquals(tightened, []);
});
