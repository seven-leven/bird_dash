// ---------------------------------------------------------------------------
// Collection data types
// ---------------------------------------------------------------------------

export interface CollectionItem {
  id: string;
  name: string;
  sci: string;
  drawn?: string;
  [key: string]: unknown;
}

// Legacy alias
export type Bird = CollectionItem;

export type CollectionData = Record<string, CollectionItem[]>;
export type BirdsData = CollectionData;

// ---------------------------------------------------------------------------
// Versioning
// ---------------------------------------------------------------------------

export interface VersionData {
  major: number;
  minor: number;
  patch: number;
  count: number;
  updated: string;
}

// ---------------------------------------------------------------------------
// Image processing results
// ---------------------------------------------------------------------------

export interface ProcessResult {
  filename: string;
  baseName: string;
  isNew: boolean;
}

// ---------------------------------------------------------------------------
// Integrity checks
// ---------------------------------------------------------------------------

export interface IntegrityResult {
  missing: string[];
  orphaned: string[];
  passed: boolean;
}

export interface IntegrityIssues {
  missingInJson: string[]; // raw PNGs not in collection JSON
  missingInRaw: string[]; // items with drawn date but no PNG
  missingFull: string[]; // items missing full WebP
  missingThumb: string[]; // items missing thumbnail
  orphanedFull: string[]; // full WebPs without a JSON entry
  orphanedThumb: string[]; // thumb WebPs without a JSON entry
}
