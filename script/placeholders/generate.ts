/// <reference lib="deno.ns" />
/**
 * Draws the placeholder shown for items that are not drawn yet: the collection's
 * line icon (src/components/icons/icons.ts), once for the light theme (grey on
 * white) and once for the dark theme (`<id>-dark.webp`, slate on slate).
 *
 *   deno run -A script/placeholders/generate.ts            write public/placeholders/<id>[-dark].webp
 *   deno run -A script/placeholders/generate.ts --preview <dir>   write PNGs there instead
 */
import sharp from 'sharp';
import { ICONS, isIconName } from '../../src/components/icons/icons.ts';
import { readJson } from '../lib/fs.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';

/** One image per theme. Light keeps the palette of the silhouettes these replaced. */
export const THEMES = {
  light: { suffix: '', background: '#ffffff', ink: '#a1a1a1' },
  // slate-900 with slate-600: the dark tile colour, and an icon about as faint
  // against it as the light one is against white.
  dark: { suffix: '-dark', background: '#0f172a', ink: '#475569' },
} as const;
export type Theme = keyof typeof THEMES;

const SIZE = 512;
const ICON_SHARE = 0.56; // icon width as a share of the square

export function placeholderSvg(iconBody: string, theme: Theme = 'light'): string {
  const { background, ink } = THEMES[theme];
  const scale = (SIZE * ICON_SHARE) / 24;
  const offset = (SIZE - 24 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<rect width="100%" height="100%" fill="${background}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${ink}" ` +
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
    for (const theme of Object.keys(THEMES) as Theme[]) {
      const name = `${col.id}${THEMES[theme].suffix}`;
      const image = sharp(new TextEncoder().encode(placeholderSvg(ICONS[col.icon].body, theme)));
      const path = previewDir
        ? `${previewDir}/placeholder_${name}.png`
        : `./public/placeholders/${name}.webp`;
      await (previewDir ? image.png() : image.webp({ quality: 90 })).toFile(path);
      console.log(`  ${name}: wrote ${path}`);
    }
  }
}
