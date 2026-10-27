import { onMounted, onUnmounted, ref } from 'vue';

/** Narrower than this, the sidebar is a drawer: Tailwind's `lg` (docs/DESIGN.md §10). */
export const NARROW_BELOW = 1024;

/** Whether the window is narrower than `NARROW_BELOW`, measured on mount and on every resize. */
export function useBreakpoint() {
  const isNarrow = ref(false);

  const checkSize = () => {
    isNarrow.value = globalThis.innerWidth < NARROW_BELOW;
  };

  onMounted(() => {
    checkSize();
    globalThis.addEventListener('resize', checkSize);
  });

  onUnmounted(() => {
    globalThis.removeEventListener('resize', checkSize);
  });

  return { isNarrow };
}
