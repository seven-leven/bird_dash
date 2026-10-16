import { test } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import sharp from 'sharp';
import { cli, placeholderSvg, THEMES, writePlaceholders } from './draw_placeholders.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';

// Files are read into memory and the cache is off, so Windows can delete the temporary folder.
sharp.cache(false);

const BODY = '<path d="M1 1h2"/>';

test('placeholderSvg draws the icon on a 512px square in the theme colours', () => {
  for (const theme of ['light', 'dark'] as const) {
    const svg = placeholderSvg(BODY, theme);
    assertStringIncludes(svg, 'width="512" height="512"');
    assertStringIncludes(svg, `fill="${THEMES[theme].background}"`);
    assertStringIncludes(svg, `stroke="${THEMES[theme].ink}"`);
    assertStringIncludes(svg, BODY);
  }
});

test('placeholderSvg defaults to the light theme', () => {
  assertStringIncludes(placeholderSvg(BODY), `fill="${THEMES.light.background}"`);
});

test('the light and dark files differ only by the "-dark" suffix', () => {
  assert(THEMES.light.suffix === '' && THEMES.dark.suffix === '-dark');
});

/** Run `fn` with a fresh temporary directory, removed afterwards. */
async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_placeholders_'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const collection = (id: string, icon?: string) => ({ id, icon }) as RawCollectionConfig;

test('writePlaceholders draws a light and a dark 512px WebP per collection, skipping ones with no icon', () =>
  withTempDir(async (dir) => {
    const log: string[] = [];
    const written = await writePlaceholders([collection('birds', 'bird'), collection('misc')], {
      dir,
      log: (line) => log.push(line),
    });

    assertEquals(written, [`${dir}/birds.webp`, `${dir}/birds-dark.webp`]);
    assertEquals((await readdir(dir)).sort(), ['birds-dark.webp', 'birds.webp']);
    for (const path of written) {
      const { width, height, format } = await sharp(await readFile(path)).metadata();
      assertEquals([width, height, format], [512, 512, 'webp']);
    }
    assertStringIncludes(log.join('\n'), 'misc: no icon set in collections.json — skipped');
  }));

test('writePlaceholders with a preview folder writes PNGs there instead', () =>
  withTempDir(async (dir) => {
    const written = await writePlaceholders([collection('sharks', 'shark')], {
      previewDir: dir,
      log: () => {},
    });
    assertEquals(written, [`${dir}/placeholder_sharks.png`, `${dir}/placeholder_sharks-dark.png`]);
    assertEquals((await sharp(await readFile(written[0])).metadata()).format, 'png');
  }));

test('cli --preview draws every collection that has an icon into the folder given', () =>
  withTempDir(async (dir) => {
    const lines: string[] = [];
    const { log } = console;
    console.log = (line: string) => lines.push(line);
    try {
      const written = await cli(['--preview', dir]);
      assert(written.length > 0 && written.every((p) => p.startsWith(`${dir}/placeholder_`)));
    } finally {
      console.log = log;
    }
  }));
