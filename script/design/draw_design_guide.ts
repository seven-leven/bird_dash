/**
 * Draws docs/assets/design-guide.png and docs/assets/icons.png — the visual half of
 * docs/DESIGN.md. Run `npm run design` after changing a token in
 * src/styles/main.css or an icon in src/lib/icons.ts.
 *
 * The colours and the contrast maths are in ./palette.ts.
 */
import sharp, { type OverlayOptions } from 'sharp';
import { ICON_GROUPS, type IconDef, ICONS } from '../../src/lib/icons.ts';
import { writeFavicons, writeLogoFiles } from './draw_logo.ts';
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
// The guide is a document in its own voice: warm paper, fine rules, a serif for
// statements. The site's own colours are the slate and accent swatches drawn on it.
const PAPER = '#fbfaf7';
const RULE = '#e2ded5';
const FONT = 'font-family="Segoe UI, Helvetica, Arial, sans-serif"';
const SERIF_FACE = 'font-family="Georgia, Cambria, serif"';
const SERIF = `${SERIF_FACE} font-style="italic"`;
// The SVG renderer cannot shape Thaana, so Dhivehi is drawn by Pango in the
// site's own Thaana font and laid over the page.
const FARUMA = './src/styles/fonts/Faruma.woff';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x: number, y: number, s: string, size = 15, fill = INK, weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${
    esc(s)
  }</text>`;
const caps = (x: number, y: number, s: string, fill = MUTED) =>
  text(x, y, s.toUpperCase(), 12, fill, 600, 'letter-spacing="1.5"');
const serif = (x: number, y: number, s: string, size = 17, fill = MUTED) =>
  `<text x="${x}" y="${y}" ${SERIF} font-size="${size}" fill="${fill}">${esc(s)}</text>`;
const statement = (x: number, y: number, s: string, size: number) =>
  `<text x="${x}" y="${y}" ${SERIF_FACE} font-size="${size}" fill="${INK}">${esc(s)}</text>`;

/** Break `s` into lines of at most `max` characters, at spaces. */
export function wrap(s: string, max: number): string[] {
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
const para = (x: number, y: number, lines: string[], lead: number, attrs: string) =>
  `<text x="${x}" y="${y}" ${attrs}>${
    lines.map((l, i) => `<tspan x="${x}" dy="${i ? lead : 0}">${esc(l)}</tspan>`).join('')
  }</text>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const line = (x1: number, y1: number, x2: number, y2: number, stroke = RULE) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1"/>`;
const rule = (y: number) => line(X, y, W - X, y);
const icon = (name: keyof typeof ICONS, x: number, y: number, size: number, ink: string) => {
  const def: IconDef = ICONS[name];
  const paint = def.filled
    ? `fill="${ink}" stroke="none"`
    : `fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" ${paint}>${def.body}</g>`;
};

/** Dhivehi in Faruma, `size` px, its baseline at `baseline`: an image to lay over the page. */
async function thaana(s: string, x: number, baseline: number, size: number) {
  const input = await sharp({
    text: {
      text: `<span foreground="${INK}">${s}</span>`,
      font: `Faruma ${size}`,
      fontfile: FARUMA,
      rgba: true,
      dpi: 72,
    },
  }).png().toBuffer();
  return { input, left: x, top: Math.round(baseline - size * 0.95) };
}

/**
 * Every section has the same shape: a fine rule, a small label, a statement in
 * the serif, then one line of specifics. Returns the markup and where the
 * section's demonstration starts.
 */
