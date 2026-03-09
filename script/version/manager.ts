/// <reference lib="deno.ns" />
import {
  appendText,
  CollectionData,
  type ScriptCollectionEntry,
  FILES,
  readJson,
  VersionData,
  writeJson,
} from '../lib/index.ts';

// ---------------------------------------------------------------------------
// Helpers (unchanged)
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
      return await readJson<VersionData>(FILES.version);
    } catch {
      const defaultVer: VersionData = {
        major: 0, minor: 7, patch: 0, count: 0, updated: new Date().toISOString(),
      };
      await writeJson(FILES.version, defaultVer);
      return defaultVer;
    }
  }

  static format(version: VersionData): string {
    return `${version.major}.${version.minor}.${version.patch}+${version.count}`;
  }

static async bumpPatch(totalDrawn: number): Promise<VersionData> {
  const version = await this.load();
  version.patch += 1;
  version.count = totalDrawn;
  version.updated = new Date().toISOString();
  await writeJson(FILES.version, version);
  return version;
}

  static async appendChangelog(
    version: VersionData,
    commitMsg: string,
    newDrawings: NewDrawing[] = [],
  ): Promise<void> {
    const vStr = this.format(version);
    const date = todayStr();
    let block = `- **${vStr}** - ${commitMsg} (${date})\n`;
    for (const d of newDrawings) {
      block += `  - ${d.emoji} ${d.label} ${d.id}: ${d.name}`;
      if (d.sci) block += ` (${d.sci})`;
      block += '\n';
    }
    try { await Deno.stat(FILES.changelog); } catch { await Deno.writeTextFile(FILES.changelog, '# Changelog\n\n'); }
    await appendText(FILES.changelog, block);
  }

  static async getNewlyDrawnFromDiff(): Promise<NewDrawing[]> {
    try { await runGit('rev-parse', '--verify', 'HEAD~1'); } catch { return []; }
    const result: NewDrawing[] = [];
    for (const collection of FILES.collections) {
      const drawings = await VersionManager._diffCollection(collection);
      result.push(...drawings);
    }
    return result;
  }

  private static async _diffCollection(collection: ScriptCollectionEntry): Promise<NewDrawing[]> {
    let diff: string;
    try { diff = await runGit('diff', 'HEAD~1', 'HEAD', '--', collection.json); } catch { return []; }
    if (!diff) return [];
    const addedIds = parseAddedDrawnIds(diff);
    if (addedIds.size === 0) return [];
    let data: CollectionData;
    try { data = await readJson<CollectionData>(collection.json); } catch { return []; }
    
    const found: NewDrawing[] = [];
    for (const group of Object.values(data)) {
      for (const item of group) {
        if (addedIds.has(item.id)) {
          found.push({
            id: item.id,
            name: item.name,
            sci: item.sci ?? '',
            emoji: collection.emoji,
            label: collection.label,
          });
        }
      }
    }
    return found;
  }

  static async getDrawnIds(collectionId?: string): Promise<Set<string>> {
    const targets = collectionId
      ? FILES.collections.filter((c: ScriptCollectionEntry) => c.id === collectionId)
      : FILES.collections;

    const ids = new Set<string>();
    for (const collection of targets) {
      try {
        const data = await readJson<CollectionData>(collection.json);
        Object.values(data).flat().forEach((item) => item.drawn && ids.add(item.id));
      } catch { /* ignored */ }
    }
    return ids;
  }

  static async markBirdAsDrawn(birdId: string): Promise<string | null> {
    const birds = FILES.collections.find((c: ScriptCollectionEntry) => c.id === 'birds');
    if (!birds) return null;
    const data = await readJson<CollectionData>(birds.json);
    const today = todayStr();
    for (const category of Object.keys(data)) {
      const item = data[category].find((b) => b.id === birdId);
      if (item && !item.drawn) {
        item.drawn = today;
        await writeJson(birds.json, data);
        return item.name;
      }
    }
    return null;
  }
}

export interface NewDrawing { id: string; name: string; sci: string; emoji: string; label: string; }
export const loadVersion = VersionManager.load.bind(VersionManager);
export const bumpPatchVersion = VersionManager.bumpPatch.bind(VersionManager);
export const getExistingBirdIds = () => VersionManager.getDrawnIds('birds');
export const markBirdAsDrawn = VersionManager.markBirdAsDrawn.bind(VersionManager);
export const getDisplayVersion = VersionManager.format;
export const getDrawnIds = VersionManager.getDrawnIds.bind(VersionManager);