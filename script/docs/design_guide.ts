/// <reference lib="deno.ns" />
/**
 * Draws docs/design-guide.png and docs/icons.png — the visual half of
 * docs/DESIGN.md. Run `deno task design` after changing a token in
 * src/assets/main.css or an icon in src/components/icons/icons.ts.
 *
 * Hex values are Tailwind's slate and teal ramps (the site uses them by name;
 * these are for drawing the swatches).
 */
import sharp from 'sharp';
import { ICONS } from '../../src/components/icons/icons.ts';

export const SLATE: Record<string, string> = {
  '50': '#f8fafc',
  '100': '#f1f5f9',
  '200': '#e2e8f0',
  '300': '#cbd5e1',
  '400': '#94a3b8',
  '500': '#64748b',
  '600': '#475569',
  '700': '#334155',
  '800': '#1e293b',
  '900': '#0f172a',
  '950': '#020617',
};
export const TEAL: Record<string, string> = {
  '50': '#f0fdfa',
  '100': '#ccfbf1',
  '200': '#99f6e4',
  '300': '#5eead4',
  '400': '#2dd4bf',
  '500': '#14b8a6',
  '600': '#0d9488',
  '700': '#0f766e',
  '800': '#115e59',
  '900': '#134e4a',
  '950': '#042f2e',
};

