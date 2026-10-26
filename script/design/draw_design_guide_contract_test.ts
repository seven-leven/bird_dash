import { test } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals, assertMatch, assertStringIncludes } from '@std/assert';
import sharp from 'sharp';
import {
  contrastReport,
  designGuide,
  iconSheetSvg,
  writeDesignImages,
} from './draw_design_guide.ts';
import { logoSheetSvg, logoSvg } from './draw_logo.ts';
import { accentMenu } from './palette.ts';
import { ICON_GROUPS, ICONS } from '../../src/lib/icons.ts';
import { readJson } from '../lib/fs.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';

// The generated images are drawn from the real tokens, icons and data, so these
// read main.css, collections.json and the placeholder files.

// sharp caches open files; on Windows that would keep the temporary folder locked.
sharp.cache(false);

const size = async (path: string) => {
  const { width, height, format } = await sharp(await readFile(path)).metadata();
  return { width, height, format };
};

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

test('logoSvg is a standalone file in one colour, at the size asked for', () => {
  const mark = logoSvg('mark', '#123456');
  assert(mark.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"'));
  assertStringIncludes(mark, 'stroke="#123456"');
  assert(!mark.includes('currentColor'), 'a standalone file has no page to take a colour from');

  const tile = logoSvg('tile', '#123456', 512);
  assertStringIncludes(tile, 'width="512" height="512" viewBox="0 0 32 32"');
  assertStringIncludes(tile, 'fill="#123456"');
});

test('the logo sheet shows each version and the rules', () => {
  const sheet = logoSheetSvg();
  for (const label of ['MARK', 'TILE', 'HORIZONTAL LOCKUP', 'STACKED', 'SIZES', 'CLEAR SPACE']) {
    assertStringIncludes(sheet, `>${label}</text>`);
  }
  assertStringIncludes(sheet, 'recolour it with a collection accent');
  assertStringIncludes(sheet, '>Wildlife</tspan>');
});

test('`npm run design` writes every image, at the expected sizes, into the folder given', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_design_'));
  try {
    await writeDesignImages(dir, dir);

    const guide = await size(`${dir}/design-guide.png`);
    assertEquals([guide.width, guide.format], [1400, 'png']);
    assert(guide.height! > 1500, 'the guide should be a tall page');

    assertEquals((await size(`${dir}/icons.png`)).width, 1000);
    assertEquals(await size(`${dir}/logo.png`), { width: 1400, height: 900, format: 'png' });
    assertEquals(await size(`${dir}/logo/tile-512.png`), {
      width: 512,
      height: 512,
      format: 'png',
    });

    for (const name of ['mark.svg', 'mark-white.svg', 'tile.svg']) {
      const svg = await readFile(`${dir}/logo/${name}`, 'utf8');
      assert(svg.startsWith('<svg ') && svg.endsWith('</svg>\n'), name);
    }
    assertStringIncludes(await readFile(`${dir}/logo/mark-white.svg`, 'utf8'), '#ffffff');
    assertEquals(await size(`${dir}/favicon.png`), { width: 64, height: 64, format: 'png' });
    // Five drawings of 240px with 16px around and between them.
    assertEquals(await size(`${dir}/drawings.webp`), { width: 1296, height: 272, format: 'webp' });
    assertEquals(
      await readFile(`${dir}/favicon.svg`, 'utf8'),
      await readFile(`${dir}/logo/tile.svg`, 'utf8'),
      'the tab icon is the logo tile',
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the images in docs/ are up to date with the code that draws them', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_design_'));
  try {
    await writeDesignImages(dir, dir);
    // The SVG files are plain text, so they must match exactly.
    for (const name of ['mark.svg', 'mark-white.svg', 'tile.svg']) {
      assertEquals(
        await readFile(`./docs/assets/logo/${name}`, 'utf8'),
        await readFile(`${dir}/logo/${name}`, 'utf8'),
        `docs/assets/logo/${name} is stale: run \`npm run design\` and commit the result`,
      );
    }
    assertEquals(
      await readFile('./public/favicon.svg', 'utf8'),
      await readFile(`${dir}/favicon.svg`, 'utf8'),
      'public/favicon.svg is stale: run `npm run design` and commit the result',
    );
    // PNG bytes can differ between machines (fonts), so compare what is stable: the size.
    for (const name of ['design-guide.png', 'icons.png', 'logo.png', 'drawings.webp']) {
      assertEquals(
        await size(`./docs/assets/${name}`),
        await size(`${dir}/${name}`),
        `docs/${name} is stale: run \`npm run design\` and commit the result`,
      );
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a collection with no accent set is listed under teal, the default', async () => {
  const collections = await readJson<RawCollectionConfig[]>('./public/collections.json');
  const unset = collections.map((c, i) =>
    i === 0 ? { ...c, accent: undefined, label: 'Unaccented' } : c
  );
  const { svg } = await designGuide(unset);
  assertMatch(svg, />[^<]*Unaccented[^<]*<\/text>/);
});
