import { computed, readonly, type Ref, ref, shallowRef } from 'vue';
import { defineInjection } from '../browser/defineInjection.ts';
import type { Item } from '../types/index.ts';

/**
 * The viewer: whether it is open, and on which drawing. `drawnItems` (what it pages
 * through, in time order) is the view store's, passed in.
 */
export function createViewerStore(deps: { drawnItems: Ref<Item[]> }) {
  const isOpen = ref(false);
  const item = shallowRef<Item | undefined>(undefined);

  const open = (next: Item): void => {
    if (!next.isDrawn) return; // nothing to show for a placeholder
    item.value = next;
    isOpen.value = true;
  };
  // The item is kept on close so the image doesn't vanish during the fade-out.
  const close = (): void => {
    isOpen.value = false;
  };
  /** Page to another drawing, the viewer staying open. */
  const show = (next: Item): void => {
    item.value = next;
  };

  return {
    isOpen: readonly(isOpen),
    item: computed(() => item.value),
    drawnItems: deps.drawnItems,
    open,
    close,
    show,
  };
}

export type ViewerStore = ReturnType<typeof createViewerStore>;
export const [provideViewerStore, useViewerStore] = defineInjection<ViewerStore>('viewer');
