/// <reference lib="deno.ns" />
import { appendText, readJson, writeJson } from '../lib/fs.ts';
import { CHANGELOG_FILE, COLLECTIONS, VERSION_FILE } from '../collection/registry.ts';
import { loadCollectionData } from '../collection/record.ts';
import type { Collection } from '../collection/registry.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionData {
  major: number;
  minor: number;
  patch: number;
  count: number;
  updated: string;
}

export interface NewDrawing {
  id: string;
  name: string;
  sci: string;
  emoji: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Git helper
// ---------------------------------------------------------------------------

async function runGit(...args: string[]): Promise<string> {
  const cmd = new Deno.Command('git', { args, stdout: 'piped', stderr: 'piped' });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(stderr)}`);
  }
  return new TextDecoder().decode(stdout).trim();
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function parseAddedDrawnIds(diff: string): Set<string> {
  const addedIds = new Set<string>();
  const lines = diff.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\+\s+"drawn"\s*:/.test(lines[i])) {
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const idMatch = lines[j].match(/^\s*[+ ]\s+"id"\s*:\s*"([^"]+)"/);
        if (idMatch) {
          addedIds.add(idMatch[1]);
          break;
        }
      }
    }
  }
  return addedIds;
}

// ---------------------------------------------------------------------------
// VersionManager
// ---------------------------------------------------------------------------

export class VersionManager {
  static async load(): Promise<VersionData> {
    try {
      return await readJson<VersionData>(VERSION_FILE);
    } catch {
      const defaultVer: VersionData = {
        major: 0,
        minor: 7,
        patch: 0,
        count: 0,
        updated: new Date().toISOString(),
      };
      await writeJson(VERSION_FILE, defaultVer);
      return defaultVer;
    }
  }

  static format(v: VersionData): string {
    return `${v.major}.${v.minor}.${v.patch}+${v.count}`;
  }

  static async bumpPatch(totalDrawn: number): Promise<VersionData> {
    const v = await this.load();
    v.patch += 1;
    v.count = totalDrawn;
    v.updated = new Date().toISOString();
    await writeJson(VERSION_FILE, v);
    return v;
  }

  static async bumpAuto(commitMsg: string, totalDrawn?: number): Promise<VersionData> {
    const v = await this.load();
    if (commitMsg.startsWith('feat:')) {
      v.minor += 1;
      v.patch = 0;
    } else {
      v.patch += 1;
    }
    if (totalDrawn !== undefined) v.count = totalDrawn;
    v.updated = new Date().toISOString();
    await writeJson(VERSION_FILE, v);
    return v;
  }

  static async appendChangelog(
    version: VersionData,
    commitMsg: string,
    newDrawings: NewDrawing[] = [],
  ): Promise<void> {
    const vStr = this.format(version);
    let block = `- **${vStr}** - ${commitMsg} (${todayStr()})\n`;
    for (const d of newDrawings) {
      block += `  - ${d.emoji} ${d.label} ${d.id}: ${d.name}`;
      if (d.sci) block += ` (${d.sci})`;
      block += '\n';
    }
    try {
      await Deno.stat(CHANGELOG_FILE);
    } catch {
      await Deno.writeTextFile(CHANGELOG_FILE, '# Changelog\n\n');
    }
    await appendText(CHANGELOG_FILE, block);
  }

  static async getNewlyDrawnFromDiff(): Promise<NewDrawing[]> {
    try {
      await runGit('rev-parse', '--verify', 'HEAD~1');
    } catch {
      return [];
    }
    const result: NewDrawing[] = [];
    for (const col of COLLECTIONS) {
      const drawings = await this._diffCollection(col);
      result.push(...drawings);
    }
    return result;
  }

  private static async _diffCollection(col: Collection): Promise<NewDrawing[]> {
    let diff: string;
    try {
      diff = await runGit('diff', 'HEAD~1', 'HEAD', '--', col.paths.json);
    } catch {
      return [];
    }
    if (!diff) return [];

    const addedIds = parseAddedDrawnIds(diff);
    if (addedIds.size === 0) return [];

    let data: Awaited<ReturnType<typeof loadCollectionData>>;
    try {
      data = await loadCollectionData(col);
    } catch {
      return [];
    }

    const found: NewDrawing[] = [];
    for (const group of Object.values(data)) {
      for (const item of group) {
        if (addedIds.has(item.id)) {
          found.push({
            id: item.id,
            name: item.name,
            sci: item.sci ?? '',
            emoji: col.emoji,
            label: col.label,
          });
        }
      }
    }
    return found;
  }

  static async getDrawnIds(collectionId?: string): Promise<Set<string>> {
    const targets = collectionId ? COLLECTIONS.filter((c) => c.id === collectionId) : COLLECTIONS;

    const ids = new Set<string>();
    for (const col of targets) {
      try {
        const data = await loadCollectionData(col);
        for (const group of Object.values(data)) {
          for (const item of group) {
            if (item.drawn) ids.add(item.id);
          }
        }
      } catch { /* collection JSON may not exist yet */ }
    }
    return ids;
  }
}

// ---------------------------------------------------------------------------
// Convenience exports (preserve call sites in bump.ts)
// ---------------------------------------------------------------------------

export const loadVersion = VersionManager.load.bind(VersionManager);
export const bumpPatchVersion = VersionManager.bumpPatch.bind(VersionManager);
export const getDrawnIds = VersionManager.getDrawnIds.bind(VersionManager);