/** WCAG relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colours (1 to 21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** `#rrggbb` for white at the given opacity over black. */
export const whiteOnBlack = (opacity: number): string => {
  const v = Math.round(255 * opacity).toString(16).padStart(2, '0');
  return `#${v}${v}${v}`;
};

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
const W = 1400;
const INK = SLATE['900'];
const MUTED = SLATE['500'];
const FONT = 'font-family="Segoe UI, Helvetica, Arial, sans-serif"';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (x: number, y: number, s: string, size = 15, fill = INK, weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${
    esc(s)
  }</text>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const icon = (name: keyof typeof ICONS, x: number, y: number, size: number, stroke: string) =>
  `<g transform="translate(${x} ${y}) scale(${
    size / 24
  })" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${
    ICONS[name].body
  }</g>`;
const heading = (y: number, title: string, note: string) =>
  text(60, y, title, 24, INK, 700) + text(60, y + 26, note, 15, MUTED);

function ramp(y: number, name: string, colors: Record<string, string>): string {
  const steps = Object.keys(colors);
  const w = (W - 120) / steps.length;
  return steps.map((step, i) => {
    const hex = colors[step];
    const on = contrast(hex, '#ffffff') > 3 ? '#ffffff' : INK;
    const x = 60 + i * w;
    return rect(x, y, w - 6, 78, hex, 8, `stroke="${SLATE['200']}"`) +
      text(x + 10, y + 26, `${name}-${step}`, 14, on, 600) + text(x + 10, y + 48, hex, 13, on);
  }).join('');
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
  return rect(x, y, 470, 84, bg, 12, `stroke="${SLATE['200']}"`) +
    item(x + 16, 'Default', idle, false, false) + item(x + 168, 'Hover', hover, true, false) +
    item(x + 320, 'Current', current, true, true);
}

type Overlay = sharp.OverlayOptions;

/** The guide as an SVG, plus the placeholder images to composite on top of it. */
export async function designGuide(): Promise<{ svg: string; overlays: Overlay[] }> {
  const parts: string[] = [];
  let y = 70;

  parts.push(text(60, y, 'Wildlife Illustrated — design guide', 36, INK, 700));
  parts.push(
    text(
      60,
      y + 32,
      'The illustrations carry the colour. Everything around them stays quiet, consistent and easy to read.',
      17,
      MUTED,
    ),
  );

  // ── Colour ──
  y += 100;
  parts.push(
    heading(y, '1 · Colour', 'One neutral ramp (slate) and one accent (teal). Nothing else.'),
  );
  parts.push(ramp(y + 48, 'slate', SLATE));
  parts.push(ramp(y + 138, 'accent', TEAL));
  const roles = [
    ['Page', 'slate-50', 'slate-950'],
    ['Surface (header, sidebar, menus)', 'white', 'slate-950 / 900'],
    ['Text', 'slate-900 / 800', 'slate-100'],
    ['Muted text', 'slate-500', 'slate-400'],
    ['Borders', 'slate-200 / 100', 'slate-800'],
    ['Accent: focus ring, current marker, progress', 'accent-500', 'accent-500'],
    ['Accent: primary button', 'accent-700 + white', 'accent-700 + white'],
  ];
  parts.push(
    text(60, y + 256, 'Role', 13, MUTED, 600) + text(520, y + 256, 'Light', 13, MUTED, 600) +
      text(800, y + 256, 'Dark', 13, MUTED, 600),
  );
  roles.forEach(([role, light, dark], i) => {
    const ry = y + 282 + i * 26;
    parts.push(text(60, ry, role, 15) + text(520, ry, light, 15) + text(800, ry, dark, 15));
  });

  // ── Type ──
  y += 500;
  parts.push(
    heading(y, '2 · Type', 'System sans-serif; Faruma for Thaana script. Six sizes, no others.'),
  );
  const sizes: [string, number, number, string, string][] = [
    ['text-2xl', 24, 700, 'ރޭރު', 'Dhivehi title in the viewer'],
    ['text-xl', 20, 600, 'Lesser Whistling-Duck', 'English title in the viewer'],
    ['text-base', 16, 600, 'Ducks, Geese, and Swans', 'Section headings, sidebar title'],
    ['text-sm', 14, 500, 'Search all collections…', 'Controls, body text, tile titles'],
    ['text-xs', 12, 400, '4 of 8 drawn · Dendrocygna javanica', 'Counts, secondary lines'],
    ['text-micro', 11, 600, 'FROM THE ILLUSTRATOR   #001', 'Labels, badges, key hints'],
  ];
  let ty = y + 70;
  for (const [token, px, weight, sample, use] of sizes) {
    parts.push(
      text(60, ty, token, 14, MUTED, 600) + text(170, ty, `${px}px`, 14, MUTED) +
        text(250, ty, sample, px, INK, weight) + text(820, ty, use, 15, MUTED),
    );
    ty += Math.max(34, px + 18);
  }

  // ── Shape, spacing, motion ──
  y = ty + 40;
  parts.push(
    heading(
      y,
      '3 · Shape, spacing and motion',
      'Two corner radii and pills. Spacing in steps of 4px. Two speeds.',
    ),
  );
  const sy = y + 56;
  parts.push(
    rect(60, sy, 150, 52, SLATE['100'], 6, `stroke="${SLATE['300']}"`) +
      text(60, sy + 76, 'rounded-control · 6px', 14, INK, 600) +
      text(60, sy + 96, 'buttons, inputs, badges', 13, MUTED),
  );
  parts.push(
    rect(280, sy, 150, 52, SLATE['100'], 12, `stroke="${SLATE['300']}"`) +
      text(280, sy + 76, 'rounded-card · 12px', 14, INK, 600) +
      text(280, sy + 96, 'tiles, panels, menus', 13, MUTED),
  );
  parts.push(
    rect(500, sy + 12, 150, 28, SLATE['100'], 14, `stroke="${SLATE['300']}"`) +
      text(500, sy + 76, 'rounded-full', 14, INK, 600) +
      text(500, sy + 96, 'count pills, progress bar', 13, MUTED),
  );
  [4, 8, 12, 16, 24, 48].forEach((px, i) => {
    const x = 740 + i * 76;
    parts.push(
      rect(x, sy + 52 - px, px, px, TEAL['500'], 2) + text(x, sy + 76, `${px}`, 14, INK, 600),
    );
  });
  parts.push(text(740, sy + 96, 'spacing steps (px): gaps, padding, margins', 13, MUTED));
  parts.push(
    text(1220, sy + 20, 'duration-fast · 150ms', 14, INK, 600) +
      text(1220, sy + 40, 'hover, colour', 13, MUTED) +
      text(1220, sy + 70, 'duration-slow · 300ms', 14, INK, 600) +
      text(1220, sy + 90, 'things that move', 13, MUTED),
  );

  // ── States ──
  y = sy + 150;
  parts.push(
    heading(
      y,
      '4 · States',
      'One look for “this is the current one”: grey fill, strong text, teal marker. Keyboard focus is always a teal ring.',
    ),
  );
  parts.push(navStates(60, y + 50, false) + navStates(560, y + 50, true));
  // Focus ring + primary button
  parts.push(
    rect(1064, y + 68, 132, 44, 'none', 9, `stroke="${TEAL['500']}" stroke-width="2.5"`) +
      rect(1070, y + 74, 120, 32, SLATE['100'], 6) + text(1098, y + 95, 'Focused', 15, INK, 500) +
      rect(1230, y + 74, 110, 32, TEAL['700'], 6) +
      text(1251, y + 95, 'Try again', 15, '#ffffff', 500),
  );
  parts.push(
    text(1064, y + 150, 'focus ring', 13, MUTED) + text(1230, y + 150, 'primary action', 13, MUTED),
  );

  // ── Icons ──
  y += 200;
  parts.push(
    heading(
      y,
      '5 · Icons and placeholders',
      '24px grid, 2px stroke, round ends, no fills. Placeholders are the same icons in #a1a1a1 on white.',
    ),
  );
  const names = Object.keys(ICONS) as (keyof typeof ICONS)[];
  names.forEach((n, i) => {
    const x = 60 + (i % 9) * 100;
    const iy = y + 60 + Math.floor(i / 9) * 92;
    parts.push(
      icon(n, x + 16, iy, 36, INK) +
        text(x + 34, iy + 60, n, 12, MUTED, 400, 'text-anchor="middle"'),
    );
  });

  const height = y + 60 + Math.ceil(names.length / 9) * 92 + 40;
  const placeholders = await Promise.all(
    ['birds', 'sharks', 'shells'].map(async (id, i) => ({
      input: await sharp(`./public/placeholders/${id}.webp`).resize(128).png().toBuffer(),
      left: 950 + i * 140,
      top: y + 52,
    })),
  );
  parts.push(
    ...placeholders.map((p) =>
      rect(p.left - 1, p.top - 1, 130, 130, 'none', 0, `stroke="${SLATE['200']}"`)
    ),
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}">` +
    rect(0, 0, W, height, '#ffffff') + parts.join('') + '</svg>';
  return { svg, overlays: placeholders };
}

async function iconSheet(path: string): Promise<void> {
  const names = Object.keys(ICONS) as (keyof typeof ICONS)[];
  const cols = 6;
  const cell = 150;
  const rows = Math.ceil(names.length / cols);
  const body = names.map((n, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    return icon(n, x + 39, y + 20, 72, '#111111') +
      text(x + 75, y + 125, n, 15, '#555555', 400, 'text-anchor="middle"');
  }).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}">` +
    rect(0, 0, cols * cell, rows * cell, '#ffffff') + body + '</svg>';
  await sharp(new TextEncoder().encode(svg)).png().toFile(path);
}

if (import.meta.main) {
  const { svg, overlays } = await designGuide();
  await sharp(new TextEncoder().encode(svg)).composite(overlays).png().toFile(
    './docs/design-guide.png',
  );
  await iconSheet('./docs/icons.png');
  console.log('  wrote docs/design-guide.png and docs/icons.png');

  // Contrast figures quoted in docs/DESIGN.md.
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
  ];
  for (const [label, a, b] of pairs) console.log(`  ${contrast(a, b).toFixed(1)}:1  ${label}`);
}
