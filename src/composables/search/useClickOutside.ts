import { onMounted, onUnmounted } from 'vue';

export function useClickOutside(
  target: () => HTMLElement | null,
  handler: () => void,
) {
  function onMouseDown(e: MouseEvent) {
    if (target() && !target()!.contains(e.target as Node)) {
      handler();
    }
  }

  onMounted(() => document.addEventListener('mousedown', onMouseDown));
  onUnmounted(() => document.removeEventListener('mousedown', onMouseDown));
}
