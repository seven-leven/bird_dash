/**
 * The colours the design guide draws, and the contrast maths behind the rules
 * in docs/DESIGN.md. Every value is read from Tailwind's own palette, the one
 * the site renders, and converted from oklch to hex here, so the guide, the
 * contrast figures and the placeholders measure the colours visitors see.
 */

import { readFile } from 'node:fs/promises';
import colors from 'tailwindcss/colors';

/**
 * `#rrggbb` for a CSS `oklch(L% C H)` colour, as an sRGB screen shows it: through
 * OKLab and linear sRGB, then clamped into range.
 */
export function oklchToHex(css: string): string {
  // A grey has no hue, which CSS writes as `none`.
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+|none)\)$/.exec(css);
  if (!m) throw new Error(`not an oklch() colour: ${css}`);
  const hue = m[3] === 'none' ? 0 : Number(m[3]);
  const [L, C, h] = [Number(m[1]) / 100, Number(m[2]), (hue * Math.PI) / 180];
  const [a, b] = [C * Math.cos(h), C * Math.sin(h)];
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return '#' + linear.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  }).join('');
}

type Ramp = Record<string, string>;
const tailwind = colors as unknown as Record<string, Ramp | string>;
const ramp = (hue: string): Ramp =>
  Object.fromEntries(Object.entries(tailwind[hue] as Ramp).map(([k, v]) => [k, oklchToHex(v)]));

export const SLATE: Ramp = ramp('slate');
export const TEAL: Ramp = ramp('teal');

/** The 500 and 700 shades of every Tailwind hue, any of which an accent may use. */
export const ACCENT_HEX: Record<string, { 500: string; 700: string }> = Object.fromEntries(
  Object.entries(tailwind)
    .filter(([, v]) => typeof v === 'object' && '500' in v && '700' in v)
    .map((
      [hue, v],
    ) => [hue, { 500: oklchToHex((v as Ramp)['500']), 700: oklchToHex((v as Ramp)['700']) }]),
);

/** The accent hues on offer: the `[data-accent='…']` palettes in accents.css, in file order. */
export async function accentMenu(): Promise<string[]> {
  const css = await readFile('./src/styles/accents.css', 'utf8');
  return [...new Set([...css.matchAll(/\[data-accent='([\w-]+)'\]/g)].map((m) => m[1]))];
}

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
