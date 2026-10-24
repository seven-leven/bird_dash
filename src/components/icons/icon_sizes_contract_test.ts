import { test } from 'vitest';
import { glob, readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';

// docs/DESIGN.md §08: icons come in four sizes, by role — 12px beside a label,
// 16px in a control, 20 or 24px standing alone. Written as size-3 to size-6, so a
// fifth size (w-4.5, h-3.5) shows up here rather than on the page.
const SIZES = new Set(['size-3', 'size-4', 'size-5', 'size-6']);

test('every icon in a component is drawn at one of the four sizes', async () => {
  const offScale: string[] = [];
  let icons = 0;
  for await (const file of glob('src/**/*.vue')) {
    const source = await readFile(file, 'utf8');
    for (const tag of source.matchAll(/<(?:Icon|CollectionIcon|LogoMark)\b[^>]*>/g)) {
      const cls = /\bclass="([^"]*)"/.exec(tag[0])?.[1];
      if (cls === undefined) continue; // sized by its parent (.with-icon) or the caller
      icons++;
      const sizes = cls.split(/\s+/).filter((c) => /^(size|w|h)-/.test(c));
      if (sizes.length !== 1 || !SIZES.has(sizes[0])) offScale.push(`${file}: ${cls}`);
    }
  }
  assert(icons > 20, `expected to find the site's icons, found ${icons}`);
  assertEquals(offScale, []);
});
