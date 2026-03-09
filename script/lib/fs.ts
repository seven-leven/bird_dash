/// <reference lib="deno.ns" />

/**
 * List all file names in a directory that pass the given filter.
 * Returns an empty array if the directory does not exist.
 */
export async function listFiles(dir: string, filter: (name: string) => boolean): Promise<string[]> {
  try {
    const files: string[] = [];
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && filter(entry.name)) files.push(entry.name);
    }
    return files.sort();
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    throw err;
  }
}

/**
 * Ensure a directory exists, creating parent directories if needed.
 */
export async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) throw err;
  }
}

/**
 * Read and parse a JSON file.
 */
export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await Deno.readTextFile(path));
}

/**
 * Write data as JSON to a file (with newline at end).
 */
export async function writeJson(path: string, data: unknown): Promise<void> {
  await Deno.writeTextFile(path, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Append text to a file.
 */
export async function appendText(path: string, text: string): Promise<void> {
  await Deno.writeTextFile(path, text, { append: true });
}
