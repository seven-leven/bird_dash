import type { View } from '../types/index.ts';

/**
 * What a view is called, in the header tab and the sidebar alike: the
 * collection's groups in the plural ("Families", "Orders"), or "Months".
 */
export function viewName(mode: View, groupLabel: string): string {
  if (mode === 'month') return 'Months';
  return groupLabel.endsWith('y') ? `${groupLabel.slice(0, -1)}ies` : `${groupLabel}s`;
}
