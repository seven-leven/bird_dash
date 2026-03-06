/// <reference lib="deno.ns" />

// === utils.ts - Consolidated file operations ===

// ---------------------------------------------------------------------------
// Collection registry — THE only place to register a new collection.
// Every other file derives paths and labels from this array.
// ---------------------------------------------------------------------------

export interface CollectionEntry {
  id: string;       // e.g. 'birds', 'sharks'
  json: string;     // path to data file, e.g. './public/birds.json'
  emoji: string;    // used in changelog + console output
  label: string;    // singular label, e.g. 'Bird', 'Shark'
  raw: string;      // folder containing raw PNGs, e.g. './raw_png/birds/'
}

export const COLLECTIONS: CollectionEntry[] = [
  {
    id:    'birds',
    json:  './public/birds.json',
    emoji: '🐦',
    label: 'Bird',
    raw:   './raw_png/birds/',
  },
  {
    id:    'sharks',
    json:  './public/sharks.json',
    emoji: '🦈',
    label: 'Shark',
    raw:   './raw_png/sharks/',
  },
];

// ---------------------------------------------------------------------------
// Directories & files
// ---------------------------------------------------------------------------

export const DIRS = {
  // Base output dirs — actual paths are <base>/<collectionId>/
  full:  './public/full/',
  thumb: './public/thumb/',
} as const;

/** Resolve the full-size output dir for a collection. */
export function fullDir(collectionId: string): string {
  return `${DIRS.full}${collectionId}/`;
}

/** Resolve the thumbnail output dir for a collection. */
export function thumbDir(collectionId: string): string {
  return `${DIRS.thumb}${collectionId}/`;
}

export const FILES = {
  version:   './src/version.json',
  changelog: './CHANGELOG.md',
  collections: COLLECTIONS,

  // Legacy direct reference — derived from COLLECTIONS, always in sync
  get birds() { return COLLECTIONS.find(c => c.id === 'birds')!.json; },
} as const;

export const THUMB_SIZE = 400;

// ---------------------------------------------------------------------------
// Types
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

export interface VersionData {
  major: number;
  minor: number;
  patch: number;
  count: number;
  updated: string;
}

export interface ProcessResult {
  filename: string;
  baseName: string;
  isNew: boolean;
}

export interface IntegrityResult {
  missing: string[];
  orphaned: string[];
  passed: boolean;
}

export interface IntegrityIssues {
  missingInJson: string[];   // raw PNGs not in collection JSON
  missingInRaw: string[];    // items with drawn date but no PNG
  missingFull: string[];     // items missing full WebP
  missingThumb: string[];    // items missing thumbnail
  orphanedFull: string[];    // full WebPs without a JSON entry
  orphanedThumb: string[];   // thumb WebPs without a JSON entry
}

// ---------------------------------------------------------------------------
// File operations
// ---------------------------------------------------------------------------

export async function listFiles(dir: string, filter: (name: string) => boolean): Promise<string[]> {
  try {
    const files: string[] = [];
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && filter(entry.name)) files.push(entry.name);
    }
    return files.sort();
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    throw err;
  }
}

export async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
  }
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await Deno.readTextFile(path));
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + '\n');
}

export async function appendText(path: string, text: string): Promise<void> {
  await Deno.writeTextFile(path, text, { append: true });
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

export function getBaseName(filename: string): string {
  return filename.replace(/\.(png|webp)$/i, '');
}

export function formatVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}+${v.count}`;
}

// ---------------------------------------------------------------------------
// Integrity check — collection-aware
// ---------------------------------------------------------------------------

export async function checkIntegrity(
  drawnIds: Set<string>,
  collection: CollectionEntry,
): Promise<IntegrityIssues> {
  const rawFiles   = await listFiles(collection.raw,         n => n.endsWith('.png'));
  const fullFiles  = await listFiles(fullDir(collection.id), n => n.endsWith('.webp'));
  const thumbFiles = await listFiles(thumbDir(collection.id),n => n.endsWith('.webp'));

  const rawIds   = new Set(rawFiles.map(getBaseName));
  const fullIds  = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  return {
    missingInJson: Array.from(rawIds).filter(id => !drawnIds.has(id)),
    missingInRaw:  Array.from(drawnIds).filter(id => !rawIds.has(id)),
    missingFull:   Array.from(drawnIds).filter(id => !fullIds.has(id)),
    missingThumb:  Array.from(drawnIds).filter(id => !thumbIds.has(id)),
    orphanedFull:  Array.from(fullIds).filter(id => !drawnIds.has(id)),
    orphanedThumb: Array.from(thumbIds).filter(id => !drawnIds.has(id)),
  };
}
