// useDialogKeys.ts — a modal dialog's keyboard: focus in, Tab kept inside, shortcut keys.
import { nextTick, onUnmounted, ref, watch } from 'vue';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While `isOpen()`: focus moves into the dialog (bind `dialogRef` to it), Tab and
 * Shift+Tab stay inside it, the page behind does not scroll, and each key in `keys`
 * runs its handler (by `KeyboardEvent.key`). On close, focus goes back where it was.
 * Keys typed into a text field are left alone.
 */
export function useDialogKeys(deps: {
  isOpen: () => boolean;
  keys: Record<string, (e: KeyboardEvent) => void>;
}) {
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

  const handleKeydown = (e: KeyboardEvent) => {
    // Cannot happen: the listener is attached only while open (see the watcher below).
    /* c8 ignore next */
    if (!deps.isOpen()) return;
    // Typing in a text field must not zoom or page the image.
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')) {
      return;
    }
    if (e.key === 'Tab') trapTab(e);
    else deps.keys[e.key]?.(e);
  };

  watch(deps.isOpen, (open) => {
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      nextTick(() => dialogRef.value?.focus({ preventScroll: true }));
      document.body.style.overflow = 'hidden';
      globalThis.addEventListener('keydown', handleKeydown);
    } else {
      previouslyFocused?.focus({ preventScroll: true });
      previouslyFocused = null;
      document.body.style.overflow = '';
      globalThis.removeEventListener('keydown', handleKeydown);
    }
  });

  onUnmounted(() => {
    globalThis.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });

  return { dialogRef };
}
