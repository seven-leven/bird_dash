// Re-export all TypeScript types FIRST
export * from '../../src/types/scripts.ts';

// Re-export all collection constants and helpers
export * from './collections.ts';

// Re-export all file system utilities
export * from './fs.ts';

// Re-export all string utilities
export * from './strings.ts';

import { COLLECTIONS } from './collections.ts';
import type { ScriptCollectionEntry } from '../../src/types/scripts.ts';

// Maps frontend config to backend file paths
export const FILES = {
  version: './src/version.json',
  changelog: './CHANGELOG.md',
  // Helper to get collections with disk paths
  get collections(): ScriptCollectionEntry[] {
    return COLLECTIONS.map((c) => ({
      id: c.id,
      json: `./src/data/${c.id}.json`,
      placeholder: `./src/data/${c.id}_placeholder.json`,
      raw: `./src/data/${c.id}_raw.json`,
      emoji: c.emoji,
      label: c.label,
    }));
  },
} as const;
