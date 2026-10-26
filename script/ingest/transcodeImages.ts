// Making a drawing's WebPs from its source art: a 2048px square full image (padded with
// white, never cropped) and a 400px thumbnail made from it. Images are bytes, so this
// works on the disk through sharp rather than through Io; `applyChanges` takes it as a
// `Transcoder` so its tests can stand in for it.
import { writeFile } from 'node:fs/promises';
import sharp, { type OutputInfo } from 'sharp';
import { ensureDir } from '../lib/fs.ts';
import { errorMessage } from '../lib/error.ts';
import type { Collection } from '../lib/collections.ts';

const FULL_SIZE_PX = 2048;
const THUMB_SIZE_PX = 400;
const WEBP_OPTIONS = { quality: 90 } as const;
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 } as const;

sharp.concurrency(0);

/** How making an image went: done, or failed and why. */
export type Transcoded = { ok: true } | { ok: false; error: string };

/** Makes a drawing's images; `sharpTranscoder` is the real one. */
export interface Transcoder {
  /** The full image and the thumbnail, from the source art. */
  full(collection: Collection, id: string): Promise<Transcoded>;
  /** The thumbnail alone, from the full image. */
  thumb(collection: Collection, id: string): Promise<Transcoded>;
}

/** The thumbnail, from a square full image (a path or its bytes). */
function writeThumb(input: string | Uint8Array, thumbPath: string): Promise<OutputInfo> {
  return sharp(input)
    .resize(THUMB_SIZE_PX, THUMB_SIZE_PX, { fit: 'fill' })
    .webp(WEBP_OPTIONS)
    .toFile(thumbPath);
}

export async function transcodeFull(collection: Collection, id: string): Promise<Transcoded> {
  try {
    await Promise.all([ensureDir(collection.paths.full), ensureDir(collection.paths.thumb)]);
    const full = await sharp(`${collection.paths.sourceArt}${id}.png`)
      .rotate()
      .resize(FULL_SIZE_PX, FULL_SIZE_PX, { fit: 'contain', background: WHITE })
      .webp(WEBP_OPTIONS)
      .toBuffer();
    // Already WebP: written as it is (a second pass through sharp would encode it again).
    await writeFile(`${collection.paths.full}${id}.webp`, full);
    await writeThumb(full, `${collection.paths.thumb}${id}.webp`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function transcodeThumb(collection: Collection, id: string): Promise<Transcoded> {
  try {
    await ensureDir(collection.paths.thumb);
    await writeThumb(`${collection.paths.full}${id}.webp`, `${collection.paths.thumb}${id}.webp`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export const sharpTranscoder: Transcoder = { full: transcodeFull, thumb: transcodeThumb };
