import { readonly, type Ref } from 'vue';
import { useOverlay } from '../composables/index.ts';
import { defineInjection } from '../composables/core/injection.ts';
import type { CollectionItem } from '../types/index.ts';

/**
 * Lightbox overlay state. `drawnItems` (the chronological list the lightbox
 * pages through) is derived in the collections store and passed in.
 */
export function createOverlayStore(deps: { drawnItems: Ref<CollectionItem[]> }) {
  const { expandedImage, openOverlay, closeOverlay, updateOverlayItem } = useOverlay();

  return {
    expandedImage: readonly(expandedImage),
    drawnItems: deps.drawnItems,
    open: openOverlay,
    close: closeOverlay,
    update: updateOverlayItem,
  };
}

export type OverlayStore = ReturnType<typeof createOverlayStore>;
export const [provideOverlay, useOverlayStore] = defineInjection<OverlayStore>('overlay');
