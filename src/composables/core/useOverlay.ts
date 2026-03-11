import { reactive } from 'vue';
import { type CollectionItem } from '../../types/collections.ts';

export function useOverlay() {
  const expandedImage = reactive({
    isOpen: false,
    item: undefined as CollectionItem | undefined,
  });

  const openOverlay = (item: CollectionItem) => {
    if (item.imageUrl === item.placeholderUrl) return;
    expandedImage.item = item;
    expandedImage.isOpen = true;
  };

  const closeOverlay = () => {
    expandedImage.isOpen = false;
  };

  // Add this function here
  const updateOverlayItem = (item: CollectionItem) => {
    expandedImage.item = item;
  };

  return {
    expandedImage,
    openOverlay,
    closeOverlay,
    updateOverlayItem, // Make sure to return it
  };
}
