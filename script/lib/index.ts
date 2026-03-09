// Re-export all collection constants and helpers
export * from './collections.ts';

// Re-export all file system utilities
export * from './fs.ts';

// Re-export all string utilities
export * from './strings.ts';

// Re-export all TypeScript types
export * from './types.ts';

import { COLLECTIONS } from '../../src/collections.ts'; // Adjust path to reach src/collections.ts

export interface ScriptCollectionEntry {
  id: string;
  json: string;      // The actual path on disk for the JSON data
  placeholder: string;
  raw: string;
  emoji: string;
  label: string;
}

// Maps frontend config to backend file paths
export const FILES = {
  version: './src/version.json',
  changelog: './CHANGELOG.md',
  // Helper to get collections with disk paths
  get collections(): ScriptCollectionEntry[] {
    return COLLECTIONS.map(c => ({
      id: c.id,
      json: `./src/data/${c.id}.json`,       // Path used by script
      placeholder: `./src/data/${c.id}_placeholder.json`,
      raw: `./src/data/${c.id}_raw.json`,
      emoji: c.emoji,
      label: c.label
    }));
  }
} as const;