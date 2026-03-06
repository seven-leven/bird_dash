/// <reference lib="deno.ns" />
import {
  appendText,
  CollectionData,
  CollectionEntry,
  FILES,
  readJson,
  VersionData,
  writeJson,
} from './utils.ts';

// ---------------------------------------------------------------------------
// Helpers
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

/**
 * Parse a git diff string and return the set of item IDs
 * where a "drawn" field was newly added (+) in this diff.
 */
function parseAddedDrawnIds(diff: string): Set<string> {
  const addedIds = new Set<string>();
  const lines = diff.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (/^\+\s+"drawn"\s*:/.test(lines[i])) {
      // Scan backward up to 20 lines for the parent "id" field
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const idMatch = lines[j].match(/^\s+[+ ]\s+"id"\s*:\s*"([^"]+)"/);
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
// Types
// ---------------------------------------------------------------------------

export interface NewDrawing {
  id: string;
  name: string;
  sci: string;
  emoji: string; // from the collection entry e.g. 🐦 🦈
  label: string; // e.g. "Bird", "Shark"
}

// ---------------------------------------------------------------------------
// VersionManager
// ---------------------------------------------------------------------------

export class VersionManager {
  // ── Load / Save ──────────────────────────────────────────────────────────

  static async load(): Promise<VersionData> {
    try {
      return await readJson<VersionData>(FILES.version);
    } catch {
      const defaultVer: VersionData = {
        major: 0,
        minor: 7,
        patch: 0,
        count: 0,
        updated: new Date().toISOString(),
      };
      await writeJson(FILES.version, defaultVer);
      return defaultVer;
    }
  }

  static format(version: VersionData): string {
    return `${version.major}.${version.minor}.${version.patch}+${version.count}`;
  }

  // ── Version bumping ───────────────────────────────────────────────────────

  /**
   * Auto-bump called from the post-commit hook.
   * - commit message starts with "feat:" → minor bump, patch resets to 0
   * - everything else                    → patch bump
   * - count always synced from total git commit count
   */
  static async bumpAuto(commitMsg: string): Promise<VersionData> {
    const version = await this.load();
    const count = parseInt(await runGit('rev-list', '--count', 'HEAD'), 10);
    const isFeat = commitMsg.toLowerCase().startsWith('feat:');

    if (isFeat) {
      version.minor += 1;
      version.patch = 0;
    } else {
      version.patch += 1;
    }

    version.count = count;
    version.updated = new Date().toISOString();
    await writeJson(FILES.version, version);
    return version;
  }

  /** Legacy manual bump (kept for ship script compatibility) */
  static async bump(count: number): Promise<VersionData> {
    const version = await this.load();
    version.patch += 1;
    version.count = count;
    version.updated = new Date().toISOString();
    await writeJson(FILES.version, version);
    return version;
  }

  // ── Changelog ────────────────────────────────────────────────────────────

  /**
   * Append one commit's worth of changelog entries.
   *
   * Format:
   *   - **v0.7.1+42** - <commitMsg> (YYYY-MM-DD)
   *     - 🐦 Bird 047: Grey Heron (Ardea cinerea)
   *     - 🦈 Shark 003: Blacktip Reef Shark (Carcharhinus melanopterus)
   */
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

    // Ensure changelog exists
    try {
      await Deno.stat(FILES.changelog);
    } catch {
      await Deno.writeTextFile(FILES.changelog, '# Changelog\n\n');
    }

    await appendText(FILES.changelog, block);
  }

  // ── Drawing detection — all collections ──────────────────────────────────

  /**
   * Loops over every registered collection in FILES.collections,
   * diffs its JSON file against HEAD~1, and returns all items
   * whose "drawn" field was newly added in this commit.
   *
   * Returns [] on the first commit (no HEAD~1) or if nothing changed.
   */
  static async getNewlyDrawnFromDiff(): Promise<NewDrawing[]> {
    // Check parent commit exists
    try {
      await runGit('rev-parse', '--verify', 'HEAD~1');
    } catch {
      return []; // first commit, nothing to diff
    }

    const result: NewDrawing[] = [];

    for (const collection of FILES.collections) {
      const drawings = await VersionManager._diffCollection(collection);
      result.push(...drawings);
    }

    return result;
  }

  /** Diff a single collection's JSON file and return newly drawn items. */
  private static async _diffCollection(
    collection: CollectionEntry,
  ): Promise<NewDrawing[]> {
    let diff: string;
    try {
      diff = await runGit('diff', 'HEAD~1', 'HEAD', '--', collection.json);
    } catch {
      return [];
    }

    if (!diff) return [];

    const addedIds = parseAddedDrawnIds(diff);
    if (addedIds.size === 0) return [];

    let data: CollectionData;
    try {
      data = await readJson<CollectionData>(collection.json);
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
            emoji: collection.emoji,
            label: collection.label,
          });
        }
      }
    }

    return found;
  }

  // ── Collection-aware drawn IDs helper ────────────────────────────────────

  /**
   * Returns all drawn IDs across ALL collections.
   * Pass a specific collectionId to get just one.
   */
  static async getDrawnIds(collectionId?: string): Promise<Set<string>> {
    const targets = collectionId
      ? FILES.collections.filter((c) => c.id === collectionId)
      : FILES.collections;

    const ids = new Set<string>();

    for (const collection of targets) {
      try {
        const data = await readJson<CollectionData>(collection.json);
        Object.values(data).flat().forEach((item) => item.drawn && ids.add(item.id));
      } catch {
        // collection json may not exist yet — skip silently
      }
    }

    return ids;
  }

  // ── Legacy birds-only helpers (backwards compat) ─────────────────────────

  static async markBirdAsDrawn(birdId: string): Promise<string | null> {
    const data = await readJson<CollectionData>(FILES.birds);
    const today = todayStr();

    for (const category of Object.keys(data)) {
      const bird = data[category].find((b) => b.id === birdId);
      if (bird && !bird.drawn) {
        bird.drawn = today;
        await writeJson(FILES.birds, data);
        return bird.name;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Convenience re-exports (backwards compat)
// ---------------------------------------------------------------------------
export const loadVersion = VersionManager.load.bind(VersionManager);
export const bumpPatchVersion = VersionManager.bump.bind(VersionManager);
export const getExistingBirdIds = () => VersionManager.getDrawnIds('birds');
export const markBirdAsDrawn = VersionManager.markBirdAsDrawn.bind(VersionManager);
export const getDisplayVersion = VersionManager.format;
