// useViewer.ts — the image viewer: the three parts below, the full image's load state,
// and closing.
import { computed, ref, watch } from 'vue';
import { useDialogKeys } from './useDialogKeys.ts';
import { useDrawingNav } from './useDrawingNav.ts';
import { useZoomPan } from './useZoomPan.ts';
import type { Collection, Item } from '../domain/toCollectionItems.ts';

/** The viewer component's props, typed once: Viewer.vue declares them with this. */
export interface ViewerProps {
  isOpen: boolean;
  item?: Item;
  /** What it pages through, in time order. */
  drawnItems: Item[];
  fullImageBaseUrl: string;
  collection: Collection;
}

interface ViewerOptions {
  props: ViewerProps;
  emit: {
    (e: 'close'): void;
    (e: 'update:item', item: Item): void;
  };
}

/**
 * The viewer, made of three parts, each its own composable: moving between drawings
 * (useDrawingNav), zoom and pan (useZoomPan), and the dialog's keyboard
 * (useDialogKeys). This file wires them together and owns what is left: loading the
 * full image, and closing.
 */
export function useViewer({ props, emit }: ViewerOptions) {
  // props.item is the single source of truth: navigation emits update:item and the
  // parent feeds the new item back down (the item watcher resets zoom and load state).
  const nav = useDrawingNav({
    item: () => props.item,
    items: () => props.drawnItems,
    onNavigate: (item) => emit('update:item', item),
  });
  const { currentItem, imageId, goToPrevious, goToNext } = nav;

  const zoom = useZoomPan({
    onSwipe: (dir) => (dir === 'next' ? goToNext() : goToPrevious()),
  });

  const close = () => emit('close'); // the isOpen watcher handles cleanup

  const { dialogRef } = useDialogKeys({
    isOpen: () => props.isOpen,
    keys: {
      Escape: close,
      '+': zoom.zoomIn,
      '=': zoom.zoomIn,
      '-': zoom.zoomOut,
      '0': zoom.resetZoom,
      ArrowLeft: (e) => (e.preventDefault(), goToPrevious()),
      ArrowUp: (e) => (e.preventDefault(), goToPrevious()),
      ArrowRight: (e) => (e.preventDefault(), goToNext()),
      ArrowDown: (e) => (e.preventDefault(), goToNext()),
    },
  });

  // ── The full image ──
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Empty while closed so the image drops out immediately during the fade-out.
  const imageUrl = computed(() =>
    props.isOpen && currentItem.value ? `${props.fullImageBaseUrl}${imageId.value}.webp` : ''
  );

  const startLoad = () => {
    loading.value = !!currentItem.value;
    error.value = null;
  };
  const handleImageLoad = () => {
    loading.value = false;
    error.value = null;
  };
  const handleImageError = () => {
    loading.value = false;
    error.value = 'Image not found';
  };

  // A click on empty space closes the viewer, unless it is the tail end of a drag,
  // pinch or swipe (the browser still fires `click` after those).
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (zoom.consumeGestureMoved()) return;
    close();
  };

  watch(() => props.isOpen, (open) => {
    if (open) {
      startLoad();
    } else {
      zoom.reset();
      loading.value = false;
      error.value = null;
    }
  });

  // Another drawing, or another of its images: back to fit, and load it.
  watch(imageUrl, (now, before) => {
    if (props.isOpen && now && before) {
      zoom.resetZoom();
      startLoad();
    }
  });

  return {
    dialogRef,
    currentItem,
    hasPrevious: nav.hasPrevious,
    hasNext: nav.hasNext,
    position: nav.position,
    imagePosition: nav.imagePosition,
    imageUrl,
    loading,
    error,
    scale: zoom.scale,
    translateX: zoom.translateX,
    translateY: zoom.translateY,
    isDragging: zoom.isDragging,
    zoomIn: zoom.zoomIn,
    zoomOut: zoom.zoomOut,
    resetZoom: zoom.resetZoom,
    handleWheel: zoom.handleWheel,
    handlePointerDown: zoom.handlePointerDown,
    handlePointerMove: zoom.handlePointerMove,
    handlePointerUp: zoom.handlePointerUp,
    goToPrevious,
    goToNext,
    close,
    handleBackdropClick,
    handleImageLoad,
    handleImageError,
  };
}
