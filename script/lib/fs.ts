import { mkdir, readdir } from 'node:fs/promises';

/** True when `err` is a Node system error with this `code` (e.g. `ENOENT`). */
export const isErrno = (err: unknown, code: string): boolean =>
  err instanceof Error && (err as NodeJS.ErrnoException).code === code;

/**
 * List all file names in a directory that pass the given filter.
 * Returns an empty array if the directory does not exist.
 */
export async function listFiles(dir: string, filter: (name: string) => boolean): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && filter(e.name)).map((e) => e.name).sort();
  } catch (err) {
    if (isErrno(err, 'ENOENT')) return [];
    throw err;
  }
}

/**
 * Ensure a directory exists, creating parent directories if needed.
 */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
