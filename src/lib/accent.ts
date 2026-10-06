/** Used until a collection is known, and for a collection that names no accent. */
export const DEFAULT_ACCENT = 'teal';

/**
 * Switch the site's accent colour by setting `data-accent` on <html>; the
 * palettes it selects are in src/assets/main.css. A name with no palette there
 * simply leaves the default in place.
 */
export function applyAccent(name: string | undefined): void {
  document.documentElement.dataset.accent = name?.trim() || DEFAULT_ACCENT;
}
