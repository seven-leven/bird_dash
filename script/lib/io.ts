// The one way a command reaches the outside world (docs/SCRIPTS.md, principle 6): files,
// git, the environment, the clock and the console. A command's `main` takes an `Io`;
// tests pass `fakeIo()` (fakeIo.ts) instead of touching the repository.
import { spawn } from 'node:child_process';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { styleText } from 'node:util';
import { ensureDir, listFiles } from './fs.ts';
import { git } from './git.ts';

export interface Io {
  readText(path: string): Promise<string>;
  writeText(path: string, text: string): Promise<void>;
  /** Add `text` to the end of a file, making it if it is not there (the CI job summary). */
  appendText(path: string, text: string): Promise<void>;
  /** The names of the files in `dir` that pass `filter`, sorted; none if `dir` is missing. */
  listFiles(dir: string, filter?: (name: string) => boolean): Promise<string[]>;
  /** Make a folder and any missing parents. */
  makeDir(path: string): Promise<void>;
  /** Run git and return its trimmed output; rejects with git's message when it fails. */
  git(...args: string[]): Promise<string>;
  /**
   * Run a JavaScript file with this Node (a tool's entry, such as Vite's), its output
   * going straight to the terminal; resolves with its exit code. No shell, so it runs the
   * same on Windows.
   */
  runNode(script: string, args: string[]): Promise<number>;
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
  appendText: (path, text) => appendFile(path, text),
  listFiles: (dir, filter = () => true) => listFiles(dir, filter),
  makeDir: ensureDir,
  git,
  runNode: (script, args) =>
    new Promise((resolve, reject) => {
      spawn(process.execPath, [script, ...args], { stdio: 'inherit' })
        .on('error', reject)
        // A tool killed by a signal (Ctrl+C) has no exit code: count it as a failure. A test
        // cannot kill a child the same way on every platform, so that side is not run.
        /* c8 ignore start */
        .on('close', (code) => resolve(code ?? 1));
      /* c8 ignore stop */
    }),
  env: (name) => process.env[name],
  now: () => new Date(),
  out: (line) => console.log(colorMarks(line, process.stdout)),
  err: (line) => console.error(colorMarks(line, process.stderr)),
};

/**
 * The reports' marks in colour, ✓ green and ✗ red, when `stream` is a terminal that shows
 * colour; Node's `styleText` leaves them plain anywhere else, and under `NO_COLOR`.
 */
export const colorMarks = (line: string, stream: NodeJS.WriteStream): string =>
  line.replace(/[✓✗]/g, (mark) => styleText(mark === '✓' ? 'green' : 'red', mark, { stream }));

/** Read and parse a JSON file. */
export async function readJson<T>(io: Io, path: string): Promise<T> {
  return JSON.parse(await io.readText(path)) as T;
}

/** Write `data` as JSON: two-space indent and a final newline, as the repository keeps it. */
export function writeJson(io: Io, path: string, data: unknown): Promise<void> {
  return io.writeText(path, JSON.stringify(data, null, 2) + '\n');
}
