// A drawing on the About page (the first one, the newest ones): where it links, the image it
// shows, and the paper it sits on.
import type { Collection } from '../domain/toCollectionItems.ts';
import type { NewestDrawing } from '../data/files.ts';

/** A drawing sits on white paper in both themes (docs/DESIGN.md §01). */
export const PAPER =
  'overflow-hidden rounded-card bg-white ring-1 ring-stone-200 dark:ring-stone-800';

/** The drawing in the viewer: `#birds/029`. */
export const drawingHref = (d: NewestDrawing): string => `#${d.collection}/${d.id}`;

/** Its thumbnail, under its collection's image folder. */
export const drawingImage = (d: NewestDrawing, collections: Collection[]): string =>
  `${collections.find((c) => c.id === d.collection)?.imageBase ?? ''}${d.id}.webp`;
