// The one way a command reaches the outside world (docs/SCRIPTS.md, principle 6): files,
// git, the environment, the clock and the console. A command's `main` takes an `Io`;
// tests pass `fakeIo()` (fakeIo.ts) instead of touching the repository.
import { readFile, writeFile } from 'node:fs/promises';
import { ensureDir, listFiles } from './fs.ts';
import { git } from './git.ts';

export interface Io {
  readText(path: string): Promise<string>;
  writeText(path: string, text: string): Promise<void>;
  /** The names of the files in `dir` that pass `filter`, sorted; none if `dir` is missing. */
  listFiles(dir: string, filter?: (name: string) => boolean): Promise<string[]>;
  /** Make a folder and any missing parents. */
  makeDir(path: string): Promise<void>;
  /** Run git and return its trimmed output; rejects with git's message when it fails. */
  git(...args: string[]): Promise<string>;
  /** An environment variable, or undefined. */
  env(name: string): string | undefined;
  now(): Date;
  /** A line of output (stdout) and a line about a problem (stderr). */
  out(line: string): void;
  err(line: string): void;
}

export const realIo: Io = {
  readText: (path) => readFile(path, 'utf8'),
  writeText: (path, text) => writeFile(path, text),
  listFiles: (dir, filter = () => true) => listFiles(dir, filter),
  makeDir: ensureDir,
  git,
  env: (name) => process.env[name],
  now: () => new Date(),
  out: (line) => console.log(line),
  err: (line) => console.error(line),
};

/** Read and parse a JSON file. */
export async function readJson<T>(io: Io, path: string): Promise<T> {
  return JSON.parse(await io.readText(path)) as T;
}

/** Write `data` as JSON: two-space indent and a final newline, as the repository keeps it. */
export function writeJson(io: Io, path: string, data: unknown): Promise<void> {
  return io.writeText(path, JSON.stringify(data, null, 2) + '\n');
}
