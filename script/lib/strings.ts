import { VersionData } from '../../src/types/index.ts';

/**
 * Extract the base name from a filename by stripping .png or .webp extension.
 */
export function getBaseName(filename: string): string {
  return filename.replace(/\.(png|webp)$/i, '');
}

/**
 * Format a VersionData object as "major.minor.patch+count".
 */
export function formatVersion(v: VersionData): string {
  return `${v.major}.${v.minor}.${v.patch}+${v.count}`;
}
