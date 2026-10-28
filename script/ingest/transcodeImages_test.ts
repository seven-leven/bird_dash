import { test } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import sharp from 'sharp';
import { transcodeExtra, transcodeFull, transcodeThumb } from './transcodeImages.ts';
import type { Collection } from '../lib/collections.ts';
import { imageSize, tempCollection } from '../../src/testing/fakes/tempCollection.ts';

// Real (tiny) images in a temporary folder.

/** A collection on disk whose source art is one wide red picture per id in `sources`. */
async function withCollection(sources: string[], fn: (collection: Collection) => Promise<void>) {
  const picture = { width: 60, height: 30, color: '#cc3333' }; // wide, so the square shows
  await using collection = await tempCollection({ sources, picture });
  await fn(collection);
}

test('the full image is a 2048px WebP square, the thumbnail a 400px one and a 240px one', () =>
  withCollection(['001'], async (collection) => {
    assertEquals(await transcodeFull(collection, '001'), { ok: true });
    assertEquals(await imageSize(`${collection.paths.full}001.webp`), {
      width: 2048,
      height: 2048,
      format: 'webp',
    });
    assertEquals(await imageSize(`${collection.paths.thumb}001.webp`), {
      width: 400,
      height: 400,
      format: 'webp',
    });
    assertEquals(await imageSize(`${collection.paths.small}001.webp`), {
      width: 240,
      height: 240,
      format: 'webp',
    });
  }));

test('a picture that is not square is padded with white, never cropped', () =>
  withCollection(['001'], async (collection) => {
    await transcodeFull(collection, '001');
    const { data, info } = await sharp(await readFile(`${collection.paths.full}001.webp`))
      .raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => {
      const at = (y * info.width + x) * info.channels;
      return [data[at], data[at + 1], data[at + 2]];
    };
    const [r, g, b] = pixel(1024, 20); // the band above the 2:1 picture
    assert(r > 240 && g > 240 && b > 240, `expected white padding, got ${[r, g, b]}`);
    const [cr, cg] = pixel(1024, 1024); // the middle: the red picture
    assert(cr > 150 && cg < 100, `expected the picture in the middle, got ${[cr, cg]}`);
  }));

test('missing source art is a failure with a reason, not an exception', () =>
  withCollection([], async (collection) => {
    const made = await transcodeFull(collection, '404');
    assert(!made.ok && made.error.length > 0);
  }));

test('a thumbnail is remade from the full image, and fails without one', () =>
  withCollection(['001'], async (collection) => {
    await transcodeFull(collection, '001');
    await rm(`${collection.paths.thumb}001.webp`);
    await rm(`${collection.paths.small}001.webp`);
    assertEquals(await transcodeThumb(collection, '001'), { ok: true });
    assertEquals((await imageSize(`${collection.paths.thumb}001.webp`)).width, 400);
    assertEquals((await imageSize(`${collection.paths.small}001.webp`)).width, 240);
    assertEquals((await transcodeThumb(collection, '404')).ok, false);
  }));

test("an item's other image is a full WebP alone, with no thumbnail; without source art it fails", () =>
  withCollection(['001-2'], async (collection) => {
    assertEquals(await transcodeExtra(collection, '001-2'), { ok: true });
    assertEquals((await imageSize(`${collection.paths.full}001-2.webp`)).width, 2048);
    assertEquals(await readFile(`${collection.paths.thumb}001-2.webp`).catch(() => null), null);
    assertEquals((await transcodeExtra(collection, '001-3')).ok, false);
  }));
