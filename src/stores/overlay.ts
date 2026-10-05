import { reactive, readonly, type Ref } from 'vue';
import { defineInjection } from '../composables/core/injection.ts';
import type { CollectionItem } from '../types/index.ts';

/**
 * Lightbox overlay state. `drawnItems` (the chronological list the lightbox
 * pages through) is derived in the collections store and passed in.
 */
export function createOverlayStore(deps: { drawnItems: Ref<CollectionItem[]> }) {
  const expandedImage = reactive({
    isOpen: false,
    item: undefined as CollectionItem | undefined,
  });

  const open = (item: CollectionItem): void => {
    if (!item.isDrawn) return; // nothing to show for a placeholder
    expandedImage.item = item;
    expandedImage.isOpen = true;
  };
  // The item is kept on close so the image doesn't vanish during the fade-out.
  const close = (): void => {
    expandedImage.isOpen = false;
  };
  const update = (item: CollectionItem): void => {
    expandedImage.item = item;
  };

  return {
    expandedImage: readonly(expandedImage),
    drawnItems: deps.drawnItems,
    open,
    close,
    update,
  };
}

export type OverlayStore = ReturnType<typeof createOverlayStore>;
export const [provideOverlay, useOverlayStore] = defineInjection<OverlayStore>('overlay');
