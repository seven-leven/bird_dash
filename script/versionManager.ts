/// <reference lib="deno.ns" />
import { BirdsData, FILES, formatFullVersion, formatVersion, loadJson, saveJson } from './utils.ts';

export interface VersionData {
  major: number;
  minor: number;
  patch: number;
  count: number;
  updated: string;
}

/**
 * Load version from JSON (single source of truth)
 * Creates default if file doesn't exist
 */
export async function loadVersion(): Promise<VersionData> {
  try {
    return await loadJson<VersionData>(FILES.version);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // Initialize with default version - only happens once
      const defaultVersion: VersionData = {
        major: 0,
        minor: 7,
        patch: 0,
        count: 0,
        updated: new Date().toISOString(),
      };
      await saveVersion(defaultVersion);
      console.log('  🆕 Created initial version.json');
      return defaultVersion;
    }
    throw err;
  }
}

/**
 * Save version to JSON
 */
export async function saveVersion(version: VersionData): Promise<void> {
  version.updated = new Date().toISOString();
  await saveJson(FILES.version, version);
}

/**
 * Bump patch version (x.x.X) and update count
 * Called on every git push/build
 */
export async function bumpPatchVersion(newCount: number): Promise<VersionData> {
  const version = await loadVersion();

  // Only bump if count changed or it's a new build
  if (newCount !== version.count) {
    version.patch += 1;
    version.count = newCount;
    await saveVersion(version);
    console.log(`  🔢 Bumped version: ${formatVersion(version)}+${version.count}`);
  } else {
    // Still update timestamp even if count didn't change
    version.updated = new Date().toISOString();
    await saveVersion(version);
    console.log(`  🔢 Version unchanged: ${formatVersion(version)}+${version.count}`);
  }

  return version;
}

/**
 * Get all bird IDs that have been drawn (have illustrations)
 */
export async function getExistingBirdIds(): Promise<Set<string>> {
  const data = await loadBirdsData();
  const ids = new Set<string>();

  for (const category of Object.keys(data)) {
    for (const bird of data[category]) {
      if (bird.drawn) {
        ids.add(bird.id);
      }
    }
  }

  return ids;
}

/**
 * Count total drawn birds
 */
export async function countDrawnBirds(): Promise<number> {
  const ids = await getExistingBirdIds();
  return ids.size;
}

/**
 * Update birds.json: add drawn date to a bird
 * Returns the bird name if updated, null if already drawn or not found
 */
export async function markBirdAsDrawn(birdId: string): Promise<string | null> {
  const data = await loadBirdsData();
  const today = new Date().toISOString().split('T')[0];

  for (const category of Object.keys(data)) {
    const bird = data[category].find((b) => b.id === birdId);
    if (bird) {
      if (!bird.drawn) {
        bird.drawn = today;
        await saveBirdsData(data);
        console.log(`  📝 Updated birds.json: ${bird.name} (${bird.id})`);
        return bird.name;
      }
      return null; // Already has drawn date
    }
  }

  console.warn(`  ⚠️  Bird ID ${birdId} not found in birds.json`);
  return null;
}

/**
 * Add entry to CHANGELOG.md
 */
export async function addToChangelog(birdId: string, birdName: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const logLine = `- **Bird ${birdId}**: Added ${birdName} illustration (${date})\n`;

  try {
    await Deno.writeTextFile(FILES.changelog, logLine, { append: true });
    console.log(`  📋 Added to CHANGELOG.md`);
  } catch (err) {
    // If file doesn't exist, create it
    if (err instanceof Deno.errors.NotFound) {
      await Deno.writeTextFile(FILES.changelog, `# Changelog\n\n${logLine}`);
      console.log(`  📋 Created CHANGELOG.md`);
    } else {
      throw err;
    }
  }
}

async function loadBirdsData(): Promise<BirdsData> {
  return await loadJson<BirdsData>(FILES.birds);
}

async function saveBirdsData(data: BirdsData): Promise<void> {
  await saveJson(FILES.birds, data);
}

/**
 * Get display version string for UI
 */
export function getDisplayVersion(version: VersionData): string {
  return formatFullVersion(version);
}
