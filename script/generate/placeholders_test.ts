import { test } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import sharp from 'sharp';
import { drawPlaceholder, THEMES, writePlaceholders } from './placeholders.ts';
import type { CollectionEntry } from '../../src/data/files.ts';
import { tempDir } from '../../src/testing/fakes/tempDir.ts';

// Files are read into memory and the cache is off, so Windows can delete the temporary folder.
sharp.cache(false);

const BODY = '<path d="M1 1h2"/>';

test('drawPlaceholder draws the icon on a 512px square in the theme colours', () => {
  for (const theme of ['light', 'dark'] as const) {
    const svg = drawPlaceholder(BODY, theme);
    assertStringIncludes(svg, 'width="512" height="512"');
    assertStringIncludes(svg, `fill="${THEMES[theme].background}"`);
    assertStringIncludes(svg, `stroke="${THEMES[theme].ink}"`);
    assertStringIncludes(svg, BODY);
  }
});

test('drawPlaceholder defaults to the light theme', () => {
  assertStringIncludes(drawPlaceholder(BODY), `fill="${THEMES.light.background}"`);
});

test('the light and dark files differ only by the "-dark" suffix', () => {
  assert(THEMES.light.suffix === '' && THEMES.dark.suffix === '-dark');
});

/** Run `fn` with a fresh temporary directory, removed afterwards. */
async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  await using dir = await tempDir('placeholders');
  await fn(dir.path);
}

const collection = (id: string, icon?: string) => ({ id, icon }) as CollectionEntry;

test('every collection with an icon gets a light and a dark 512px WebP; one without is skipped', () =>
  withTempDir(async (dir) => {
    const skipped: string[] = [];
    const written = await writePlaceholders(
      [collection('birds', 'bird'), collection('misc')],
      dir,
      (id) => skipped.push(id),
    );
    assertEquals(written, [`${dir}/birds.webp`, `${dir}/birds-dark.webp`]);
    assertEquals((await readdir(dir)).sort(), ['birds-dark.webp', 'birds.webp']);
    for (const path of written) {
      const { width, height, format } = await sharp(await readFile(path)).metadata();
      assertEquals([width, height, format], [512, 512, 'webp']);
    }
    assertEquals(skipped, ['misc']);
    // Nobody listening for skipped collections is fine too.
    assertEquals(await writePlaceholders([collection('misc')], dir), []);
  }));
