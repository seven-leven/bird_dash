/// <reference lib="deno.ns" />
/**
 * Draws the placeholder shown for items that are not drawn yet: the collection's
 * line icon (src/components/icons/icons.ts) in grey on a white square.
 *
 *   deno run -A script/placeholders/generate.ts            write public/placeholders/<id>.webp
 *   deno run -A script/placeholders/generate.ts --preview <dir>   write PNGs there instead
 */
import sharp from 'sharp';
import { ICONS, isIconName } from '../../src/components/icons/icons.ts';
import { readJson } from '../lib/fs.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';

// The palette of the silhouettes these replace.
const BACKGROUND = '#ffffff';
const INK = '#a1a1a1';
const SIZE = 512;
const ICON_SHARE = 0.56; // icon width as a share of the square

export function placeholderSvg(iconBody: string): string {
  const scale = (SIZE * ICON_SHARE) / 24;
  const offset = (SIZE - 24 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<rect width="100%" height="100%" fill="${BACKGROUND}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${INK}" ` +
    `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconBody}</g></svg>`;
}

if (import.meta.main) {
  const previewAt = Deno.args.indexOf('--preview');
  const previewDir = previewAt === -1 ? null : Deno.args[previewAt + 1];
  const collections = await readJson<RawCollectionConfig[]>('./public/collections.json');

  for (const col of collections) {
    if (!isIconName(col.icon)) {
      console.log(`  ${col.id}: no icon set in collections.json — skipped`);
      continue;
    }
    const image = sharp(new TextEncoder().encode(placeholderSvg(ICONS[col.icon].body)));
    const path = previewDir
      ? `${previewDir}/placeholder_${col.id}.png`
      : `./public/placeholders/${col.id}.webp`;
    await (previewDir ? image.png() : image.webp({ quality: 90 })).toFile(path);
    console.log(`  ${col.id}: wrote ${path}`);
  }
}
