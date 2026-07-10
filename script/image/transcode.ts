/// <reference lib="deno.ns" />
import sharp from 'sharp';
import { ensureDir } from '../lib/fs.ts';
import { errorMessage } from '../lib/error.ts';
import type { Collection } from '../collection/registry.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FULL_SIZE = 2048;
const THUMB_SIZE = 400;
const WEBP_OPTS = { quality: 90 } as const;

const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 } as const;

sharp.concurrency(0);

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type TranscodeResult =
  | { ok: true }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Derive the thumbnail from a normalized square full image (path or buffer). */
function writeThumb(input: string | Uint8Array, thumb: string): Promise<sharp.OutputInfo> {
  return sharp(input)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'fill' })
    .webp(WEBP_OPTS)
    .toFile(thumb);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function transcode(
  col: Collection,
  id: string,
): Promise<TranscodeResult> {
  const raw = `${col.paths.raw}${id}.png`;
  const full = `${col.paths.full}${id}.webp`;
  const thumb = `${col.paths.thumb}${id}.webp`;

  try {
    await Promise.all([
      ensureDir(col.paths.full),
      ensureDir(col.paths.thumb),
    ]);

    // First create normalized square full image
    const fullBuffer = await sharp(raw)
      .rotate()
      .resize(FULL_SIZE, FULL_SIZE, { fit: 'contain', background: WHITE_BG })
      .webp(WEBP_OPTS)
      .toBuffer();

    // Already WebP-encoded — write as-is (a sharp round-trip would re-encode).
    await Deno.writeFile(full, fullBuffer);

    // Derive thumbnail FROM normalized full image
    await writeThumb(fullBuffer, thumb);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/**
 * Repair path
 */
export async function transcodeThumb(
  col: Collection,
  id: string,
): Promise<TranscodeResult> {
  const full = `${col.paths.full}${id}.webp`;
  const thumb = `${col.paths.thumb}${id}.webp`;

  try {
    await ensureDir(col.paths.thumb);
    await writeThumb(full, thumb);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
