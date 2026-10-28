// useZoomPan.ts — zoom and pan for one image, by buttons, wheel and pointer gestures.
import { onScopeDispose, ref } from 'vue';

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

/**
 * The zoom state (scale and offset) and the pointer gestures that change it (mouse,
 * touch, pen): drag to pan when zoomed, pinch to zoom, swipe to page when fitted
 * (`onSwipe` says which way; paging is the caller's). Pointer capture keeps a drag
 * alive when the pointer leaves the area.
 */
export function useZoomPan({ onSwipe }: { onSwipe: (dir: 'next' | 'prev') => void }) {
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

  // Whether the pointer moved since it went down: the browser still fires `click`
  // after a drag, pinch or swipe, and that click must not count as one.
  let gestureMoved = false;
  /** True once after a gesture that moved; a click that ends one is then ignored. */
  const consumeGestureMoved = (): boolean => {
    const moved = gestureMoved;
    gestureMoved = false;
    return moved;
  };

  const isDragging = ref(false);
  const pointers = new Map<number, { x: number; y: number }>();
  let drag = { x: 0, y: 0, tx: 0, ty: 0 };
  let pinch: { distance: number; scale: number } | null = null;
  let swipeStart: { x: number; y: number } | null = null;
  let downAt = { x: 0, y: 0 };
  const MOVE_SLOP = 8; // px a pointer may wander and still count as a click

  // Measured only with two pointers down (a pinch).
  const pointerDistance = () => {
    const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
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
      if (dir) onSwipe(dir);
    }
    swipeStart = null;

    if (pointers.size === 0) {
      isDragging.value = false;
      cancelPendingMove();
    }
  };

  /** Back to a fitted image with no gesture under way (the viewer closed). */
  const reset = () => {
    resetZoom();
    pointers.clear();
    pinch = null;
    swipeStart = null;
    isDragging.value = false;
    cancelPendingMove();
  };

  onScopeDispose(cancelPendingMove);

  return {
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
    consumeGestureMoved,
    reset,
  };
}
