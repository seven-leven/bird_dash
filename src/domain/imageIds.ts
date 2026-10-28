/**
 * An item's images, by file name without the extension: the drawing (`001`), then the
 * others the list counts in `images` (`001-2`, `001-3`…), its sketches or a series piece's
 * other parts. The site pages through them in the viewer; the asset build makes them.
 */
export const imageIds = (itemId: string, images = 1): string[] => [
  itemId,
  ...Array.from({ length: Math.max(0, images - 1) }, (_, i) => `${itemId}-${i + 2}`),
];
