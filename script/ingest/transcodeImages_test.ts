import { test } from 'vitest';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals } from '@std/assert';
import sharp from 'sharp';
import { transcodeFull, transcodeThumb } from './transcodeImages.ts';
import type { Collection } from '../lib/collections.ts';

// Real (tiny) images in a temporary folder. sharp caches open files by default; on
// Windows that keeps them locked, so the folder could not be removed afterwards.
sharp.cache(false);

/** A collection on disk whose source art is one wide red picture per id in `sources`. */
async function withCollection(sources: string[], fn: (collection: Collection) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_transcode_'));
  const collection = {
    id: 'x',
    paths: { sourceArt: `${dir}/raw/`, full: `${dir}/full/`, thumb: `${dir}/thumb/` },
  } as Collection;
  try {
    await mkdir(collection.paths.sourceArt);
    for (const id of sources) {
      await sharp({ create: { width: 60, height: 30, channels: 3, background: '#cc3333' } })
        .png().toFile(`${collection.paths.sourceArt}${id}.png`);
    }
    await fn(collection);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const sizeOf = async (path: string) => {
  const { width, height, format } = await sharp(await readFile(path)).metadata();
  return { width, height, format };
};

test('the full image is a 2048px WebP square and the thumbnail a 400px one', () =>
  withCollection(['001'], async (collection) => {
    assertEquals(await transcodeFull(collection, '001'), { ok: true });
    assertEquals(await sizeOf(`${collection.paths.full}001.webp`), {
      width: 2048,
      height: 2048,
      format: 'webp',
    });
    assertEquals(await sizeOf(`${collection.paths.thumb}001.webp`), {
      width: 400,
      height: 400,
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
    assertEquals(await transcodeThumb(collection, '001'), { ok: true });
    assertEquals((await sizeOf(`${collection.paths.thumb}001.webp`)).width, 400);
    assertEquals((await transcodeThumb(collection, '404')).ok, false);
  }));
