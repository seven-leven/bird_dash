// A change the eye should follow (the gallery to a page and back) as a view transition: the
// browser crossfades from the old page to the new one. Where the browser has none, or the
// visitor asks for reduced motion (docs/DESIGN.md §06), the change simply happens.
import { nextTick } from 'vue';

/** Make `change`, and let the browser crossfade to what Vue draws for it. */
export function withViewTransition(change: () => void): void {
  const start = (document as Document & {
    startViewTransition?: (update: () => Promise<void>) => unknown;
  }).startViewTransition;
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!start || still) {
    change();
    return;
  }
  start.call(document, async () => {
    change();
    await nextTick(); // the new page drawn, for the browser to fade to
  });
}
