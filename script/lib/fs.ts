import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

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

/**
 * Read and parse a JSON file.
 */
export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8'));
}

/**
 * Write data as JSON to a file (2-space indent, trailing newline).
 */
export async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + '\n');
}
