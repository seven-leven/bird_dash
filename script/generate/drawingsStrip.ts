/**
 * The README's picture: the newest drawings in a row, each on white paper as the site
 * shows them, taken from public/stats.json and the thumbnails. `npm run generate` redraws
 * it with the other images, so it follows the archive rather than being a screenshot.
 */
import { STONE } from './palette.ts';
import sharp, { type Sharp } from 'sharp';
import { type Io, readJson, realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import type { Stats } from '../../src/data/files.ts';

/** How many drawings, how big each is, and the room around and between them (px). */
export const STRIP = { count: 5, tile: 240, gap: 16 } as const;

/**
 * Draw the strip, or return null when nothing is drawn yet. The page is stone-50, each
 * drawing sits on a white card with the site's stone-200 edge and 12px corners.
 */
export async function drawDrawingsStrip(
  io: Io = realIo,
  statsPath: string = PATHS.stats,
  publicDir = './public',
): Promise<Sharp | null> {
  const { newest } = await readJson<Stats>(io, statsPath);
  const shown = newest.slice(0, STRIP.count);
  if (shown.length === 0) return null;

  const { tile, gap } = STRIP;
  const width = shown.length * tile + (shown.length + 1) * gap;
  const height = tile + 2 * gap;
  const cards = shown.map((_, i) =>
    `<rect x="${gap + i * (tile + gap) + 0.5}" y="${gap + 0.5}" width="${tile - 1}" height="${
      tile - 1
    }" rx="12" fill="#ffffff" stroke="${STONE['200']}"/>`
  ).join('');
  const page = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="${STONE['50']}"/>${cards}</svg>`;

  // The drawing inside its card, with a margin so it does not touch the edge.
  const inset = 8;
  const drawings = await Promise.all(shown.map(async (d, i) => ({
    input: await sharp(`${publicDir}/thumb/${d.collection}/${d.id}.webp`)
      .resize(tile - 2 * inset, tile - 2 * inset, { fit: 'contain', background: '#ffffff' })
      .toBuffer(),
    left: gap + i * (tile + gap) + inset,
    top: gap + inset,
  })));
  return sharp(new TextEncoder().encode(page)).composite(drawings);
}

/** Write the strip as WebP (photographs of drawings: far smaller than PNG). */
export async function writeDrawingsStrip(
  path: string,
  io: Io = realIo,
  statsPath?: string,
  publicDir?: string,
): Promise<boolean> {
  const strip = await drawDrawingsStrip(io, statsPath, publicDir);
  if (!strip) return false;
  await strip.webp({ quality: 82 }).toFile(path);
  return true;
}
