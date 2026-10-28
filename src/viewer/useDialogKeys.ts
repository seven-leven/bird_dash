// useDialogKeys.ts — a modal dialog: opened as one, focus in and back, shortcut keys.
import { nextTick, onScopeDispose, ref, watch } from 'vue';

/**
 * While `isOpen()`: the dialog (bind `dialogRef` to it) opens as a modal, `showModal()`, so
 * the page behind is inert and Tab cannot leave it; focus moves into it; the page behind does
 * not scroll; and each key in `keys` runs its handler (by `KeyboardEvent.key`). On close,
 * focus goes back where it was. Keys typed into a text field are left alone.
 */
export function useDialogKeys(deps: {
  isOpen: () => boolean;
  keys: Record<string, (e: KeyboardEvent) => void>;
}) {
  const dialogRef = ref<HTMLElement | null>(null);
  let previouslyFocused: HTMLElement | null = null;

  const handleKeydown = (e: KeyboardEvent) => {
    // Cannot happen: the listener is attached only while open (see the watcher below).
    /* c8 ignore next */
    if (!deps.isOpen()) return;
    // Typing in a text field must not zoom or page the image.
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]')) {
      return;
    }
    deps.keys[e.key]?.(e);
  };

  /** Open the dialog as a modal (once it is in the page), and put focus in it. */
  const showDialog = () => {
    const dialog = dialogRef.value;
    if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
    dialog?.focus({ preventScroll: true });
  };

  // `immediate`: a dialog may mount already open (the viewer is loaded on demand, so a deep
  // link opens it before its code arrives), and must still take focus and the keys.
  watch(deps.isOpen, (open) => {
    if (open) {
      previouslyFocused = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      nextTick(showDialog);
      document.body.style.overflow = 'hidden';
      globalThis.addEventListener('keydown', handleKeydown);
    } else {
      // Closed first, so the page is no longer inert and can take focus back; the dialog
      // still shows as it fades out (its own display wins over a closed dialog's none).
      const dialog = dialogRef.value;
      if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
      previouslyFocused?.focus({ preventScroll: true });
      previouslyFocused = null;
      document.body.style.overflow = '';
      globalThis.removeEventListener('keydown', handleKeydown);
    }
  }, { immediate: true });

  // On a component's unmount, and on a scope stopped without one.
  onScopeDispose(() => {
    globalThis.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });

  return { dialogRef };
}
