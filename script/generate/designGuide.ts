/**
 * Draws docs/assets/design-guide.png — the visual half of docs/DESIGN.md. Run
 * `npm run generate` after changing a token in src/styles/accents.css or an icon in
 * src/lib/icons.ts. The colours and the contrast maths are in ./palette.ts; the drawing
 * kit it shares with the icon sheet is in ./guideDrawing.ts.
 */
import { readFile } from 'node:fs/promises';
import sharp, { type OverlayOptions } from 'sharp';
import { PRINCIPLES } from './principles.ts';
import { ACCENT_HEX, accentMenu, contrast, SLATE, TEAL, whiteOnBlack } from './palette.ts';
import { readJson } from '../lib/fs.ts';
import { PATHS } from '../lib/paths.ts';
import type { CollectionEntry } from '../../src/data/files.ts';
import {
  balanceTwoLines,
  caps,
  FONT,
  icon,
  iconGroups,
  INK,
  LABEL,
  line,
  MUTED,
  PAPER,
  para,
  rect,
  RULE,
  rule,
  RULE_SOFT,
  serif,
  SERIF_FACE,
  statement,
  text,
  thaana,
  W,
  wrapText,
  X,
} from './guideDrawing.ts';

/** The corner radii and the two speeds, as the site's CSS defines them (px and ms). */
export interface FormTokens {
  controlPx: number;
  cardPx: number;
  fastMs: number;
  slowMs: number;
}

/**
 * The form tokens, from the text of tokens.css and main.css (rem at 16px to the rem).
 * Throws when one is missing, so a renamed token fails the guide instead of a number
 * going stale on it.
 */
export function formTokensFrom(tokensCss: string, mainCss: string): FormTokens {
  const rem = (name: string) => {
    const found = tokensCss.match(new RegExp(`--wi-radius-${name}:\\s*([\\d.]+)rem`));
    if (!found) throw new Error(`tokens.css has no --wi-radius-${name} in rem`);
    return Number(found[1]) * 16;
  };
  const ms = (name: string) => {
    const found = mainCss.match(
      new RegExp(`@utility duration-${name} \\{\\s*transition-duration:\\s*(\\d+)ms`),
    );
    if (!found) throw new Error(`main.css has no duration-${name} in ms`);
    return Number(found[1]);
  };
  return { controlPx: rem('control'), cardPx: rem('card'), fastMs: ms('fast'), slowMs: ms('slow') };
}

/** The form tokens as the site's CSS defines them now, so the guide quotes what the site uses. */
export async function readFormTokens(): Promise<FormTokens> {
  return formTokensFrom(
    await readFile(PATHS.tokensCss, 'utf8'),
    await readFile(PATHS.mainCss, 'utf8'),
  );
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
      text(x + 10, y + 30, `${name}-${step}`, 16, on, 600) + text(x + 10, y + 56, hex, 15, on);
  }).join('');
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
      ring: TEAL['500'],
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
      ring: TEAL['700'], // 500 is too pale on white for a ring
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
      'Focus ring, current marker',
      dark ? 'accent-500' : 'accent-700',
      (sx, sy) => rect(sx, sy + 12, 56, 4, t.ring, 2),
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
      text(x + w - 24, ry + 29, tokens, 15, t.muted, 400, 'text-anchor="end"');
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
    rect(x + 24 + 2 * 140 + 10, y + 94, 104, 2.5, t.ring, 2) +
    item(3, 'Focus', t.muted, false) +
    rect(focusX - 4, y + 52, 132, 48, 'none', 9, `stroke="${t.ring}" stroke-width="2.5"`);
}

type Overlay = OverlayOptions;

/**
 * The guide as an SVG, plus the images laid over it: the placeholders, and the
 * Dhivehi samples (which the SVG renderer cannot shape).
 */
