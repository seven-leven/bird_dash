/**
 * Draws docs/assets/design-guide.png and docs/assets/icons.png — the visual half of
 * docs/DESIGN.md. Run `npm run design` after changing a token in
 * src/styles/main.css or an icon in src/lib/icons.ts.
 *
 * The colours and the contrast maths are in ./palette.ts.
 */
import sharp, { type OverlayOptions } from 'sharp';
import { ICON_GROUPS, type IconDef, ICONS } from '../../src/lib/icons.ts';
import { writeLogoFiles } from './draw_logo.ts';
import { iconGridLayout } from './icon_grid.ts';
import { PRINCIPLES } from './principles.ts';
import { ACCENT_HEX, accentMenu, contrast, SLATE, TEAL, whiteOnBlack } from './palette.ts';
import { readJson } from '../lib/fs.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
const W = 1400;
const X = 80; // the left margin; the content runs from X to W - X
const INK = SLATE['900'];
const MUTED = SLATE['500'];
// The guide is a document, printed on warm paper with fine rules. The site's
// own colours are the slate and accent swatches drawn on it.
const PAPER = '#fbfaf7';
const RULE = '#e2ded5';
const FONT = 'font-family="Segoe UI, Helvetica, Arial, sans-serif"';
const SERIF = 'font-family="Georgia, Cambria, serif" font-style="italic"';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x: number, y: number, s: string, size = 15, fill = INK, weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${
    esc(s)
  }</text>`;
const caps = (x: number, y: number, s: string) =>
  text(x, y, s.toUpperCase(), 12, MUTED, 600, 'letter-spacing="1"');
const serif = (x: number, y: number, s: string, size = 17, fill = MUTED) =>
  `<text x="${x}" y="${y}" ${SERIF} font-size="${size}" fill="${fill}">${esc(s)}</text>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${RULE}" stroke-width="1"/>`;
const rule = (y: number) => line(X, y, W - X, y);
const icon = (name: keyof typeof ICONS, x: number, y: number, size: number, ink: string) => {
  const def: IconDef = ICONS[name];
  const paint = def.filled
    ? `fill="${ink}" stroke="none"`
    : `fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" ${paint}>${def.body}</g>`;
};

/**
 * A numbered section as DESIGN.md has it: a fine rule, the number and title, then
 * its line in italics. Returns the markup and the y where the section's content starts.
 */
function section(y: number, num: string, title: string, note: string) {
  const indent = num.length > 2 ? 112 : 64;
  const svg = rule(y) + text(X, y + 52, num, 15, MUTED, 600, 'letter-spacing="1"') +
    text(X + indent, y + 52, title, 26, INK, 700) + serif(X + indent, y + 84, note);
  return { svg, top: y + 124 };
}

function ramp(y: number, name: string, colors: Record<string, string>): string {
  const steps = Object.keys(colors);
  const w = (W - 2 * X) / steps.length;
  return steps.map((step, i) => {
    const hex = colors[step];
    const on = contrast(hex, '#ffffff') > 3 ? '#ffffff' : INK;
    const x = X + i * w;
    return rect(x, y, w - 6, 78, hex, 8, `stroke="${RULE}"`) +
      text(x + 10, y + 26, `${name}-${step}`, 14, on, 600) + text(x + 10, y + 48, hex, 13, on);
  }).join('');
}

/**
 * The icon groups on one grid of equal columns (see icon_grid.ts). Each group is
 * labelled above its first icon, and a divider stands in the empty column that
 * separates it from the group before, on the same centre line as the icons.
 */
function iconGroups(
  x0: number,
  y0: number,
  o: { cols: number; size: number; cell: number; row: number; label: number; name: number },
  ink: string,
): { svg: string; bottom: number } {
  const layout = iconGridLayout(ICON_GROUPS, o.cols);
  let svg = '';
  for (const group of layout) {
    const y = y0 + group.row * o.row;
    if (group.col > 0) {
      const x = x0 + (group.col - 1) * o.cell + o.size / 2;
      svg += line(x, y - o.label, x, y + 16 + o.size + o.name + 8);
    }
    svg += text(
      x0 + group.col * o.cell,
      y,
      group.label.toUpperCase(),
      o.label,
      MUTED,
      600,
      'letter-spacing="1"',
    );
    for (const { name, col } of group.icons) {
      const x = x0 + col * o.cell;
      svg += icon(name as keyof typeof ICONS, x, y + 16, o.size, ink) +
        text(
          x + o.size / 2,
          y + 16 + o.size + o.name + 8,
          name,
          o.name,
          MUTED,
          400,
          'text-anchor="middle"',
        );
    }
  }
  const rows = Math.max(...layout.map((g) => g.row)) + 1;
  return { svg, bottom: y0 + rows * o.row };
}

