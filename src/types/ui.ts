// =============================================================================
// Shared UI types — import from here instead of defining inline in props
// =============================================================================

export interface SidebarItem {
  id: string;
  label: string;
  count: number;
  total: number;
  disabled: boolean;
}

export type ViewMode = 'group' | 'date';
