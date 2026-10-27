import { onMounted, onUnmounted } from 'vue';

/** Ctrl + `key` (⌘ + `key` on a Mac), pressed anywhere on the page, focuses `target()`. */
export function useFocusShortcut(key: string, target: () => HTMLElement | null): void {
  const onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
      e.preventDefault();
      target()?.focus();
    }
  };
  onMounted(() => globalThis.addEventListener('keydown', onKeydown));
  onUnmounted(() => globalThis.removeEventListener('keydown', onKeydown));
}
