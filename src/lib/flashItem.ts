/** Scroll a tile into view and flash a highlight ring around it. */
export function flashItem(itemId: string): void {
  const el = document.getElementById(`item-${itemId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ring-2', 'ring-accent-500', 'ring-offset-2');
  setTimeout(() => el.classList.remove('ring-2', 'ring-accent-500', 'ring-offset-2'), 1800);
}
