// The drawing kit the design guide and the icon sheet share: the guide's own voice
// (warm paper, a serif for statements), text and shape helpers that write SVG, Thaana set
// in Faruma, and the icon groups on their grid.
import sharp from 'sharp';
import { ICON_GROUPS, type IconDef, ICONS } from '../../src/ui/icons.ts';
import { PATHS } from '../lib/paths.ts';
import { iconGridLayout } from './iconGrid.ts';
import { SLATE } from './palette.ts';

export const W = 1400;
export const X = 80; // the left margin; the content runs from X to W - X
export const INK = SLATE['900'];
export const MUTED = SLATE['500'];
// Small labels (caps, icon names, swatch notes) one step darker than muted text, so
// they stay legible at the size the guide is read at. No guide text is below 13px
// except the type scale's own 12 and 11px samples.
export const LABEL = SLATE['600'];
// The guide is a document in its own voice: warm paper, fine rules, a serif for
// statements. The site's own colours are the slate and accent swatches drawn on it.
export const PAPER = '#fbfaf7';
export const RULE = '#e2ded5';
export const RULE_SOFT = '#ebe8e1'; // the icon groups' dividers: present, never louder than the icons
export const FONT = 'font-family="Segoe UI, Helvetica, Arial, sans-serif"';
export const SERIF_FACE = 'font-family="Georgia, Cambria, serif"';
export const SERIF = `${SERIF_FACE} font-style="italic"`;
// The SVG renderer cannot shape Thaana, so Dhivehi is drawn by Pango in the
// site's own Thaana font and laid over the page.

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const text = (
  x: number,
  y: number,
  s: string,
  size = 15,
  fill = INK,
  weight = 400,
  extra = '',
) =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${
    esc(s)
  }</text>`;
export const caps = (x: number, y: number, s: string, fill = LABEL) =>
  text(x, y, s.toUpperCase(), 14, fill, 600, 'letter-spacing="1.5"');
export const serif = (x: number, y: number, s: string, size = 17, fill = MUTED) =>
  `<text x="${x}" y="${y}" ${SERIF} font-size="${size}" fill="${fill}">${esc(s)}</text>`;
export const statement = (x: number, y: number, s: string, size: number) =>
  `<text x="${x}" y="${y}" ${SERIF_FACE} font-size="${size}" fill="${INK}">${esc(s)}</text>`;

/**
 * Break `s` into two lines at the space that makes them most even, so a set of
 * headings shares one shape ("Drawings / first", "Always say / where you are").
 * One word stays one line.
 */
export function balanceTwoLines(s: string): string[] {
  const words = s.split(' ');
  if (words.length < 2) return [s];
  let best = [s];
  let longest = Infinity;
  for (let at = 1; at < words.length; at++) {
    const lines = [words.slice(0, at).join(' '), words.slice(at).join(' ')];
    const length = Math.max(...lines.map((l) => l.length));
    if (length < longest) [best, longest] = [lines, length];
  }
  return best;
}

/** Break `s` into lines of at most `max` characters, at spaces. */
export function wrapText(s: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of s.split(' ')) {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= max) {
      lines[lines.length - 1] += ` ${word}`;
    } else lines.push(word);
  }
  return lines;
}
/** Several lines of text, `lead` apart, as one <text> of <tspan>s. */
export const para = (x: number, y: number, lines: string[], lead: number, attrs: string) =>
  `<text x="${x}" y="${y}" ${attrs}>${
    lines.map((l, i) => `<tspan x="${x}" dy="${i ? lead : 0}">${esc(l)}</tspan>`).join('')
  }</text>`;
export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  rx = 0,
  extra = '',
) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
export const line = (x1: number, y1: number, x2: number, y2: number, stroke = RULE) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1"/>`;
export const rule = (y: number) => line(X, y, W - X, y);
export const icon = (name: keyof typeof ICONS, x: number, y: number, size: number, ink: string) => {
  const def: IconDef = ICONS[name];
  const paint = def.filled
    ? `fill="${ink}" stroke="none"`
    : `fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" ${paint}>${def.body}</g>`;
};

/**
 * Dhivehi in Faruma, `size` px, its baseline at `baseline`: an image to lay over the
 * page. The rendered image is cropped to the ink, so it is placed by its bottom edge:
 * `descent` is how far the text's lowest mark reaches below the baseline, in ems
 * (ރޭރު reaches 0.06, measured in the browser).
 */
export async function thaana(s: string, x: number, baseline: number, size: number, descent = 0.06) {
  const input = await sharp({
    text: {
      text: `<span foreground="${INK}">${s}</span>`,
      font: `Faruma ${size}`,
      fontfile: PATHS.faruma,
      rgba: true,
      dpi: 72,
    },
  }).png().toBuffer();
  const { height = 0 } = await sharp(input).metadata();
  return { input, left: x, top: Math.round(baseline + descent * size - height) };
}

/**
 * The icon groups on one grid of equal columns (see iconGrid.ts). Each group is
 * labelled above its first icon, and a divider stands in the empty column that
 * separates it from the group before, on the same centre line as the icons.
 */
export function iconGroups(
  x0: number,
  y0: number,
  o: {
    cols: number;
    size: number;
    cell: number;
    row: number;
    label: number;
    name: number;
    /** Space between a group's label and its icons. */
    gap?: number;
    /** Equal tracks per row, so groups start in the same columns (see iconGrid.ts). */
    tracks?: number;
  },
  ink: string,
): { svg: string; bottom: number } {
  const layout = iconGridLayout(ICON_GROUPS, o.cols, o.tracks);
  const gap = o.gap ?? 16;
  let svg = '';
  for (const group of layout) {
    const y = y0 + group.row * o.row;
    if (group.col > 0) {
      // Beside the icons only, not the labels: the grouping shows without a cage of lines.
      const x = x0 + (group.col - 1) * o.cell + o.size / 2;
      svg += line(x, y + gap, x, y + gap + o.size + o.name + 8, RULE_SOFT);
    }
    svg += text(
      x0 + group.col * o.cell,
      y,
      group.label.toUpperCase(),
      o.label,
      LABEL,
      600,
      'letter-spacing="1"',
    );
    for (const { name, col } of group.icons) {
      const x = x0 + col * o.cell;
      svg += icon(name as keyof typeof ICONS, x, y + gap, o.size, ink) +
        text(
          x + o.size / 2,
          y + gap + o.size + o.name + 8,
          name,
          o.name,
          LABEL,
          400,
          'text-anchor="middle"',
        );
    }
  }
  const rows = Math.max(...layout.map((g) => g.row)) + 1;
  return { svg, bottom: y0 + rows * o.row };
}
