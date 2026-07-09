import { reactive } from 'vue';
import { type CollectionItem } from '../../types/index.ts';

export function useOverlay() {
  const expandedImage = reactive({
    isOpen: false,
    item: undefined as CollectionItem | undefined,
  });

  const openOverlay = (item: CollectionItem) => {
    if (!item.isDrawn) return;
    expandedImage.item = item;
    expandedImage.isOpen = true;
  };

  const closeOverlay = () => {
    expandedImage.isOpen = false;
  };

  const updateOverlayItem = (item: CollectionItem) => {
    expandedImage.item = item;
  };

  return { expandedImage, openOverlay, closeOverlay, updateOverlayItem };
}
