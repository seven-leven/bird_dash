/// <reference lib="deno.ns" />
/**
 * The colours the design guide draws, and the contrast maths behind the rules
 * in docs/DESIGN.md. Hex values are Tailwind's (the site uses the colours by
 * name; these exist to draw swatches and to measure contrast).
 */

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

/** The 500 and 700 shades of every hue an accent may use (Tailwind's values). */
export const ACCENT_HEX: Record<string, { 500: string; 700: string }> = {
  teal: { 500: '#14b8a6', 700: '#0f766e' },
  emerald: { 500: '#10b981', 700: '#047857' },
  cyan: { 500: '#06b6d4', 700: '#0e7490' },
  sky: { 500: '#0ea5e9', 700: '#0369a1' },
  blue: { 500: '#3b82f6', 700: '#1d4ed8' },
  indigo: { 500: '#6366f1', 700: '#4338ca' },
  violet: { 500: '#8b5cf6', 700: '#6d28d9' },
  purple: { 500: '#a855f7', 700: '#7e22ce' },
  fuchsia: { 500: '#d946ef', 700: '#a21caf' },
  pink: { 500: '#ec4899', 700: '#be185d' },
  rose: { 500: '#f43f5e', 700: '#be123c' },
  orange: { 500: '#f97316', 700: '#c2410c' },
};

/** The accent hues on offer: the `[data-accent='…']` palettes in main.css, in file order. */
export async function accentMenu(): Promise<string[]> {
  const css = await Deno.readTextFile('./src/assets/main.css');
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
