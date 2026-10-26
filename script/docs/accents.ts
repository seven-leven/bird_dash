// The colour ramps the docs site draws in the design manifesto, read from the CSS the
// site itself is built from, so the docs cannot show a palette the site does not have.

export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export interface Ramp {
  /** A Tailwind colour name: `slate`, or an accent hue such as `teal`. */
  name: string;
  /** One CSS colour per step in STEPS, as Tailwind defines it. */
  colors: string[];
}

/** The accent hues on offer: every `[data-accent='…']` palette in src/styles/main.css, in order. */
export function accentHues(mainCss: string): string[] {
  return [...mainCss.matchAll(/\[data-accent='([\w-]+)'\]/g)].map((m) => m[1]);
}

/**
 * A colour's ramp, from Tailwind's theme (`--color-teal-500: oklch(…)` in
 * tailwindcss/theme.css). Throws if a step is missing, so a hue the CSS names but
 * Tailwind does not have fails the docs build instead of drawing an empty swatch.
 */
export function rampOf(name: string, themeCss: string): Ramp {
  const colors = STEPS.map((step) => {
    const m = themeCss.match(new RegExp(`--color-${name}-${step}:\\s*([^;]+);`));
    if (!m) throw new Error(`tailwindcss/theme.css has no --color-${name}-${step}`);
    return m[1].trim();
  });
  return { name, colors };
}