/** A `.nav-item` drawn in one theme: default, hover, current. */
function navStates(x: number, y: number, dark: boolean): string {
  const bg = dark ? SLATE['950'] : '#ffffff';
  const fill = dark ? SLATE['800'] : SLATE['100'];
  const idle = dark ? SLATE['400'] : SLATE['500'];
  const hover = dark ? SLATE['200'] : SLATE['800'];
  const current = dark ? SLATE['100'] : SLATE['900'];
  const item = (ix: number, label: string, color: string, filled: boolean, marker: boolean) =>
    (filled ? rect(ix, y + 22, 132, 40, fill, 6) : '') +
    icon('bird', ix + 14, y + 32, 20, color) + text(ix + 44, y + 48, label, 16, color, 500) +
    (marker ? rect(ix + 10, y + 60, 112, 2.5, TEAL['500'], 2) : '');
  return rect(x, y, 470, 84, bg, 12, `stroke="${RULE}"`) +
    item(x + 16, 'Default', idle, false, false) + item(x + 168, 'Hover', hover, true, false) +
    item(x + 320, 'Current', current, true, true);
}

type Overlay = OverlayOptions;

/** The guide as an SVG, plus the placeholder images to composite on top of it. */
export async function designGuide(
  collections?: RawCollectionConfig[], // defaults to public/collections.json
): Promise<{ svg: string; overlays: Overlay[] }> {
  const cols = collections ?? await readJson<RawCollectionConfig[]>('./public/collections.json');
  const parts: string[] = [];

  // ── Title ──
  parts.push(
    text(X, 110, 'Wildlife Illustrated', 44, INK, 700) +
      text(X, 148, 'A design manifesto', 20, MUTED) +
      serif(X, 200, 'The drawings carry the colour. Everything around them makes room.', 22, INK),
  );

  // ── The five principles: icon, number, title, and the principle in one line ──
  let y = 250;
  parts.push(rule(y) + text(X, y + 52, 'The five principles', 26, INK, 700));
  PRINCIPLES.forEach((p, i) => {
    const ry = y + 84 + i * 60;
    parts.push(
      (i ? rule(ry) : '') + icon(p.icon, X, ry + 16, 28, INK) +
        text(X + 64, ry + 38, `P${i + 1}`, 15, MUTED, 600, 'letter-spacing="1"') +
        text(X + 112, ry + 38, p.title, 19, INK, 700) +
        serif(X + 480, ry + 38, p.summary, 18, INK),
    );
  });
  y += 84 + PRINCIPLES.length * 60 + 40;

  // ── 01 Colour ──
  let s = section(
    y,
    '01',
    'Colour',
    'Quiet ground, clear signal: slate for surfaces and text, one accent per collection (teal shown).',
  );
  parts.push(s.svg, ramp(s.top, 'slate', SLATE), ramp(s.top + 90, 'accent', TEAL));
  const roles = [
    ['Page', 'slate-50', 'slate-950'],
    ['Surface (header, sidebar, menus)', 'white', 'slate-950 / 900'],
    ['Text', 'slate-900 / 800', 'slate-100'],
    ['Muted text', 'slate-500', 'slate-400'],
    ['Borders', 'slate-200 / 100', 'slate-800'],
    ['Accent: focus ring, current marker, progress', 'accent-500', 'accent-500'],
    ['Accent: primary button', 'accent-700 + white', 'accent-700 + white'],
    ['Viewer: title, body, label', 'slate-900 / 600 / 500', 'white at 100 / 70 / 50%'],
  ];
  let ry = s.top + 214;
  parts.push(caps(X, ry, 'Role') + caps(X + 480, ry, 'Light') + caps(X + 780, ry, 'Dark'));
  roles.forEach(([role, light, dark], i) => {
    const rowY = ry + 14 + i * 34;
    parts.push(
      rule(rowY) + text(X, rowY + 23, role, 15) + text(X + 480, rowY + 23, light, 15) +
        text(X + 780, rowY + 23, dark, 15),
    );
  });
  ry += 14 + roles.length * 34 + 56;

  // The accent menu: every hue a collection may pick, and who has picked it.
  const menu = await accentMenu();
  const usedBy = (hue: string) =>
    cols.filter((c) => (c.accent ?? 'teal') === hue).map((c) => c.label).join(', ');
  parts.push(
    caps(X, ry, 'Accent menu') +
      serif(X + 128, ry, 'button shade above, marker shade below; picked in collections.json', 15),
  );
  const sw = (W - 2 * X) / menu.length;
  menu.forEach((hue, i) => {
    const hex = ACCENT_HEX[hue];
    // A guard for a new accent added to main.css without its hex values; the real data has them all.
    /* c8 ignore next 3 */
    if (!hex) {
      throw new Error(`design guide: no hex values for accent "${hue}" (add it to ACCENT_HEX)`);
    }
    const x = X + i * sw;
    const who = usedBy(hue);
    parts.push(
      rect(x, ry + 18, sw - 6, 44, hex[700], 8) + text(x + 10, ry + 45, hue, 14, '#ffffff', 600) +
        rect(x, ry + 66, sw - 6, 8, hex[500], 4) +
        text(x, ry + 94, who || 'free', 13, who ? INK : MUTED, who ? 600 : 400),
    );
  });
  y = ry + 140;

  // ── 02 Type ──
  s = section(
    y,
    '02',
    'Type',
    'Useful, never loud: the system sans-serif, Faruma for Thaana, six sizes and no others.',
  );
  parts.push(s.svg);
  const sizes: [string, number, number, string, string][] = [
    ['text-2xl', 24, 700, 'ރޭރު', 'Dhivehi title in the viewer'],
    ['text-xl', 20, 600, 'Lesser Whistling-Duck', 'English title in the viewer'],
    ['text-base', 16, 600, 'Ducks, Geese, and Swans', 'Section headings, sidebar title'],
    ['text-sm', 14, 500, 'Search all collections…', 'Controls, body text, tile titles'],
    ['text-xs', 12, 400, '4 of 8 drawn · Dendrocygna javanica', 'Counts, secondary lines'],
    ['text-micro', 11, 600, 'FROM THE ILLUSTRATOR   #001', 'Labels, badges, key hints'],
  ];
  let ty = s.top - 16;
  sizes.forEach(([token, px, weight, sample, use], i) => {
    const h = Math.max(46, px + 28);
    const base = ty + h / 2 + 5;
    parts.push(
      (i ? rule(ty) : '') + text(X, base, token, 14, MUTED, 600) +
        text(X + 120, base, `${px}px`, 14, MUTED) +
        text(X + 200, ty + h / 2 + px / 3, sample, px, INK, weight) +
        text(X + 780, base, use, 15, MUTED),
    );
    ty += h;
  });
  y = ty + 40;

  // ── 04 Form and 06 Motion ──
  s = section(
    y,
    '04 · 06',
    'Form and motion',
    'A quiet frame for the work: three corners, steps of 4px, two speeds.',
  );
  parts.push(s.svg);
  const sy = s.top;
  const corner = (x: number, rx: number, h: number, name: string, use: string) =>
    rect(x, sy + (52 - h) / 2, 150, h, '#ffffff', rx, `stroke="${SLATE['300']}"`) +
    text(x, sy + 80, name, 14, INK, 600) + text(x, sy + 100, use, 13, MUTED);
  parts.push(
    corner(X, 6, 52, 'rounded-control · 6px', 'buttons, inputs, badges') +
      corner(X + 200, 12, 52, 'rounded-card · 12px', 'tiles, panels, menus') +
      corner(X + 400, 14, 28, 'rounded-full', 'count pills, progress bar'),
  );
  [4, 8, 12, 16, 24, 48].forEach((px, i) => {
    const x = X + 640 + i * 60;
    parts.push(
      rect(x, sy + 52 - px, px, px, TEAL['500'], 2) + text(x, sy + 80, `${px}`, 14, INK, 600),
    );
  });
  parts.push(text(X + 640, sy + 100, 'spacing steps (px)', 13, MUTED));
  parts.push(
    text(X + 1040, sy + 20, 'duration-fast · 150ms', 14, INK, 600) +
      text(X + 1040, sy + 40, 'hover, colour', 13, MUTED) +
      text(X + 1040, sy + 80, 'duration-slow · 300ms', 14, INK, 600) +
      text(X + 1040, sy + 100, 'things that move', 13, MUTED),
  );
  y = sy + 150;

  // ── 05 States ──
  s = section(
    y,
    '05',
    'States',
    'Make interaction legible: current is a grey fill, strong text and the accent marker.',
  );
  parts.push(s.svg, navStates(X, s.top, false), navStates(X + 500, s.top, true));
  parts.push(
    rect(X + 1040, s.top + 18, 132, 44, 'none', 9, `stroke="${TEAL['500']}" stroke-width="2.5"`) +
      rect(X + 1046, s.top + 24, 120, 32, SLATE['100'], 6) +
      text(X + 1074, s.top + 45, 'Focused', 15, INK, 500) +
      text(X + 1040, s.top + 100, 'focus ring', 13, MUTED) +
      text(X, s.top + 120, 'light', 13, MUTED) + text(X + 500, s.top + 120, 'dark', 13, MUTED),
  );
  y = s.top + 170;

  // ── 08 Icons ──
  s = section(
    y,
    '08',
    'Icons',
    'One family, one meaning: a 24px grid, a 2px stroke, round ends, no fills.',
  );
  parts.push(s.svg);
  const groups = iconGroups(X, s.top + 10, {
    cols: 15,
    size: 30,
    cell: 82,
    row: 112,
    label: 11,
    name: 11,
  }, INK);
  parts.push(groups.svg);
  y = groups.bottom + 30;

  // ── 09 Tiles: the placeholders, light and dark ──
  s = section(
    y,
    '09',
    'Tiles',
    'Paper or possibility: an undrawn tile shows its collection icon, faint on the tile grey.',
  );
  parts.push(s.svg);
  const P = 120;
  const gap = 16;
  const placeholders = await Promise.all(
    ['', '-dark'].flatMap((suffix, theme) =>
      cols.map(async (c, i) => ({
        input: await sharp(`./public/placeholders/${c.id}${suffix}.webp`).resize(P).png()
          .toBuffer(),
        left: X + theme * (cols.length * (P + gap) + 48) + i * (P + gap),
        top: s.top + 6,
      }))
    ),
  );
  parts.push(
    caps(X, s.top - 10, 'Light'),
    caps(X + cols.length * (P + gap) + 48, s.top - 10, 'Dark'),
    ...placeholders.map((p) =>
      rect(p.left - 1, p.top - 1, P + 2, P + 2, 'none', 0, `stroke="${RULE}"`)
    ),
  );
  y = s.top + 6 + P + 60;

  // ── Closing line ──
  parts.push(
    rule(y) +
      serif(
        X,
        y + 52,
        'Let the drawings speak. Let the interface be clear. Let the rules serve the work.',
        20,
        INK,
      ),
  );
  const height = y + 96;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}">` +
    rect(0, 0, W, height, PAPER) + parts.join('') + '</svg>';
  return { svg, overlays: placeholders };
}

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

