import type { PageId } from '../pages.ts';

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

/** What the main area shows: a collection's drawings, or one of the pages in src/pages.ts. */
export type Page = 'gallery' | PageId;
