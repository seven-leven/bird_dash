/// <reference lib="deno.ns" />

// === utils.ts - Consolidated file operations ===

// ---------------------------------------------------------------------------
// Collection registry — THE only place to register a new collection
// ---------------------------------------------------------------------------

export interface CollectionEntry {
  id: string;
  json: string; // path to data file
  emoji: string; // used in changelog entries
  label: string; // singular label e.g. "Bird", "Shark"
}

export const COLLECTIONS: CollectionEntry[] = [
  { id: 'birds', json: './public/birds.json', emoji: '🐦', label: 'Bird' },
  { id: 'sharks', json: './public/sharks.json', emoji: '🦈', label: 'Shark' },
];

// ---------------------------------------------------------------------------
// Directories & files
// ---------------------------------------------------------------------------

export const DIRS = {
  raw: './raw_png/',
  full: './public/full/',
  thumb: './public/thumb/',
} as const;

export const FILES = {
  version: './src/version.json',
  changelog: './CHANGELOG.md',
  collections: COLLECTIONS,

  // Legacy direct references — derived from COLLECTIONS so always in sync
  get birds() {
    return COLLECTIONS.find((c) => c.id === 'birds')!.json;
  },
} as const;

export const THUMB_SIZE = 400;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Bird {
  id: string;
  name: string;
  sci: string;
  drawn?: string;
}

export interface BirdsData {
  [category: string]: Bird[];
}

// Generic alias used by multi-collection code
export type CollectionData = BirdsData;

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
// Integrity check
// NOTE: with per-collection subfolders (thumb/birds/, thumb/sharks/) you'll
// want to pass the specific subfolder path rather than DIRS.thumb directly.
// ---------------------------------------------------------------------------

export async function checkIntegrity(
  birdIds: Set<string>,
  collectionId = 'birds',
): Promise<IntegrityResult> {
  const fullDir = `${DIRS.full}${collectionId}/`;
  const thumbDir = `${DIRS.thumb}${collectionId}/`;

  const fullFiles = await listFiles(fullDir, (n) => n.endsWith('.webp'));
  const thumbFiles = await listFiles(thumbDir, (n) => n.endsWith('.webp'));

  const fullIds = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  const missing = Array.from(birdIds).filter((id) => !fullIds.has(id) || !thumbIds.has(id));
  const orphaned = [
    ...Array.from(fullIds).filter((id) => !birdIds.has(id)),
    ...Array.from(thumbIds).filter((id) => !birdIds.has(id)),
  ];

  return { missing, orphaned, passed: missing.length === 0 && orphaned.length === 0 };
}
