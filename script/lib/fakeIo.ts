// An Io for tests: files in memory, git answers given up front, a fixed clock, and the
// output kept for the test to read. Nothing touches the disk, git or the console.
import type { Io } from './io.ts';

export interface FakeIoOptions {
  /** Files that exist, by path. */
  files?: Record<string, string>;
  /** git's answers, by its arguments joined with spaces (`'rev-list --count HEAD'`). */
  git?: Record<string, string>;
  /** The repository's commit count and short commit id, the two answers the version asks git for. */
  commits?: number;
  commit?: string;
  env?: Record<string, string>;
  now?: Date;
  /** Exit codes for scripts run with `runNode`, by script path; any other exits 0. */
  exitCodes?: Record<string, number>;
}

export interface FakeIo extends Io {
  /** Every file, including those the command wrote. */
  files: Map<string, string>;
  /** Every `runNode` call, as `script args…`. */
  ran: string[];
  /** Lines the command printed, and lines it reported as problems. */
  outLines: string[];
  errLines: string[];
  /** Every line, printed or a problem, in the order it came. */
  printed: string[];
}

/**
 * A fake Io. git fails, as it does without a repository, for any command it has no
 * answer for; a missing file fails as a missing file does (`ENOENT`).
 */
export function fakeIo(options: FakeIoOptions = {}): FakeIo {
  const files = new Map(Object.entries(options.files ?? {}));
  const ran: string[] = [];
  const outLines: string[] = [];
  const errLines: string[] = [];
  const printed: string[] = [];
  const missing = (path: string) =>
    Object.assign(new Error(`ENOENT: no such file, open '${path}'`), { code: 'ENOENT' });
  const folder = (dir: string) => dir.replace(/\/?$/, '/');
  const gitAnswers: Record<string, string> = {
    ...(options.commits === undefined ? {} : { 'rev-list --count HEAD': String(options.commits) }),
    ...(options.commit === undefined ? {} : { 'rev-parse --short=7 HEAD': options.commit }),
    ...options.git,
  };

  return {
    files,
    ran,
    outLines,
    errLines,
    printed,
    readText: (path) => {
      const text = files.get(path);
      return text === undefined ? Promise.reject(missing(path)) : Promise.resolve(text);
    },
    writeText: (path, text) => {
      files.set(path, text);
      return Promise.resolve();
    },
    appendText: (path, text) => {
      files.set(path, (files.get(path) ?? '') + text);
      return Promise.resolve();
    },
    listFiles: (dir, filter = () => true) => {
      const prefix = folder(dir);
      const names = [...files.keys()]
        .filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
        .map((path) => path.slice(prefix.length))
        .filter(filter);
      return Promise.resolve(names.sort());
    },
    makeDir: () => Promise.resolve(),
    git: (...args) => {
      const answer = gitAnswers[args.join(' ')];
      return answer === undefined
        ? Promise.reject(new Error(`git ${args.join(' ')} failed: not a git repository`))
        : Promise.resolve(answer);
    },
    runNode: (script, args) => {
      ran.push([script, ...args].join(' '));
      return Promise.resolve(options.exitCodes?.[script] ?? 0);
    },
    env: (name) => options.env?.[name],
    now: () => options.now ?? new Date(Date.UTC(2026, 0, 1)),
    out: (line) => void (outLines.push(line), printed.push(line)),
    err: (line) => void (errLines.push(line), printed.push(line)),
  };
}
