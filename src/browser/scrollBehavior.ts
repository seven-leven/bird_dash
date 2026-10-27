/**
 * How the site scrolls itself: smoothly, unless the visitor's system asks for
 * reduced motion (docs/DESIGN.md §06). The CSS rule for reduced motion cannot
 * reach a scroll that code asks for by name, so every such call uses this.
 */
export const scrollBehavior = (): ScrollBehavior =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
