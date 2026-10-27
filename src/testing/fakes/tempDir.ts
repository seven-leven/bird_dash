// The one way a test gets a folder of its own on disk (docs/TESTING.md, rule 4): made under
// the system's temporary folder, and removed with everything in it when the `await using`
// block ends, whether the test passed or not.
//
//   await using dir = await tempDir('ingest');
//   await writeFile(dir.join('a.png'), bytes);
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface TempDir extends AsyncDisposable {
  path: string;
  /** A path inside the folder. */
  join(...parts: string[]): string;
}

/** A new, empty folder whose name starts with `prefix`. */
export async function tempDir(prefix = 'test'): Promise<TempDir> {
  const path = await mkdtemp(join(tmpdir(), `${prefix}-`));
  return {
    path,
    join: (...parts) => join(path, ...parts),
    [Symbol.asyncDispose]: () => rm(path, { recursive: true, force: true }),
  };
}