/** The contrast figures quoted in docs/DESIGN.md, one line each. */
export function contrastReport(): string[] {
  const pairs: [string, string, string][] = [
    ['text slate-900 on white', SLATE['900'], '#ffffff'],
    ['muted slate-500 on white', SLATE['500'], '#ffffff'],
    ['muted slate-400 on slate-950', SLATE['400'], SLATE['950']],
    ['text slate-100 on slate-950', SLATE['100'], SLATE['950']],
    ['white on accent-700 (button)', '#ffffff', TEAL['700']],
    ['accent-500 marker on white', TEAL['500'], '#ffffff'],
    ['white 70% on black', whiteOnBlack(0.7), '#000000'],
    ['white 50% on black', whiteOnBlack(0.5), '#000000'],
    ['placeholder #a1a1a1 on white', '#a1a1a1', '#ffffff'],
    ['dark placeholder slate-600 on slate-900', SLATE['600'], SLATE['900']],
  ];
  return pairs.map(([label, a, b]) => `  ${contrast(a, b).toFixed(1)}:1  ${label}`);
}

/** Draw every generated image into `dir`: the guide, the icon sheet, the logo sheet and files. */
export async function writeDesignImages(dir = './docs/assets'): Promise<void> {
  const png = (svg: string) => sharp(new TextEncoder().encode(svg));
  const { svg, overlays } = await designGuide();
  await png(svg).composite(overlays).png().toFile(`${dir}/design-guide.png`);
  await png(iconSheetSvg()).png().toFile(`${dir}/icons.png`);
  await writeLogoFiles(dir);
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) {
  await writeDesignImages();
  console.log('  wrote design-guide.png, icons.png, logo.png and logo/ in docs/assets/');
  for (const line of contrastReport()) console.log(line);
}
