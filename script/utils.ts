/// <reference lib="deno.ns" />

// === utils.ts - Consolidated file operations ===

export const DIRS = {
  raw: './raw_png/',
  full: './public/full/',
  thumb: './public/thumb/',
} as const;

export const FILES = {
  birds: './public/birds.json',
  version: './src/version.json',
  changelog: './CHANGELOG.md',
} as const;

export const THUMB_SIZE = 400;

// Types
export interface Bird {
  id: string;
  name: string;
  sci: string;
  drawn?: string;
}

export interface BirdsData {
  [category: string]: Bird[];
}

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

// File operations
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

// String utilities
export function getBaseName(filename: string): string {
  return filename.replace(/\.(png|webp)$/i, '');
}

export function formatVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}+${v.count}`;
}

// Integrity check helper
export async function checkIntegrity(birdIds: Set<string>): Promise<IntegrityResult> {
  const fullFiles = await listFiles(DIRS.full, (n) => n.endsWith('.webp'));
  const thumbFiles = await listFiles(DIRS.thumb, (n) => n.endsWith('.webp'));

  const fullIds = new Set(fullFiles.map(getBaseName));
  const thumbIds = new Set(thumbFiles.map(getBaseName));

  const missing = Array.from(birdIds).filter((id) => !fullIds.has(id) || !thumbIds.has(id));
  const orphaned = [
    ...Array.from(fullIds).filter((id) => !birdIds.has(id)),
    ...Array.from(thumbIds).filter((id) => !birdIds.has(id)),
  ];

  return { missing, orphaned, passed: missing.length === 0 && orphaned.length === 0 };
}
