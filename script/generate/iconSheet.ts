// Draws docs/assets/icons.png: every icon in src/lib/icons.ts, in its group, on the
// same grid as the design guide's icon section.
import sharp from 'sharp';
import { PATHS } from '../lib/paths.ts';
import { iconGroups, rect } from './guideDrawing.ts';

/** The icon sheet (docs/assets/icons.png) as an SVG. */
export function iconSheetSvg(): string {
  const width = 1000;
  const groups = iconGroups(56, 44, {
    cols: 7,
    size: 60,
    cell: 132,
    row: 168,
    label: 13,
    name: 14,
  }, '#111111');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${groups.bottom}">` +
    rect(0, 0, width, groups.bottom, '#ffffff') + groups.svg + '</svg>';
}

/** Draw the icon sheet into `dir` (docs/assets/ by default) as icons.png. */
export async function writeIconSheet(dir: string = PATHS.docsAssets): Promise<string> {
  const path = `${dir}/icons.png`;
  await sharp(new TextEncoder().encode(iconSheetSvg())).png().toFile(path);
  return path;
}
