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

export interface Stats {
  total: number;
  filtered: number;
  drawn: number;
  mode: string;
}

export interface Stats {
  drawn: number;
  total: number;
}

export interface ExpandedImageState<T = unknown> {
  isOpen: boolean;
  item: T | undefined;
}

export interface UIState {
  sidebarOpen: boolean;
  mobile: boolean;
  client: boolean;
  viewMode: 'group' | 'date';
}

export interface ThemeState {
  isDark: boolean;
}

export interface loadingState {
  loading: boolean;
  error: string | undefined;
}

export interface SearchState {
  query: string;
}

export interface ActiveData<T = unknown> {
  grouped: Record<string, T[]>;
  sidebarItems: SidebarItem[];
  stats: Stats;
}
