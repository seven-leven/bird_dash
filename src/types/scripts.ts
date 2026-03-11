import type { CollectionConfig } from './collections.ts';

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

export interface NewDrawing {
  id: string;
  name: string;
  sci: string;
  emoji: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Script/Build Types
// ---------------------------------------------------------------------------

// Minimal version for basic scripts (no frontend config dependency)
export interface ScriptCollectionEntry {
  id: string;
  json: string;
  placeholder: string;
  raw: string;
  emoji: string;
  label: string;
}

// Extended version that includes all CollectionConfig fields
export interface ScriptCollectionEntryExtended extends CollectionConfig {
  json: string;
  placeholder: string;
  raw: string;
}

// ---------------------------------------------------------------------------
// Build Results
// ---------------------------------------------------------------------------

export interface CollectionBuildResult {
  collection: ScriptCollectionEntry;
  processed: ProcessResult[];
  integrity: IntegrityIssues;
  drawnCount: number;
}

export interface BuildResult {
  version: VersionData;
  collections: CollectionBuildResult[];
}
