// useLightbox.ts
import { computed, onUnmounted, ref, watch } from 'vue';
import type { CollectionConfig, CollectionItem } from '../../types/index.ts';

interface LightboxOptions {
  props: {
    isOpen: boolean;
    item?: CollectionItem;
    drawnItems: CollectionItem[];
    fullImageBaseUrl: string;
    collection: CollectionConfig;
  };
  emit: {
    (e: 'close'): void;
    (e: 'update:item', item: CollectionItem): void;
  };
}

export function useLightbox({ props, emit }: LightboxOptions) {
  // ── Navigation — props.item is the single source of truth: navigation emits
  // update:item and the parent feeds the new item back down. ──
  const currentItem = computed(() => props.item);

  const currentIndex = computed(() => {
    if (!currentItem.value) return -1;
    return props.drawnItems.findIndex((i) => i.itemId === currentItem.value?.itemId);
  });

  const hasPrevious = computed(() => currentIndex.value > 0);
  const hasNext = computed(() =>
    currentIndex.value < props.drawnItems.length - 1 && currentIndex.value !== -1
  );

  // ── Image State ──
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Empty while closed so the image drops out immediately during the fade-out.
  const imageUrl = computed(() =>
    props.isOpen && currentItem.value
      ? `${props.fullImageBaseUrl}${currentItem.value.itemId}.webp`
      : ''
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

  // ── Zoom & Pan ──
  const scale = ref(1);
  const translateX = ref(0);
  const translateY = ref(0);

  const resetZoom = () => {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
  };

  // Single clamp: 0.5–5×, snapping back to a centered 1× at or below 1.
  const setScale = (next: number) => {
    const clamped = Math.min(5, Math.max(0.5, next));
    if (clamped <= 1) resetZoom();
    else scale.value = clamped;
  };

  const zoomIn = () => setScale(scale.value + 0.25);
  const zoomOut = () => setScale(scale.value - 0.25);
  const handleWheel = (e: WheelEvent) => setScale(scale.value + (e.deltaY > 0 ? -0.1 : 0.1));

  // ── Dragging ──
  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const dragStartTranslateX = ref(0);
  const dragStartTranslateY = ref(0);

  const handleMouseDown = (e: MouseEvent) => {
    if (scale.value <= 1) return;
    isDragging.value = true;
    dragStartX.value = e.clientX;
    dragStartY.value = e.clientY;
    dragStartTranslateX.value = translateX.value;
    dragStartTranslateY.value = translateY.value;
  };

  // Coalesce pointer moves to one reactive write (and thus one re-render) per
  // frame instead of one per mousemove event.
  let moveRaf = 0;
  let pendingX = 0;
  let pendingY = 0;
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    pendingX = dragStartTranslateX.value + (e.clientX - dragStartX.value) / scale.value;
    pendingY = dragStartTranslateY.value + (e.clientY - dragStartY.value) / scale.value;
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      translateX.value = pendingX;
      translateY.value = pendingY;
    });
  };

  const handleMouseUp = () => {
    isDragging.value = false;
    if (moveRaf) {
      cancelAnimationFrame(moveRaf);
      moveRaf = 0;
    }
  };

  // ── Actions ──
  const navigateToItem = (index: number) => {
    const target = props.drawnItems[index];
    if (target) emit('update:item', target); // the item watcher resets zoom + load state
  };

  const goToPrevious = () => hasPrevious.value && navigateToItem(currentIndex.value - 1);
  const goToNext = () => hasNext.value && navigateToItem(currentIndex.value + 1);

  const close = () => emit('close'); // the isOpen watcher handles cleanup

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  // ── Keyboard Support ──
  const handleKeydown = (e: KeyboardEvent) => {
    if (!props.isOpen) return;
    switch (e.key) {
      case 'Escape':
        close();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case '0':
        resetZoom();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        goToNext();
        break;
    }
  };

  // ── Lifecycle & Watchers ──
  watch(() => props.isOpen, (open) => {
    if (open) {
      startLoad();
      document.body.style.overflow = 'hidden';
      globalThis.addEventListener('keydown', handleKeydown);
    } else {
      resetZoom();
      loading.value = false;
      error.value = null;
      document.body.style.overflow = '';
      globalThis.removeEventListener('keydown', handleKeydown);
    }
  });

  watch(() => props.item, () => {
    if (props.isOpen) {
      resetZoom();
      startLoad();
    }
  });

  onUnmounted(() => {
    globalThis.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });

  return {
    currentItem,
    hasPrevious,
    hasNext,
    imageUrl,
    loading,
    error,
    scale,
    translateX,
    translateY,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    goToPrevious,
    goToNext,
    close,
    handleBackdropClick,
    handleImageLoad,
    handleImageError,
  };
}
