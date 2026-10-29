/** How the gallery lays out a collection: by its groups (families, orders), or by month drawn. */
export type View = 'group' | 'month';

/**
 * What a view is called, in the header tab and the sidebar alike: the
 * collection's groups in the plural ("Families", "Orders"), or "Months".
 */
export function viewName(mode: View, groupLabel: string): string {
  if (mode === 'month') return 'Months';
  if (groupLabel.endsWith('y')) return `${groupLabel.slice(0, -1)}ies`;
  return groupLabel.endsWith('s') ? `${groupLabel}es` : `${groupLabel}s`;
}
