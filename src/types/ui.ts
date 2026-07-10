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

export interface ExpandedImageState<T = unknown> {
  isOpen: boolean;
  item: T | undefined;
}

export type ViewMode = 'group' | 'date';

export interface UIState {
  sidebarOpen: boolean;
  mobile: boolean;
  viewMode: ViewMode;
}

export interface ThemeState {
  isDark: boolean;
}

/** One search state — drives the grid filter and the global search dropdown. */
export interface SearchState {
  query: string;
  dropdownOpen: boolean;
}
