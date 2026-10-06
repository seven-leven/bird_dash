// The Wildlife Illustrated logo: a bird perched on the open edge of an unfinished
// frame — a page corner with one side missing, and the bird looking out of it.
// It is drawn on a grid with the same round 2px stroke as the icons. The bird
// is drawn here first; the `bird` icon in icons.ts is this bird at the 24px grid.
// Rules for using it are in docs/DESIGN.md.
//
// Both versions are inner SVG markup for a 32 × 32 viewBox (see LogoMark.vue and
// script/docs/logo.ts) and take their colour from `currentColor`.

/** The frame: top-left stub, left side, and a bottom line that stops under the bird's feet. */
const FRAME = '<path d="M12 4.5H8.5A5.5 5.5 0 0 0 3 10v14a5.5 5.5 0 0 0 5.5 5.5h16"/>';

/**
 * The bird, standing on the frame's bottom line and facing out of its open side:
 * body outline (beak, crown, back, tail, belly, breast), wing, two legs, eye.
 */
const BIRD = '<g transform="translate(3.3 2.1)">' +
  '<path d="M28 9 23.8 7.6A3.9 3.9 0 0 0 16.6 10.4C13.3 13.3 8.4 18 3.2 23.3L9.7 22.9C14.8 24.3 21.8 22.6 24 16 24.7 13.9 24.7 12.3 24.3 10.7Z"/>' +
  '<path d="M20 14c-.8 3.8-4.2 6.4-10 7"/>' +
  '<path d="m15.6 23.5-.6 3.9"/><path d="m19 23 .4 4.4"/>' +
  '<path d="M21.4 9.5h.01" stroke-width="2.3"/></g>';

const drawing = (color: string) =>
  `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FRAME}${BIRD}</g>`;

/** The mark. Use this wherever there is room (20px and up). */
export const LOGO_MARK = drawing('currentColor');

/**
 * The tile: the same drawing, reversed out of a solid rounded square. For small
 * or busy places where a thin open shape would get lost — favicons, app icons,
 * avatars. `LOGO_TILE_INK` is the drawing's colour; the square is `currentColor`.
 */
export const LOGO_TILE_INK = '#ffffff';
export const LOGO_TILE = '<rect width="32" height="32" rx="8" fill="currentColor"/>' +
  `<g transform="translate(16 16) scale(0.82) translate(-16.6 -17)">${drawing(LOGO_TILE_INK)}</g>`;

/** The two words of the wordmark; the first is set heavier than the second. */
export const WORDMARK = ['Wildlife', 'Illustrated'] as const;
