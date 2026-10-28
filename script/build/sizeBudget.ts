// The site's size budget (docs/plans/PLATFORM.md, phase 3): the build prints what a visitor
// downloads and fails when it grows past what is written here. JavaScript and CSS are
// measured gzipped, as GitHub Pages sends them; images as they are, already compressed.
import { glob, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';
import { MARK } from '../lib/cli.ts';

/** A limit on some of the built files: on their total, or on each one. */
export interface Budget {
  label: string;
  /** Which files, by their path in dist/ (posix). */
  match: RegExp;
  gzip: boolean;
  limit: number;
  per: 'total' | 'file';
}

/** Raise a limit only on purpose, in the same pull request as what made it grow. */
export const BUDGETS: Budget[] = [
  {
    label: 'JavaScript, gzipped',
    match: /^assets\/.*\.js$/,
    gzip: true,
    limit: 70_000,
    per: 'total',
  },
  { label: 'CSS, gzipped', match: /^assets\/.*\.css$/, gzip: true, limit: 15_000, per: 'total' },
  { label: 'a full drawing', match: /^full\//, gzip: false, limit: 400_000, per: 'file' },
  { label: 'a thumbnail', match: /^thumb\//, gzip: false, limit: 60_000, per: 'file' },
];

/** A built file: its path in dist/ and its size, as stored and gzipped. */
export interface BuiltFile {
  path: string;
  size: number;
  gzipped: number;
}

const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;

/** One line per budget, and the ones that are over. */
export function judgeBudgets(
  files: BuiltFile[],
  budgets: Budget[] = BUDGETS,
): { lines: string[]; over: string[] } {
  const lines: string[] = [];
  const over: string[] = [];
  for (const budget of budgets) {
    const sizes = files.filter((file) => budget.match.test(file.path))
      .map((file) => ({ path: file.path, bytes: budget.gzip ? file.gzipped : file.size }));
    const measured = budget.per === 'total'
      ? sizes.reduce((sum, file) => sum + file.bytes, 0)
      : Math.max(0, ...sizes.map((file) => file.bytes));
    const what = budget.per === 'total' ? budget.label : `largest ${budget.label}`;
    const ok = measured <= budget.limit;
    lines.push(
      `  ${ok ? MARK.done : MARK.problem} ${what}: ${kb(measured)} of ${kb(budget.limit)}`,
    );
    if (!ok) {
      const biggest = sizes.toSorted((a, b) => b.bytes - a.bytes)[0]!; // over budget: not empty
      over.push(
        budget.per === 'total'
          ? `${what} is ${kb(measured)}`
          : `${biggest.path} is ${kb(measured)}`,
      );
    }
  }
  return { lines, over };
}

/** Every file under `dir`, with its path relative to it and its sizes. */
export async function measureFiles(dir: string): Promise<BuiltFile[]> {
  const files: BuiltFile[] = [];
  for await (const entry of glob('**/*', { cwd: dir, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = resolve(dir, entry.parentPath, entry.name);
    const bytes = await readFile(full);
    const path = relative(dir, full).replaceAll('\\', '/');
    files.push({ path, size: bytes.length, gzipped: gzipSync(bytes, { level: 9 }).length });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/** The Vite plugin: after a build, judge dist/ against the budget; over it, the build fails. */
export function sizeBudget(budgets: Budget[] = BUDGETS): Plugin {
  let outDir = '';
  return {
    name: 'size-budget',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const { lines, over } = judgeBudgets(await measureFiles(outDir), budgets);
      console.log(`\n  Size budget (script/build/sizeBudget.ts)\n${lines.join('\n')}`);
      if (over.length > 0) {
        throw new Error(`over the size budget: ${over.join('; ')}`);
      }
    },
  };
}
