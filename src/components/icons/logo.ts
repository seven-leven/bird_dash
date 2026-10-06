// The Wildlife Illustrated logo. Like the icons, it is drawn on a grid with a
// round-ended stroke; the bird is the same glyph as the `bird` icon, so the logo
// and the interface share one hand. Rules for using it are in docs/DESIGN.md.
//
// Both versions are inner SVG markup for a 32 × 32 viewBox (see LogoMark.vue and
// script/docs/logo.ts) and take their colour from `currentColor`.

import { ICONS } from './icons.ts';

const STROKE = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

/**
 * The mark: a bird stepping out of an unfinished frame — wildlife leaving the
 * page it was drawn on. Use this wherever there is room (20px and up).
 */
export const LOGO_MARK =
  `<path d="M30 14v9a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7h9" ${STROKE} stroke-width="2"/>` +
  `<g transform="translate(7.5 4.5) scale(0.92)" ${STROKE} stroke-width="2.1">${ICONS.bird.body}</g>`;

/**
 * The tile: the bird reversed out of a solid rounded square. For small or busy
 * places where the open frame would break up — favicons, app icons, avatars.
 * `LOGO_TILE_INK` is the bird's colour; the square is `currentColor`.
 */
export const LOGO_TILE_INK = '#ffffff';
export const LOGO_TILE = `<rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor"/>` +
  `<g transform="translate(5.5 5) scale(0.9)" fill="none" stroke="${LOGO_TILE_INK}" ` +
  `stroke-linecap="round" stroke-linejoin="round" stroke-width="2.1">${ICONS.bird.body}</g>`;

/** The two words of the wordmark; the first is set heavier than the second. */
export const WORDMARK = ['Wildlife', 'Illustrated'] as const;
