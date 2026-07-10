/// <reference lib="deno.ns" />
/**
 * script/version/compute.ts
 *
 * Derived versioning — nothing is stored except major/minor.
 *
 *   x.y.z+w  where
 *   x.y = major/minor, read from ./version.json (bumped by hand for releases)
 *   z   = patch, the total commit count on the current branch (git rev-list)
 *   w   = total drawn illustrations, counted from public/lists/*.json
 *
 * Because z and w are computed from the repo itself, the version can never
 * drift and never needs a bump commit, a git hook, or a CI write-back.
 *
 * Run `deno task version` to print the current version.
 */

import { readJson } from '../lib/fs.ts';
import { git } from '../lib/git.ts';
import { COLLECTIONS, VERSION_FILE } from '../collection/registry.ts';
import { forEachDrawn, loadCollectionData } from '../collection/record.ts';

export interface VersionData {
  major: number;
  minor: number;
  patch: number;
  count: number;
}

export async function getCommitCount(): Promise<number> {
  return Number(await git('rev-list', '--count', 'HEAD'));
}

export async function getDrawnIds(collectionId?: string): Promise<Set<string>> {
  const targets = collectionId ? COLLECTIONS.filter((c) => c.id === collectionId) : COLLECTIONS;

  const ids = new Set<string>();
  for (const col of targets) {
    try {
      const data = await loadCollectionData(col);
      forEachDrawn(data, (item) => ids.add(`${col.id}/${item.id}`));
    } catch { /* collection JSON may not exist yet */ }
  }
  return ids;
}

export async function computeVersion(): Promise<VersionData> {
  const base = await readJson<{ major: number; minor: number }>(VERSION_FILE);
  const [patch, drawn] = await Promise.all([getCommitCount(), getDrawnIds()]);
  return { major: base.major, minor: base.minor, patch, count: drawn.size };
}

export function formatVersion(v: VersionData): string {
  const patch = String(v.patch).padStart(3, '0');
  const count = String(v.count).padStart(3, '0');
  return `${v.major}.${v.minor}.${patch}+${count}`;
}

if (import.meta.main) {
  console.log(formatVersion(await computeVersion()));
}
