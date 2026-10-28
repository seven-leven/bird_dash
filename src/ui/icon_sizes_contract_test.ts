import { test } from 'vitest';
import { glob, readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';

// docs/DESIGN.md §08: icons come in four sizes, by role — 12px beside a label,
// 16px in a control, 20 or 24px standing alone. Written as size-3 to size-6, so a
// fifth size (w-4.5, h-3.5) shows up here rather than on the page. One more, the
// collection's emblem at the top of the sidebar (40px, size-10), is the largest icon
// on the page and appears exactly once; and what stands in for an undrawn drawing grows
// with its tile (size-[56%]), in the tile alone.
const SIZES = new Set(['size-3', 'size-4', 'size-5', 'size-6', 'size-10', 'size-[56%]']);

test('every icon in a component is drawn at one of the four sizes', async () => {
  const offScale: string[] = [];
  const emblems: string[] = [];
  const standIns: string[] = [];
  let icons = 0;
  for await (const file of glob('src/**/*.vue')) {
    const source = await readFile(file, 'utf8');
    for (const tag of source.matchAll(/<(?:Icon|CollectionIcon|LogoMark)\b[^>]*>/g)) {
      const cls = /\bclass="([^"]*)"/.exec(tag[0])?.[1];
      if (cls === undefined) continue; // sized by its parent (.with-icon) or the caller
      icons++;
      const sizes = cls.split(/\s+/).filter((c) => /^(size|w|h)-/.test(c));
      if (sizes.length !== 1 || !SIZES.has(sizes[0])) offScale.push(`${file}: ${cls}`);
      if (sizes[0] === 'size-10') emblems.push(file);
      if (sizes[0] === 'size-[56%]') standIns.push(file);
    }
  }
  assert(icons > 20, `expected to find the site's icons, found ${icons}`);
  assertEquals(offScale, []);
  assertEquals(emblems.map((f) => f.replace(/\\/g, '/')), ['src/shell/SideNav.vue']);
  assertEquals(standIns.map((f) => f.replace(/\\/g, '/')), ['src/gallery/ItemTile.vue']);
});