export async function designGuide(
  collections?: CollectionEntry[], // defaults to public/collections.json
): Promise<{ svg: string; placeholders: Overlay[]; dhivehi: Overlay[] }> {
  const cols = collections ?? await readJson<CollectionEntry[]>('./public/collections.json');
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
      (i ? line(x - 28, y + 72, x - 28, y + 420, RULE_SOFT) : '') +
        icon(p.icon, x, y + 72, 36, INK) +
        caps(x, y + 164, `P${i + 1}`) +
        // Every heading in two even lines, so the five share one shape and one top.
        para(
          x,
          y + 214,
          balanceTwoLines(p.title),
          38,
          `${SERIF_FACE} font-size="30" fill="${INK}"`,
        ) +
        para(
          x,
          y + 304,
          wrapText(p.summary, 24),
          29,
          `${FONT} font-size="18" fill="${SLATE['700']}"`,
        ),
    );
  });
  y += 492;

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
  const ry = card.bottom + 48;
  parts.push(
    caps(X, ry, 'Accent menu') +
      serif(X + 168, ry, 'picked per collection in collections.json; the marker shade beneath', 16),
  );
  const sw = (W - 2 * X) / menu.length;
  menu.forEach((hue, i) => {
    const hex = ACCENT_HEX[hue];
    // A guard for a new accent added to accents.css without its hex values; the real data has them all.
    /* c8 ignore next 3 */
    if (!hex) {
      throw new Error(`design guide: no hex values for accent "${hue}" (add it to ACCENT_HEX)`);
    }
    const x = X + i * sw;
    const who = usedBy(hue);
    parts.push(
      rect(x, ry + 16, sw - 6, 30, hex[700], 6) + text(x + 9, ry + 36, hue, 15, '#ffffff', 600) +
        rect(x, ry + 50, sw - 6, 3, hex[500], 1.5) +
        text(x, ry + 76, who || 'free', 15, who ? INK : LABEL, who ? 600 : 400),
    );
  });
  y = ry + 118;

  // ── Type: one name as the specimen, then the scale ──
  s = section(
    y,
    'Type',
    'Useful, never loud.',
    'The system sans-serif, and Faruma for Thaana. Six sizes and no others.',
  );
  parts.push(s.svg);
  // One name in its three languages, in the order and proportions the site uses:
  // Dhivehi first and largest, English second, the scientific name small and italic.
  const hero = s.top + 64;
  const names: [string, number, string][] = [
    ['Dhivehi', hero, 'first, a step larger: Faruma reads small'],
    ['English', hero + 64, 'second; what search results lead with'],
    ['Scientific', hero + 102, 'last, italic; it can wait for the viewer'],
  ];
  dhivehi.push(await thaana('ރޭރު', X, hero, 76));
  parts.push(
    text(X, hero + 64, 'Lesser Whistling-Duck', 44, INK, 600, 'letter-spacing="-0.5"') +
      text(X, hero + 102, 'Dendrocygna javanica', 20, MUTED, 400, 'font-style="italic"') +
      names.map(([label, base, note]) =>
        caps(X + 820, base, label) + text(X + 950, base, note, 15, LABEL)
      )
        .join(''),
  );
  const sizes: [string, number, number, string, string][] = [
    ['text-3xl', 30, 700, 'ރޭރު', 'Dhivehi title in the viewer'],
    ['text-xl', 20, 600, 'Lesser Whistling-Duck', 'English title, with no Dhivehi name'],
    ['text-base', 16, 600, 'Ducks, Geese, and Swans', 'Section headings, sidebar title'],
    ['text-sm', 14, 500, 'Search all collections…', 'Controls, body text, tile titles'],
    ['text-xs', 12, 400, '4 of 8 drawn · Dendrocygna javanica', 'Counts, secondary lines'],
    ['text-micro', 11, 600, 'FROM THE ILLUSTRATOR   #001', 'Labels, badges, key hints'],
  ];
  let ty = hero + 176;
  for (const [token, px, weight, sample, use] of sizes) {
    if (token === 'text-3xl') dhivehi.push(await thaana(sample, X, ty, px));
    else parts.push(text(X, ty, sample, px, INK, weight));
    parts.push(
      text(X + 820, ty, token, 15, INK, 600) + text(X + 920, ty, `${px}px`, 15, MUTED) +
        text(X + 980, ty, use, 15, MUTED),
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
    text(x, sy + 80, name, 15, INK, 600) + text(x, sy + 101, use, 15, LABEL);
  const form = await readFormTokens();
  parts.push(
    corner(
      X,
      form.controlPx,
      52,
      `rounded-control · ${form.controlPx}px`,
      'buttons, inputs, badges',
    ) +
      corner(X + 200, form.cardPx, 52, `rounded-card · ${form.cardPx}px`, 'tiles, panels, menus') +
      corner(X + 400, 14, 28, 'rounded-full', 'count pills, progress bar'),
  );
  [4, 8, 12, 16, 24, 48].forEach((px, i) => {
    const x = X + 640 + i * 60;
    parts.push(
      rect(x, sy + 52 - px, px, px, TEAL['500'], 2) + text(x, sy + 80, `${px}`, 15, INK, 600),
    );
  });
  parts.push(text(X + 640, sy + 101, 'spacing steps (px)', 15, LABEL));
  parts.push(
    text(X + 1040, sy + 20, `duration-fast · ${form.fastMs}ms`, 15, INK, 600) +
      text(X + 1040, sy + 41, 'hover, colour', 15, LABEL) +
      text(X + 1040, sy + 80, `duration-slow · ${form.slowMs}ms`, 15, INK, 600) +
      text(X + 1040, sy + 101, 'things that move', 15, LABEL),
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
    cols: 13, // two tracks of six, one empty column between them
    tracks: 2,
    size: 30,
    cell: 95,
    row: 152,
    label: 14,
    name: 14,
    gap: 30,
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
  y = s.top + 6 + P + 150;

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

/** The contrast figures quoted in docs/DESIGN.md, one line each. */
export function contrastReport(): string[] {
  const pairs: [string, string, string][] = [
    ['text slate-900 on white', SLATE['900'], '#ffffff'],
    ['muted slate-500 on white', SLATE['500'], '#ffffff'],
    ['muted slate-400 on slate-950', SLATE['400'], SLATE['950']],
    ['text slate-100 on slate-950', SLATE['100'], SLATE['950']],
    ['white on accent-700 (button)', '#ffffff', TEAL['700']],
    ['accent-500 progress on white', TEAL['500'], '#ffffff'],
    ['accent-700 ring on white', TEAL['700'], '#ffffff'],
    ['accent-500 ring on slate-950', TEAL['500'], SLATE['950']],
    ['white 70% on black', whiteOnBlack(0.7), '#000000'],
    ['white 50% on black', whiteOnBlack(0.5), '#000000'],
    ['placeholder #a1a1a1 on white', '#a1a1a1', '#ffffff'],
    ['dark placeholder slate-600 on slate-900', SLATE['600'], SLATE['900']],
  ];
  return pairs.map(([label, a, b]) => `  ${contrast(a, b).toFixed(1)}:1  ${label}`);
}

/** Draw the guide into `dir` (docs/assets/ by default) as design-guide.png. */
export async function writeDesignGuide(dir: string = PATHS.docsAssets): Promise<string> {
  const { svg, placeholders, dhivehi } = await designGuide();
  const path = `${dir}/design-guide.png`;
  await sharp(new TextEncoder().encode(svg)).composite([...placeholders, ...dhivehi]).png()
    .toFile(path);
  return path;
}
