// A collection on disk, for the scripts' tests that need real files and real images: its list
// and its source art in a temporary folder, removed when the `await using` block ends.
//
//   await using birds = await tempCollection({ items: [mallard], sources: ['001'] });
//   await transcodeFull(birds, '001');
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import type { Collection } from '../../../script/lib/collections.ts';
import type { ListEntry } from '../../data/files.ts';
import { makeScriptCollection } from '../scriptFixtures.ts';
import { tempDir } from './tempDir.ts';

// sharp keeps files it opened in a cache; on Windows that keeps them locked, and the folder
// could not be removed afterwards.
sharp.cache(false);

/** A plain picture, the source art for every id in `sources`. */
export interface Picture {
  width: number;
  height: number;
  color: string;
}

/**
 * A collection `x` in a temporary folder: its list holds `items` (in one group; no list file
 * when none are given), and every id in `sources` has source art, a PNG of `picture`.
 */
export async function tempCollection(options: {
  items?: ListEntry[];
  sources?: string[];
  picture?: Picture;
}): Promise<Collection & AsyncDisposable> {
  const dir = await tempDir('collection');
  const collection = makeScriptCollection('x', {
    label: 'Test',
    emoji: '🧪',
    paths: {
      json: dir.join('list.json'),
      sourceArt: `${dir.path}/raw/`,
      full: `${dir.path}/full/`,
      thumb: `${dir.path}/thumb/`,
      small: `${dir.path}/small/`,
    },
  });
  if (options.items) {
    await writeFile(collection.paths.json, JSON.stringify({ Group: options.items }));
  }
  await mkdir(collection.paths.sourceArt);
  const { width, height, color } = options.picture ?? { width: 40, height: 40, color: '#3366cc' };
  for (const id of options.sources ?? []) {
    await sharp({ create: { width, height, channels: 3, background: color } })
      .png()
      .toFile(`${collection.paths.sourceArt}${id}.png`);
  }
  return { ...collection, [Symbol.asyncDispose]: dir[Symbol.asyncDispose] };
}

/** An image file's size and format, as sharp reads them. */
export async function imageSize(path: string) {
  const { width, height, format } = await sharp(await readFile(path)).metadata();
  return { width, height, format };
}
