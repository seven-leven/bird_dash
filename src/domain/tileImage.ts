import type { Item } from './toCollectionItems.ts';

/**
 * The image to show in a grid tile or a result row: the drawing, or — for an
 * item that is not drawn yet, or whose image failed — the placeholder that
 * matches the theme.
 */
export function tileImage(item: Item, dark: boolean, failed = false): string {
  if (item.isDrawn && !failed) return item.imageUrl;
  return dark ? item.placeholderDarkUrl : item.placeholderUrl;
}
