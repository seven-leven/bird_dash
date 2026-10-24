/**
 * Draws the placeholder shown for items that are not drawn yet: the collection's
 * line icon (src/lib/icons.ts), once for the light theme (grey on
 * white) and once for the dark theme (`<id>-dark.webp`, slate on slate).
 *
 *   node script/placeholders/draw_placeholders.ts                  write public/placeholders/<id>[-dark].webp
 *   node script/placeholders/draw_placeholders.ts --preview <dir>  write PNGs there instead
 */
import sharp from 'sharp';
import { ICONS, isIconName } from '../../src/lib/icons.ts';
import { readJson } from '../lib/fs.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';
import { SLATE } from '../design/palette.ts';

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

export function placeholderSvg(iconBody: string, theme: Theme = 'light'): string {
  const { background, ink } = THEMES[theme];
  const scale = (SIZE * ICON_SHARE) / 24;
  const offset = (SIZE - 24 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<rect width="100%" height="100%" fill="${background}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${ink}" ` +
    `stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconBody}</g></svg>`;
}

/**
 * Draw both placeholders of every collection that has an icon, and return the paths written.
 * `previewDir` writes PNGs there (`placeholder_<id>[-dark].png`) instead of the WebPs in `dir`.
 */
export async function writePlaceholders(
  collections: RawCollectionConfig[],
  opts: { dir?: string; previewDir?: string | null; log?: (line: string) => void } = {},
): Promise<string[]> {
  const { dir = './public/placeholders', previewDir = null, log = console.log } = opts;
  const written: string[] = [];
  for (const col of collections) {
    if (!isIconName(col.icon)) {
      log(`  ${col.id}: no icon set in collections.json — skipped`);
      continue;
    }
    for (const theme of Object.keys(THEMES) as Theme[]) {
      const name = `${col.id}${THEMES[theme].suffix}`;
      const image = sharp(new TextEncoder().encode(placeholderSvg(ICONS[col.icon].body, theme)));
      const path = previewDir ? `${previewDir}/placeholder_${name}.png` : `${dir}/${name}.webp`;
      await (previewDir ? image.png() : image.webp({ quality: 90 })).toFile(path);
      log(`  ${name}: wrote ${path}`);
      written.push(path);
    }
  }
  return written;
}

/** The `npm run placeholders` command: `--preview <dir>` writes PNGs there instead. */
export async function cli(args: string[]): Promise<string[]> {
  const previewAt = args.indexOf('--preview');
  // Without --preview this writes the real files in public/, so tests always pass a folder.
  /* c8 ignore next */
  const previewDir = previewAt === -1 ? null : args[previewAt + 1];
  return writePlaceholders(await readJson<RawCollectionConfig[]>('./public/collections.json'), {
    previewDir,
  });
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) await cli(process.argv.slice(2));
