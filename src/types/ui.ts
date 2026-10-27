import type { PageId } from '../pages.ts';

// =============================================================================
// Shared UI types — import from here instead of defining inline in props
// =============================================================================

export interface SectionEntry {
  id: string;
  label: string;
  count: number;
  total: number;
  disabled: boolean;
}

export type View = 'group' | 'month';

/** What the main area shows: a collection's drawings, or one of the pages in src/pages.ts. */
export type Page = 'gallery' | PageId;
