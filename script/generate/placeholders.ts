/**
 * Draws the placeholder shown for items that are not drawn yet: the collection's
 * line icon (src/ui/icons.ts), once for the light theme (grey on
 * white) and once for the dark theme (`<id>-dark.webp`, slate on slate).
 * Written by `npm run generate` (or `npm run generate -- placeholders`).
 */
import sharp from 'sharp';
import { ICONS, isIconName } from '../../src/ui/icons.ts';
import { PATHS } from '../lib/paths.ts';
import type { CollectionEntry } from '../../src/data/files.ts';
import { SLATE } from './palette.ts';

/** One image per theme. Light keeps the palette of the silhouettes these replaced. */
export const THEMES = {
  // slate-100: the undrawn tile's grey, never white, so a placeholder cannot pass for a
  // sketch on paper (docs/DESIGN.md §9).
  light: { suffix: '', background: SLATE['100'], ink: '#a1a1a1' },
  // slate-900 with slate-600: the dark tile colour, and an icon about as faint
  // against it as the light one is against its grey.
  dark: { suffix: '-dark', background: SLATE['900'], ink: SLATE['600'] },
} as const;
export type Theme = keyof typeof THEMES;

const SIZE = 512;
const ICON_SHARE = 0.56; // icon width as a share of the square

/** A placeholder as SVG: the icon, centred, in the theme's colours on a 512px square. */
export function drawPlaceholder(iconBody: string, theme: Theme = 'light'): string {
  const { background, ink } = THEMES[theme];
  const scale = (SIZE * ICON_SHARE) / 24;
  const offset = (SIZE - 24 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<rect width="100%" height="100%" fill="${background}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${ink}" ` +
    `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconBody}</g></svg>`;
}

/**
 * Draw both placeholders of every collection that has an icon into `dir`, as
 * `<id>.webp` and `<id>-dark.webp`, and return the paths written. A collection without
 * an icon is skipped, and `skipped` hears its id.
 */
export async function writePlaceholders(
  collections: CollectionEntry[],
  dir: string = PATHS.placeholders,
  skipped: (collectionId: string) => void = () => {},
): Promise<string[]> {
  const written: string[] = [];
  for (const collection of collections) {
    if (!isIconName(collection.icon)) {
      skipped(collection.id);
      continue;
    }
    for (const theme of Object.keys(THEMES) as Theme[]) {
      const path = `${dir}/${collection.id}${THEMES[theme].suffix}.webp`;
      await sharp(new TextEncoder().encode(drawPlaceholder(ICONS[collection.icon].body, theme)))
        .webp({ quality: 90 })
        .toFile(path);
      written.push(path);
    }
  }
  return written;
}
