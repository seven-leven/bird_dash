// The colour ramps the docs site draws in the design manifesto: stone and the accent
// hues, named from the CSS the site itself is built from, so the docs cannot show a
// palette the site does not have.

export const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

/** The accent hues on offer: every `[data-accent='…']` palette in src/styles/accents.css, in order. */
export function accentHues(accentsCss: string): string[] {
  return [...accentsCss.matchAll(/\[data-accent='([\w-]+)'\]/g)].map((m) => m[1]!);
}

/** The steps of a colour Tailwind's theme lacks (`--color-teal-500: …` in tailwindcss/theme.css). */
export function missingSteps(name: string, themeCss: string): string[] {
  return STEPS.filter((step) => !themeCss.includes(`--color-${name}-${step}:`));
}
