/// <reference lib="deno.ns" />
/**
 * Draws the logo sheet (docs/logo.png) and writes the logo as standalone SVG
 * files (docs/logo/). Run through `deno task design`.
 */
import sharp from 'sharp';
import { LOGO_MARK, LOGO_TILE, WORDMARK } from '../../src/components/icons/logo.ts';
import { SLATE } from './palette.ts';

const INK = SLATE['900'];
const MUTED = SLATE['500'];
const FONT = 'font-family="Segoe UI, Helvetica, Arial, sans-serif"';

/** The mark or tile as a complete SVG document in one colour. */
export function logoSvg(kind: 'mark' | 'tile', color: string, size = 32): string {
  const body = (kind === 'mark' ? LOGO_MARK : LOGO_TILE).replaceAll('currentColor', color);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${body}</svg>`;
}

const text = (x: number, y: number, s: string, size = 14, fill = MUTED, weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${s}</text>`;
const at = (body: string, x: number, y: number, size: number, color: string) =>
  `<g transform="translate(${x} ${y}) scale(${size / 32})">${
    body.replaceAll('currentColor', color)
  }</g>`;

/** Mark + wordmark side by side. `h` is the mark's height; text scales with it. */
function lockup(x: number, y: number, h: number, ink: string, soft: string): string {
  const size = h * 0.56;
  const tx = x + h * 1.32;
  return at(LOGO_MARK, x, y, h, ink) +
    `<text x="${tx}" y="${y + h * 0.7}" ${FONT} font-size="${size}" letter-spacing="${
      -size * 0.02
    }">` +
    `<tspan font-weight="600" fill="${ink}">${WORDMARK[0]}</tspan>` +
    `<tspan font-weight="300" fill="${soft}" dx="${size * 0.28}">${WORDMARK[1]}</tspan></text>`;
}

/** Mark above a centred wordmark. */
function stacked(cx: number, y: number, h: number, ink: string, soft: string): string {
  const size = h * 0.36;
  return at(LOGO_MARK, cx - h / 2, y, h, ink) +
    `<text x="${cx}" y="${y + h + size * 1.5}" ${FONT} font-size="${size}" text-anchor="middle">` +
    `<tspan font-weight="600" fill="${ink}">${WORDMARK[0]}</tspan>` +
    `<tspan font-weight="300" fill="${soft}" dx="${size * 0.28}">${WORDMARK[1]}</tspan></text>`;
}

export function logoSheetSvg(): string {
  const W = 1400;
  const H = 900;
  const p: string[] = [];
  const panel = (x: number, y: number, w: number, h: number, dark: boolean) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${
      dark ? SLATE['950'] : '#ffffff'
    }" stroke="${SLATE['200']}"/>`;

  p.push(text(60, 70, 'Wildlife Illustrated — logo', 36, INK, 700));
  p.push(
    text(
      60,
      102,
      'A bird stepping out of an unfinished frame: wildlife leaving the page it was drawn on. Same stroke as the icons.',
      17,
    ),
  );

  // ── Row 1: mark, tile ──
  p.push(text(60, 160, 'MARK', 12, MUTED, 600, 'letter-spacing="1"'));
  p.push(panel(60, 172, 300, 220, false) + at(LOGO_MARK, 146, 218, 128, INK));
  p.push(panel(376, 172, 300, 220, true) + at(LOGO_MARK, 462, 218, 128, '#ffffff'));
  p.push(text(60, 416, 'The default. Slate-900 on light, white on dark. 20px and up.'));

  p.push(text(724, 160, 'TILE', 12, MUTED, 600, 'letter-spacing="1"'));
  p.push(panel(724, 172, 300, 220, false) + at(LOGO_TILE, 810, 218, 128, INK));
  p.push(panel(1040, 172, 300, 220, true) + at(LOGO_TILE, 1126, 218, 128, SLATE['800']));
  p.push(text(724, 416, 'For small or busy places: favicon, app icon, avatar. Below 20px.'));

  // ── Row 2: lockups ──
  p.push(text(60, 480, 'HORIZONTAL LOCKUP', 12, MUTED, 600, 'letter-spacing="1"'));
  p.push(panel(60, 492, 440, 130, false) + lockup(92, 529, 56, INK, MUTED));
  p.push(panel(516, 492, 440, 130, true) + lockup(548, 529, 56, '#ffffff', SLATE['400']));
  p.push(text(60, 646, 'Header and anywhere wide. “Wildlife” semibold, “Illustrated” light.'));

  p.push(text(1004, 480, 'STACKED', 12, MUTED, 600, 'letter-spacing="1"'));
  p.push(panel(1004, 492, 336, 130, false) + stacked(1172, 508, 62, INK, MUTED));
  p.push(text(1004, 646, 'Square spaces and title cards.'));

  // ── Row 3: sizes, clear space, don'ts ──
  p.push(text(60, 710, 'SIZES', 12, MUTED, 600, 'letter-spacing="1"'));
  let x = 60;
  for (const s of [64, 40, 24, 20]) {
    p.push(at(LOGO_MARK, x, 786 - s, s, INK) + text(x, 808, `${s}`, 12));
    x += s + 26;
  }
  x += 14;
  for (const s of [32, 16]) {
    p.push(at(LOGO_TILE, x, 786 - s, s, INK) + text(x, 808, `${s}`, 12));
    x += s + 26;
  }
  p.push(text(60, 836, 'Mark down to 20px; tile below that.'));

  p.push(text(470, 710, 'CLEAR SPACE', 12, MUTED, 600, 'letter-spacing="1"'));
  p.push(
    `<rect x="470" y="724" width="112" height="112" fill="none" stroke="${
      SLATE['300']
    }" stroke-dasharray="4 4"/>` + at(LOGO_MARK, 498, 752, 56, INK) +
      text(596, 772, 'Keep half the mark’s width') + text(596, 792, 'clear on every side.'),
  );

  p.push(text(860, 710, 'DON’T', 12, MUTED, 600, 'letter-spacing="1"'));
  const donts = [
    'recolour it with a collection accent',
    'close the frame or fill the mark',
    'stretch, rotate or add a shadow',
    'set the wordmark in another font or all caps',
  ];
  donts.forEach((d, i) => p.push(text(860, 742 + i * 24, `×  ${d}`, 14, INK)));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<rect width="100%" height="100%" fill="${SLATE['50']}"/>${p.join('')}</svg>`;
}

export async function writeLogoFiles(): Promise<void> {
  await Deno.mkdir('./docs/logo', { recursive: true });
  const files: Record<string, string> = {
    'mark.svg': logoSvg('mark', INK),
    'mark-white.svg': logoSvg('mark', '#ffffff'),
    'tile.svg': logoSvg('tile', INK),
  };
  for (const [name, svg] of Object.entries(files)) {
    await Deno.writeTextFile(`./docs/logo/${name}`, svg + '\n');
  }
  await sharp(new TextEncoder().encode(logoSvg('tile', INK, 512))).png().toFile(
    './docs/logo/tile-512.png',
  );
  await sharp(new TextEncoder().encode(logoSheetSvg())).png().toFile('./docs/logo.png');
}

if (import.meta.main) {
  await writeLogoFiles();
  console.log('  wrote docs/logo.png and docs/logo/');
}
