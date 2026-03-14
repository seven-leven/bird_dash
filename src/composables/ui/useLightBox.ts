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
  // ── Navigation ──
  const currentItem = ref<CollectionItem | undefined>(props.item);

  const currentIndex = computed(() => {
    if (!currentItem.value) return -1;
    return props.drawnItems.findIndex((i) => i.itemId === currentItem.value?.itemId);
  });

  const hasPrevious = computed(() => currentIndex.value > 0);
  const hasNext = computed(() =>
    currentIndex.value < props.drawnItems.length - 1 && currentIndex.value !== -1
  );

  // ── Image State ──
  const imageUrl = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fullImageUrl = computed(() => {
    if (!currentItem.value?.itemId) return '';
    return `${props.fullImageBaseUrl}${currentItem.value.itemId}.webp`;
  });

  const loadImage = () => {
    if (!currentItem.value) return;
    loading.value = true;
    error.value = null;
    imageUrl.value = fullImageUrl.value;
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

  const zoomIn = () => {
    scale.value = Math.min(scale.value + 0.25, 5);
  };
  const zoomOut = () => {
    scale.value = Math.max(scale.value - 0.25, 0.5);
    if (scale.value <= 1) resetZoom();
  };

  const handleWheel = (e: WheelEvent) => {
    const newScale = Math.max(0.5, Math.min(5, scale.value + (e.deltaY > 0 ? -0.1 : 0.1)));
    scale.value = newScale;
    if (scale.value <= 1) resetZoom();
  };

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;
    translateX.value = dragStartTranslateX.value + (e.clientX - dragStartX.value) / scale.value;
    translateY.value = dragStartTranslateY.value + (e.clientY - dragStartY.value) / scale.value;
  };

  const handleMouseUp = () => {
    isDragging.value = false;
  };

  // ── Actions ──
  const navigateToItem = (index: number) => {
    const target = props.drawnItems[index];
    if (!target) return;
    resetZoom();
    currentItem.value = target;
    emit('update:item', target);
    loadImage();
  };

  const goToPrevious = () => hasPrevious.value && navigateToItem(currentIndex.value - 1);
  const goToNext = () => hasNext.value && navigateToItem(currentIndex.value + 1);

  const close = () => {
    emit('close');
    resetZoom();
  };

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
  watch(() => props.isOpen, (newVal) => {
    if (newVal) {
      currentItem.value = props.item;
      loadImage();
      document.body.style.overflow = 'hidden';
      globalThis.addEventListener('keydown', handleKeydown);
    } else {
      imageUrl.value = '';
      loading.value = false;
      error.value = null;
      resetZoom();
      document.body.style.overflow = '';
      globalThis.removeEventListener('keydown', handleKeydown);
    }
  });

  watch(() => props.item, (newItem) => {
    if (props.isOpen && newItem && newItem.itemId !== currentItem.value?.itemId) {
      currentItem.value = newItem;
      resetZoom();
      loadImage();
    }
  });

  onUnmounted(() => {
    globalThis.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });

  return {
    currentItem,
    currentIndex,
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
