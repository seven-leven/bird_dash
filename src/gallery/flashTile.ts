import { scrollBehavior } from '../browser/scrollBehavior.ts';

/** Scroll a tile into view and flash a highlight ring around it. */
export function flashTile(itemId: string): void {
  const el = document.getElementById(`item-${itemId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
  const ring = ['ring-2', 'ring-accent-700', 'dark:ring-accent-500', 'ring-offset-2'];
  el.classList.add(...ring);
  setTimeout(() => el.classList.remove(...ring), 1800);
}
