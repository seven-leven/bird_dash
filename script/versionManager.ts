/// <reference lib="deno.ns" />
import { appendText, BirdsData, FILES, readJson, VersionData, writeJson } from './utils.ts';

// Version management
export class VersionManager {
  static async load(): Promise<VersionData> {
    try {
      return await readJson<VersionData>(FILES.version);
    } catch {
      const defaultVer = {
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

  static async bump(count: number): Promise<VersionData> {
    const version = await this.load();
    version.patch += 1;
    version.count = count;
    version.updated = new Date().toISOString();
    await writeJson(FILES.version, version);
    return version;
  }

  static async getDrawnIds(): Promise<Set<string>> {
    const data = await readJson<BirdsData>(FILES.birds);
    const ids = new Set<string>();
    Object.values(data).flat().forEach((b) => b.drawn && ids.add(b.id));
    return ids;
  }

  static async markBirdAsDrawn(birdId: string): Promise<string | null> {
    const data = await readJson<BirdsData>(FILES.birds);
    const today = new Date().toISOString().split('T')[0];

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

  static async addToChangelog(birdId: string, birdName: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    const logLine = `- **Bird ${birdId}**: Added ${birdName} illustration (${date})\n`;

    try {
      await appendText(FILES.changelog, logLine);
    } catch {
      await writeJson(FILES.changelog, `# Changelog\n\n${logLine}`);
    }
  }

  static format(version: VersionData): string {
    return `${version.major}.${version.minor}.${version.patch}+${version.count}`;
  }
}

// Convenience exports
export const loadVersion = VersionManager.load;
export const bumpPatchVersion = VersionManager.bump;
export const getExistingBirdIds = VersionManager.getDrawnIds;
export const markBirdAsDrawn = VersionManager.markBirdAsDrawn;
export const addToChangelog = VersionManager.addToChangelog;
export const getDisplayVersion = VersionManager.format;
