import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import sharp from 'sharp';
import { GENERATORS, main } from './generate.ts';
import { realIo } from '../lib/io.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import { tempDir } from '../../src/testing/fakes/tempDir.ts';

// Every generator, run for real into a temporary folder, against the files committed:
// a generated file that is stale fails here (docs/SCRIPTS.md, principle 4).

// sharp caches open files; on Windows that would keep the temporary folder locked.
sharp.cache(false);

const sizeOf = async (path: string) => {
  const { width, height, format } = await sharp(await readFile(path)).metadata();
  return { width, height, format };
};

/** Generate everything into a fresh folder, quietly, and hand `fn` the folder. */
async function generated(fn: (dir: string) => Promise<void>): Promise<void> {
  await using dir = await tempDir('generate');
  const output = fakeIo();
  const code = await main(['--into', dir.path], { ...realIo, out: output.out, err: output.err });
  assertEquals(code, 0, output.errLines.join('\n'));
  assertEquals(output.outLines.filter((line) => line.includes('✓')).length, GENERATORS.length);
  await fn(dir.path);
}

test('every generator writes its files, at the expected sizes, into the folder given', () =>
  generated(async (dir) => {
    const guide = await sizeOf(`${dir}/design-guide.png`);
    assertEquals([guide.width, guide.format], [1400, 'png']);
    assert(guide.height! > 1500, 'the guide should be a tall page');
    assertEquals((await sizeOf(`${dir}/icons.png`)).width, 1000);
    assertEquals(await sizeOf(`${dir}/logo.png`), { width: 1400, height: 900, format: 'png' });
    assertEquals(await sizeOf(`${dir}/logo/tile-512.png`), {
      width: 512,
      height: 512,
      format: 'png',
    });
    for (const name of ['mark.svg', 'mark-white.svg', 'tile.svg']) {
      const svg = await readFile(`${dir}/logo/${name}`, 'utf8');
      assert(svg.startsWith('<svg ') && svg.endsWith('</svg>\n'), name);
    }
    assertStringIncludes(await readFile(`${dir}/logo/mark-white.svg`, 'utf8'), '#ffffff');
    assertEquals(await sizeOf(`${dir}/favicon.png`), { width: 64, height: 64, format: 'png' });
    // Five drawings of 240px with 16px around and between them.
    assertEquals(await sizeOf(`${dir}/drawings.webp`), {
      width: 1296,
      height: 272,
      format: 'webp',
    });
    assertEquals(
      await readFile(`${dir}/favicon.svg`, 'utf8'),
      await readFile(`${dir}/logo/tile.svg`, 'utf8'),
      'the tab icon is the logo tile',
    );
  }));

test('every generated file in the repository is up to date with the code that draws it', () =>
  generated(async (dir) => {
    const stale = (path: string) =>
      `${path} is stale: run \`npm run generate\` and commit the result`;
    // Text files must match exactly.
    const texts: [string, string][] = [
      ...['mark.svg', 'mark-white.svg', 'tile.svg'].map((name): [string, string] => [
        `${PATHS.docsAssets}/logo/${name}`,
        `${dir}/logo/${name}`,
      ]),
      [PATHS.favicon, `${dir}/favicon.svg`],
      [PATHS.stats, `${dir}/stats.json`],
    ];
    for (const [committed, fresh] of texts) {
      assertEquals(
        await readFile(committed, 'utf8'),
        await readFile(fresh, 'utf8'),
        stale(committed),
      );
    }
    // Image bytes can differ between machines (fonts, encoders), so compare what is stable.
    const placeholders = await realIo.listFiles(PATHS.placeholders, (n) => n.endsWith('.webp'));
    const images: [string, string][] = [
      ...['design-guide.png', 'icons.png', 'logo.png', 'drawings.webp'].map((
        name,
      ): [string, string] => [`${PATHS.docsAssets}/${name}`, `${dir}/${name}`]),
      ...placeholders.map((name): [string, string] => [
        `${PATHS.placeholders}/${name}`,
        `${dir}/${name}`,
      ]),
    ];
    assert(placeholders.length > 0, 'public/placeholders/ has no placeholders');
    for (const [committed, fresh] of images) {
      assertEquals(await sizeOf(committed), await sizeOf(fresh), stale(committed));
    }
  }));
