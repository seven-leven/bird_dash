import { test } from 'vitest';
import { assertEquals, assertMatch, assertStringIncludes, assertThrows } from '@std/assert';
import {
  contrastReport,
  designGuide,
  formTokensFrom,
  readFormTokens,
  undrawnTile,
} from './designGuide.ts';
import { iconSheetSvg } from './iconSheet.ts';
import { accentMenu, STONE, UNDRAWN } from './palette.ts';
import { ICON_GROUPS, ICONS } from '../../src/ui/icons.ts';
import { readJson } from '../lib/fs.ts';
import type { CollectionEntry } from '../../src/data/files.ts';

// The generated images are drawn from the real tokens, icons and data, so these
// read utilities.css and collections.json.

test('the guide names every accent hue on the menu and who uses each', async () => {
  const { svg } = await designGuide();
  for (const hue of await accentMenu()) assertStringIncludes(svg, `>${hue}</text>`);

  const collections = await readJson<CollectionEntry[]>('./public/collections.json');
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

test("the guide shows every collection's undrawn tile, light and dark", async () => {
  const { svg, dhivehi } = await designGuide();
  const collections = await readJson<CollectionEntry[]>('./public/collections.json');
  for (const c of collections) {
    const body = ICONS[c.icon as keyof typeof ICONS].body;
    assertEquals(svg.split(body).length - 1 >= 2, true, `${c.id}: light and dark`);
  }
  for (const theme of ['light', 'dark'] as const) {
    assertStringIncludes(svg, `stroke="${STONE[UNDRAWN[theme].ink]}" stroke-width="1.5"`);
  }
  assertEquals(dhivehi.length, 2); // the specimen and the type scale, drawn in Faruma
});

test("an undrawn tile is the icon, centred at 56%, in the theme's ink on its grey", () => {
  const tile = undrawnTile('<path d="M0 0"/>', 'dark', 10, 20, 100);
  assertStringIncludes(tile, `fill="${STONE[UNDRAWN.dark.background]}"`);
  assertStringIncludes(tile, 'translate(32 42) scale(2.3333333333333335)');
  assertStringIncludes(tile, `stroke="${STONE[UNDRAWN.dark.ink]}"`);
});

test('the contrast report gives a ratio for every pair the guide quotes', () => {
  const lines = contrastReport();
  assertEquals(lines.length, 12);
  for (const line of lines) assertMatch(line, /^ {2}\d+\.\d:1 {2}\S/);
  assertStringIncludes(lines.join('\n'), 'muted stone-500 on white');
});

test('a collection with no accent set is listed under teal, the default', async () => {
  const collections = await readJson<CollectionEntry[]>('./public/collections.json');
  const unset = collections.map((c, i) =>
    i === 0 ? { ...c, accent: undefined, label: 'Unaccented' } : c
  );
  const { svg } = await designGuide(unset);
  assertMatch(svg, />[^<]*Unaccented[^<]*<\/text>/);
});

test('the guide quotes the corner radii and the speeds the site’s CSS defines', async () => {
  const form = await readFormTokens();
  assertEquals(form, { controlPx: 6, cardPx: 12, fastMs: 150, slowMs: 300 });
  const { svg } = await designGuide();
  for (
    const quoted of [
      `rounded-control · ${form.controlPx}px`,
      `rounded-card · ${form.cardPx}px`,
      `duration-fast · ${form.fastMs}ms`,
      `duration-slow · ${form.slowMs}ms`,
    ]
  ) assertStringIncludes(svg, quoted);
});

test('a form token missing from the CSS fails the guide instead of going stale on it', () => {
  const tokens = '--wi-radius-control: 0.375rem; --wi-radius-card: 0.75rem;';
  const main = '@utility duration-fast {\n  transition-duration: 150ms;\n}\n' +
    '@utility duration-slow {\n  transition-duration: 300ms;\n}';
  assertEquals(formTokensFrom(tokens, main).cardPx, 12);
  assertThrows(() => formTokensFrom('', main), Error, 'tokens.css has no --wi-radius-control');
  assertThrows(() => formTokensFrom(tokens, ''), Error, 'utilities.css has no duration-fast');
});
