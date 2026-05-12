/// <reference lib="deno.ns" />
import sharp from 'sharp';
import { ensureDir } from '../lib/fs.ts';
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

function fitSquare(
  pipeline: sharp.Sharp,
  size: number,
): sharp.Sharp {
  return pipeline.resize(size, size, {
    fit: 'contain',
    background: WHITE_BG,
  });
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
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
    const fullBuffer = await fitSquare(
      sharp(raw).rotate(),
      FULL_SIZE,
    )
      .webp(WEBP_OPTS)
      .toBuffer();

    // Save full
    await sharp(fullBuffer).toFile(full);

    // Derive thumbnail FROM normalized full image
    await sharp(fullBuffer)
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'fill',
      })
      .webp(WEBP_OPTS)
      .toFile(thumb);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
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

    await sharp(full)
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'fill',
      })
      .webp(WEBP_OPTS)
      .toFile(thumb);

    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}
