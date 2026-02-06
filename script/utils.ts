/// <reference lib="deno.ns" />

/// === utils.ts ===

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

export async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }
}

export async function getImageFiles(dir: string, ext: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && entry.name.toLowerCase().endsWith(ext)) {
        files.push(entry.name);
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }
  return files.sort();
}

export async function loadJson<T>(path: string): Promise<T> {
  const content = await Deno.readTextFile(path);
  return JSON.parse(content);
}

export async function saveJson(path: string, data: unknown): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + '\n');
}

export function getBaseName(filename: string): string {
  return filename.replace(/\.(png|webp)$/i, '');
}

export function formatVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

export function formatFullVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}+${v.count}`;
}
