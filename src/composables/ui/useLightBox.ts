// useLightbox.ts
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { ratio } from '../../lib/formatCount.ts';
import type { CollectionConfig, CollectionItem } from '../../types/index.ts';

/** Clamp a zoom scale to [0.5, 5]; anything ≤1 snaps back to a neutral 1×. */
export function clampScale(value: number): number {
  if (Number.isNaN(value)) return 1; // Math.min/max would pass NaN straight through
  const clamped = Math.min(5, Math.max(0.5, value));
  return clamped <= 1 ? 1 : clamped;
}

/** Scale during a pinch: the starting scale times how far the fingers have spread. */
export function pinchScale(startScale: number, startDistance: number, distance: number): number {
  if (startDistance <= 0) return startScale;
  return startScale * (distance / startDistance);
}

/**
 * A mostly-horizontal drag past `threshold` px is a swipe. Returns which way to
 * page (dragging left reveals the next item), or null if it wasn't a swipe.
 */
export function swipeDirection(dx: number, dy: number, threshold = 60): 'next' | 'prev' | null {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 2) return null;
  return dx < 0 ? 'next' : 'prev';
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

  // Snap back to a centered 1× at or below 1, else apply the clamped scale.
  const setScale = (next: number) => {
    const clamped = clampScale(next);
    if (clamped <= 1) resetZoom();
    else scale.value = clamped;
  };

  const zoomIn = () => setScale(scale.value + 0.25);
  const zoomOut = () => setScale(scale.value - 0.25);
  const handleWheel = (e: WheelEvent) => setScale(scale.value + (e.deltaY > 0 ? -0.1 : 0.1));

  // ── Actions ──
  const navigateToItem = (index: number) => {
    const target = props.drawnItems[index];
    if (target) emit('update:item', target); // the item watcher resets zoom + load state
  };

  const goToPrevious = () => hasPrevious.value && navigateToItem(currentIndex.value - 1);
  const goToNext = () => hasNext.value && navigateToItem(currentIndex.value + 1);

  const close = () => emit('close'); // the isOpen watcher handles cleanup

  // A click on empty space closes the viewer — unless it is the tail end of a
  // drag, pinch or swipe (the browser still fires `click` after those).
  let gestureMoved = false;
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (gestureMoved) {
      gestureMoved = false;
      return;
    }
    close();
  };

  /** "3 of 18" — where the open item sits in the order the viewer pages through. */
  const position = computed(() =>
    currentIndex.value === -1 ? '' : ratio(currentIndex.value + 1, props.drawnItems.length)
  );

  // ── Pointer gestures (mouse, touch, pen): drag to pan when zoomed, pinch to
  // zoom, swipe to page when fitted. Pointer capture keeps a drag alive when the
  // pointer leaves the area. ──
  const isDragging = ref(false);
  const pointers = new Map<number, { x: number; y: number }>();
  let drag = { x: 0, y: 0, tx: 0, ty: 0 };
  let pinch: { distance: number; scale: number } | null = null;
  let swipeStart: { x: number; y: number } | null = null;
  let downAt = { x: 0, y: 0 };
  const MOVE_SLOP = 8; // px a pointer may wander and still count as a click

  const pointerDistance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  // Coalesce pan updates to one reactive write (and thus one re-render) per frame.
  let moveRaf = 0;
  let pendingX = 0;
  let pendingY = 0;
  const cancelPendingMove = () => {
    if (moveRaf) {
      cancelAnimationFrame(moveRaf);
      moveRaf = 0;
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* the pointer is no longer active; the gesture still works without capture */
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      gestureMoved = false;
      downAt = { x: e.clientX, y: e.clientY };
    } else {
      gestureMoved = true;
    }

    if (pointers.size === 2) { // a second finger turns the gesture into a pinch
      pinch = { distance: pointerDistance(), scale: scale.value };
      isDragging.value = false;
      swipeStart = null;
      return;
    }
    if (scale.value > 1) {
      isDragging.value = true;
      drag = { x: e.clientX, y: e.clientY, tx: translateX.value, ty: translateY.value };
    } else if (e.pointerType !== 'mouse') {
      swipeStart = { x: e.clientX, y: e.clientY }; // a mouse drag at 1× shouldn't page
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > MOVE_SLOP) gestureMoved = true;

    if (pointers.size === 2 && pinch) {
      setScale(pinchScale(pinch.scale, pinch.distance, pointerDistance()));
      return;
    }
    if (!isDragging.value) return;
    pendingX = drag.tx + (e.clientX - drag.x) / scale.value;
    pendingY = drag.ty + (e.clientY - drag.y) / scale.value;
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      translateX.value = pendingX;
      translateY.value = pendingY;
    });
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!pointers.delete(e.pointerId)) return;
    if (pointers.size < 2) pinch = null;
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > MOVE_SLOP) gestureMoved = true;

    if (swipeStart && pointers.size === 0 && e.type === 'pointerup') {
      const dir = swipeDirection(e.clientX - swipeStart.x, e.clientY - swipeStart.y);
      if (dir === 'next') goToNext();
      else if (dir === 'prev') goToPrevious();
    }
    swipeStart = null;

    if (pointers.size === 0) {
      isDragging.value = false;
      cancelPendingMove();
    }
  };

  // ── Dialog focus: move focus in on open, keep Tab inside, restore on close ──
  const dialogRef = ref<HTMLElement | null>(null);
  let previouslyFocused: HTMLElement | null = null;

  const focusableInDialog = () =>
    dialogRef.value ? [...dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];

  const trapTab = (e: KeyboardEvent) => {
    const els = focusableInDialog();
    if (els.length === 0) {
      e.preventDefault();
      dialogRef.value?.focus();
      return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement;

    if (!dialogRef.value?.contains(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && (active === first || active === dialogRef.value)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // ── Keyboard Support ──
  const handleKeydown = (e: KeyboardEvent) => {
    if (!props.isOpen) return;
    // Typing in a text field must not zoom or page the image.
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')) {
      return;
    }
    switch (e.key) {
      case 'Tab':
        trapTab(e);
        break;
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
      previouslyFocused = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      nextTick(() => dialogRef.value?.focus({ preventScroll: true }));
      document.body.style.overflow = 'hidden';
      globalThis.addEventListener('keydown', handleKeydown);
    } else {
      resetZoom();
      loading.value = false;
      error.value = null;
      pointers.clear();
      pinch = null;
      swipeStart = null;
      isDragging.value = false;
      cancelPendingMove();
      previouslyFocused?.focus({ preventScroll: true });
      previouslyFocused = null;
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
    cancelPendingMove();
    globalThis.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });

  return {
    dialogRef,
    currentItem,
    hasPrevious,
    hasNext,
    position,
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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    goToPrevious,
    goToNext,
    close,
    handleBackdropClick,
    handleImageLoad,
    handleImageError,
  };
}