function section(y: number, label: string, says: string, specifics: string) {
  const svg = rule(y) + caps(X, y + 52, label) + statement(X, y + 98, says, 34) +
    text(X, y + 132, specifics, 16, MUTED);
  return { svg, top: y + 176 };
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

/** The colours of one theme, as the role cards and the states draw them. */
const theme = (dark: boolean) =>
  dark
    ? {
      card: SLATE['900'],
      page: SLATE['950'],
      surface: SLATE['950'],
      fill: SLATE['800'],
      ink: SLATE['100'],
      hover: SLATE['200'],
      muted: SLATE['400'],
      border: SLATE['800'],
      viewer: ['#ffffff', whiteOnBlack(0.7), whiteOnBlack(0.5)],
    }
    : {
      card: '#ffffff',
      page: SLATE['50'],
      surface: '#ffffff',
      fill: SLATE['100'],
      ink: SLATE['900'],
      hover: SLATE['800'],
      muted: SLATE['500'],
      border: SLATE['200'],
      viewer: [SLATE['900'], SLATE['600'], SLATE['500']],
    };

/** A card in one theme's colours, labelled in the corner. */
const themeCard = (x: number, y: number, w: number, h: number, dark: boolean) => {
  const t = theme(dark);
  return rect(x, y, w, h, t.card, 12, `stroke="${RULE}"`) +
    caps(x + 24, y + 32, dark ? 'Dark theme' : 'Light theme', t.muted);
};

/**
 * Where colour belongs, drawn in one theme: each role shown in its real colours
 * on a card of that theme, with its name and its tokens.
 */
function roleCard(x: number, y: number, w: number, dark: boolean) {
  const t = theme(dark);
  const aa = (ax: number, ay: number, fill: string, size = 18) =>
    text(ax, ay, 'Aa', size, fill, 600);
  const swatch = (fill: string, sx: number, sy: number) =>
    rect(sx, sy, 56, 28, fill, 6, `stroke="${t.border}"`);
  // Each sample is drawn in a 56 × 28 box whose top-left corner is (sx, sy).
  const roles: [string, string, (sx: number, sy: number) => string][] = [
    ['Page', dark ? 'slate-950' : 'slate-50', (sx, sy) => swatch(t.page, sx, sy)],
    [
      'Surface: header, sidebar, menus',
      dark ? 'slate-950 / 900' : 'white',
      (sx, sy) => swatch(t.surface, sx, sy),
    ],
    ['Text', dark ? 'slate-100' : 'slate-900 / 800', (sx, sy) => aa(sx + 2, sy + 21, t.ink)],
    ['Muted text', dark ? 'slate-400' : 'slate-500', (sx, sy) => aa(sx + 2, sy + 21, t.muted)],
    [
      'Borders and dividers',
      dark ? 'slate-800' : 'slate-200 / 100',
      (sx, sy) => rect(sx, sy, 56, 28, 'none', 6, `stroke="${t.border}" stroke-width="2"`),
    ],
    [
      'Focus, current marker, progress',
      'accent-500',
      (sx, sy) => rect(sx, sy + 12, 56, 4, TEAL['500'], 2),
    ],
    [
      'Primary button',
      'accent-700 + white',
      (sx, sy) => rect(sx, sy, 56, 28, TEAL['700'], 6) + aa(sx + 15, sy + 19, '#ffffff', 14),
    ],
    [
      'Viewer: title, body, label',
      dark ? 'white 100 / 70 / 50%' : 'slate-900 / 600 / 500',
      (sx, sy) => t.viewer.map((c, i) => aa(sx + i * 22, sy + 20, c, 14)).join(''),
    ],
  ];
  const row = 46;
  const top = y + 52;
  let svg = themeCard(x, y, w, 52 + roles.length * row + 12, dark);
  roles.forEach(([name, tokens, sample], i) => {
    const ry = top + i * row;
    svg += line(x + 24, ry, x + w - 24, ry, t.border) + sample(x + 24, ry + 9) +
      text(x + 100, ry + 29, name, 15, t.ink) +
      text(x + w - 24, ry + 29, tokens, 14, t.muted, 400, 'text-anchor="end"');
  });
  return { svg, bottom: top + roles.length * row + 12 };
}

/** The four states of a `.nav-item`, at one scale, in one theme. */
function navStates(x: number, y: number, w: number, dark: boolean): string {
  const t = theme(dark);
  const item = (i: number, label: string, color: string, filled: boolean) => {
    const ix = x + 24 + i * 140;
    const iy = y + 56;
    return (filled ? rect(ix, iy, 124, 40, t.fill, 6) : '') +
      icon('bird', ix + 12, iy + 10, 20, color) + text(ix + 40, iy + 26, label, 16, color, 500);
  };
  const focusX = x + 24 + 3 * 140;
  return themeCard(x, y, w, 128, dark) + item(0, 'Default', t.muted, false) +
    item(1, 'Hover', t.hover, true) + item(2, 'Current', t.ink, true) +
    rect(x + 24 + 2 * 140 + 10, y + 94, 104, 2.5, TEAL['500'], 2) +
    item(3, 'Focus', t.muted, false) +
    rect(focusX - 4, y + 52, 132, 48, 'none', 9, `stroke="${TEAL['500']}" stroke-width="2.5"`);
}

type Overlay = OverlayOptions;

/**
 * The guide as an SVG, plus the images laid over it: the placeholders, and the
 * Dhivehi samples (which the SVG renderer cannot shape).
 */
export async function designGuide(
  collections?: RawCollectionConfig[], // defaults to public/collections.json
): Promise<{ svg: string; placeholders: Overlay[]; dhivehi: Overlay[] }> {
  const cols = collections ?? await readJson<RawCollectionConfig[]>('./public/collections.json');
  const parts: string[] = [];
  const dhivehi: Overlay[] = [];

  // ── Title: the manifesto's name, then the one idea everything follows from ──
  parts.push(
    caps(X, 96, 'Design manifesto') + statement(X, 172, 'Wildlife Illustrated', 68) +
      serif(X, 238, 'The drawings carry the colour.', 28, INK) +
      serif(X, 276, 'Everything around them makes room.', 28, INK),
  );

  // ── The five principles, side by side: icon, number, title, and the principle ──
  let y = 336;
  parts.push(rule(y));
  const colW = (W - 2 * X) / PRINCIPLES.length;
  PRINCIPLES.forEach((p, i) => {
    const x = X + i * colW + (i ? 28 : 0);
    parts.push(
      (i ? line(x - 28, y + 56, x - 28, y + 372) : '') + icon(p.icon, x, y + 56, 40, INK) +
        caps(x, y + 148, `P${i + 1}`) +
        para(x, y + 196, wrap(p.title, 15), 38, `${SERIF_FACE} font-size="30" fill="${INK}"`) +
        para(x, y + 296, wrap(p.summary, 26), 26, `${FONT} font-size="17" fill="${MUTED}"`),
    );
  });
  y += 440;

  // ── Colour ──
  let s = section(
    y,
    'Colour',
    'Quiet ground, clear signal.',
    'Slate for surfaces and text; one accent per collection, kept for meaning (teal shown).',
  );
  parts.push(s.svg, ramp(s.top, 'slate', SLATE), ramp(s.top + 90, 'accent', TEAL));
  const cardW = (W - 2 * X - 40) / 2;
  const card = roleCard(X, s.top + 200, cardW, false);
  parts.push(card.svg, roleCard(X + cardW + 40, s.top + 200, cardW, true).svg);

  // The accent menu, as a slim strip: every hue a collection may pick, and who has.
  const menu = await accentMenu();
  const usedBy = (hue: string) =>
    cols.filter((c) => (c.accent ?? 'teal') === hue).map((c) => c.label).join(', ');
  const ry = card.bottom + 56;
  parts.push(
    caps(X, ry, 'Accent menu') +
      serif(X + 132, ry, 'picked per collection in collections.json; the marker shade beneath', 15),
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
      rect(x, ry + 16, sw - 6, 26, hex[700], 6) + text(x + 8, ry + 33, hue, 12, '#ffffff', 600) +
        rect(x, ry + 45, sw - 6, 4, hex[500], 2) +
        text(x, ry + 68, who || 'free', 12, who ? INK : MUTED, who ? 600 : 400),
    );
  });
  y = ry + 116;

  // ── Type: one name as the specimen, then the scale ──
  s = section(
    y,
    'Type',
    'Useful, never loud.',
    'The system sans-serif, and Faruma for Thaana. Six sizes and no others.',
  );
  parts.push(s.svg);
  const hero = s.top + 56;
  dhivehi.push(await thaana('ރޭރު', X, hero, 48));
  parts.push(
    text(X, hero + 66, 'Lesser Whistling-Duck', 56, INK, 600, 'letter-spacing="-1"') +
      text(X, hero + 104, 'Dendrocygna javanica', 22, MUTED, 400, 'font-style="italic"') +
      text(X + 820, hero - 8, 'Dhivehi, English, scientific:', 15, MUTED) +
      text(X + 820, hero + 16, 'the same order on tiles and in the viewer.', 15, MUTED),
  );
  const sizes: [string, number, number, string, string][] = [
    ['text-2xl', 24, 700, 'ރޭރު', 'Dhivehi title in the viewer'],
    ['text-xl', 20, 600, 'Lesser Whistling-Duck', 'English title in the viewer'],
    ['text-base', 16, 600, 'Ducks, Geese, and Swans', 'Section headings, sidebar title'],
    ['text-sm', 14, 500, 'Search all collections…', 'Controls, body text, tile titles'],
    ['text-xs', 12, 400, '4 of 8 drawn · Dendrocygna javanica', 'Counts, secondary lines'],
    ['text-micro', 11, 600, 'FROM THE ILLUSTRATOR   #001', 'Labels, badges, key hints'],
  ];
  let ty = hero + 168;
  for (const [token, px, weight, sample, use] of sizes) {
    if (token === 'text-2xl') dhivehi.push(await thaana(sample, X, ty, px));
    else parts.push(text(X, ty, sample, px, INK, weight));
    parts.push(
      text(X + 820, ty, token, 14, INK, 600) + text(X + 920, ty, `${px}px`, 14, MUTED) +
        text(X + 980, ty, use, 14, MUTED),
    );
    ty += 46;
  }
  y = ty + 30;

  // ── Form and motion ──
  s = section(
    y,
    'Form and motion',
    'A quiet frame for the work.',
    'Three corner treatments, spacing in steps of 4px, and two speeds.',
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
  y = sy + 156;

  // ── States: default, hover, current and focus, at one scale, in both themes ──
  s = section(
    y,
    'States',
    'Make interaction legible.',
    'Current is a grey fill, strong text and the accent marker; focus is always an accent ring.',
  );
  parts.push(
    s.svg,
    navStates(X, s.top, cardW, false),
    navStates(X + cardW + 40, s.top, cardW, true),
  );
  y = s.top + 184;

  // ── Icons ──
  s = section(
    y,
    'Icons',
    'One family, one meaning.',
    'A 24px grid, a 2px stroke, round ends, no fills. The groups share one column grid.',
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
  y = groups.bottom + 36;

  // ── Tiles: the placeholders, light beside dark ──
  s = section(
    y,
    'Tiles',
    'Paper or possibility.',
    'An undrawn tile shows its collection icon, faint on the tile grey, drawn once per theme.',
  );
  parts.push(s.svg);
  const P = 120;
  const gap = 16;
  const darkX = X + cols.length * (P + gap) + 48;
  const placeholders = await Promise.all(
    ['', '-dark'].flatMap((suffix, dark) =>
      cols.map(async (c, i) => ({
        input: await sharp(`./public/placeholders/${c.id}${suffix}.webp`).resize(P).png()
          .toBuffer(),
        left: (dark ? darkX : X) + i * (P + gap),
        top: s.top + 6,
      }))
    ),
  );
  parts.push(
    caps(X, s.top - 10, 'Light'),
    caps(darkX, s.top - 10, 'Dark'),
    ...placeholders.map((p) =>
      rect(p.left - 1, p.top - 1, P + 2, P + 2, 'none', 0, `stroke="${RULE}"`)
    ),
  );
  y = s.top + 6 + P + 110;

  // ── The ending, set like the opening ──
  parts.push(
    rule(y) + serif(X, y + 76, 'Let the drawings speak. Let the interface be clear.', 28, INK) +
      serif(X, y + 114, 'Let the rules serve the work.', 28, INK),
  );
  const height = y + 180;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}">` +
    rect(0, 0, W, height, PAPER) + parts.join('') + '</svg>';
  return { svg, placeholders, dhivehi };
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

/**
 * Draw every generated image: the guide, the icon sheet, the logo sheet and files
 * into `dir`, and the favicons into `publicDir`.
 */
export async function writeDesignImages(
  dir = './docs/assets',
  publicDir = './public',
): Promise<void> {
  const png = (svg: string) => sharp(new TextEncoder().encode(svg));
  const { svg, placeholders, dhivehi } = await designGuide();
  await png(svg).composite([...placeholders, ...dhivehi]).png().toFile(`${dir}/design-guide.png`);
  await png(iconSheetSvg()).png().toFile(`${dir}/icons.png`);
  await writeLogoFiles(dir);
  await writeFavicons(publicDir);
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) {
  await writeDesignImages();
  console.log(
    '  wrote design-guide.png, icons.png, logo.png and logo/ in docs/assets/, favicons in public/',
  );
  for (const line of contrastReport()) console.log(line);
}
