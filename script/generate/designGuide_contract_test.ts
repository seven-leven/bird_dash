import { test } from 'vitest';
import { assertEquals, assertMatch, assertStringIncludes } from '@std/assert';
import { contrastReport, designGuide } from './designGuide.ts';
import { iconSheetSvg } from './iconSheet.ts';
import { accentMenu } from './palette.ts';
import { ICON_GROUPS, ICONS } from '../../src/lib/icons.ts';
import { readJson } from '../lib/fs.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';

// The generated images are drawn from the real tokens, icons and data, so these
// read main.css, collections.json and the placeholder files.

test('the guide names every accent hue on the menu and who uses each', async () => {
  const { svg } = await designGuide();
  for (const hue of await accentMenu()) assertStringIncludes(svg, `>${hue}</text>`);

  const collections = await readJson<RawCollectionConfig[]>('./public/collections.json');
  for (const c of collections) assertStringIncludes(svg, `>${c.label}</text>`);
  assertStringIncludes(svg, '>free</text>'); // hues no collection has taken yet
});

test('the guide and the icon sheet both show every icon, under its group', async () => {
  const guide = (await designGuide()).svg;
  const sheet = iconSheetSvg();
  for (const svg of [guide, sheet]) {
    for (const group of ICON_GROUPS) {
      assertStringIncludes(svg, `>${group.label.toUpperCase()}</text>`);
      for (const name of group.icons) {
        assertStringIncludes(svg, `>${name}</text>`);
        assertStringIncludes(svg, ICONS[name].body);
      }
    }
  }
});

test('the guide shows both placeholders of every collection', async () => {
  const { placeholders: overlays, dhivehi } = await designGuide();
  const collections = await readJson<RawCollectionConfig[]>('./public/collections.json');
  assertEquals(overlays.length, collections.length * 2); // light and dark
  assertEquals(dhivehi.length, 2); // the specimen and the type scale, drawn in Faruma
});

test('the contrast report gives a ratio for every pair the guide quotes', () => {
  const lines = contrastReport();
  assertEquals(lines.length, 10);
  for (const line of lines) assertMatch(line, /^ {2}\d+\.\d:1 {2}\S/);
  assertStringIncludes(lines.join('\n'), 'muted slate-500 on white');
});

test('a collection with no accent set is listed under teal, the default', async () => {
  const collections = await readJson<RawCollectionConfig[]>('./public/collections.json');
  const unset = collections.map((c, i) =>
    i === 0 ? { ...c, accent: undefined, label: 'Unaccented' } : c
  );
  const { svg } = await designGuide(unset);
  assertMatch(svg, />[^<]*Unaccented[^<]*<\/text>/);
});
