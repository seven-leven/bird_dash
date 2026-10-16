/**
 * Coverage helpers for the test runner (script/test_runner/run_tests.ts): parse LCOV, total it up,
 * and format it for the terminal and the GitHub job summary.
 *
 * Vitest measures every file a test loads, `.vue` components included; which files
 * count is set in vite.config.ts (`test.coverage`).
 */

import { cp, readFile, rm } from 'node:fs/promises';

export interface Counter {
  found: number;
  hit: number;
}

export interface FileCoverage {
  file: string;
  lines: Counter;
  branches: Counter;
  functions: Counter;
}

const empty = (): Counter => ({ found: 0, hit: 0 });

/** Parse LCOV text (Vitest's `lcovonly` reporter) into per-file counters. */
export function parseLcov(text: string): FileCoverage[] {
  const files: FileCoverage[] = [];
  let current: FileCoverage | undefined;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const idx = line.indexOf(':');
    const key = idx === -1 ? line : line.slice(0, idx);
    const value = idx === -1 ? '' : line.slice(idx + 1);

    switch (key) {
      case 'SF':
        current = { file: value, lines: empty(), branches: empty(), functions: empty() };
        break;
      case 'LF':
        if (current) current.lines.found = Number(value);
        break;
      case 'LH':
        if (current) current.lines.hit = Number(value);
        break;
      case 'BRF':
        if (current) current.branches.found = Number(value);
        break;
      case 'BRH':
        if (current) current.branches.hit = Number(value);
        break;
      case 'FNF':
        if (current) current.functions.found = Number(value);
        break;
      case 'FNH':
        if (current) current.functions.hit = Number(value);
        break;
      case 'end_of_record':
        if (current) files.push(current);
        current = undefined;
        break;
    }
  }
  return files;
}

/** Percentage covered; a file with nothing to cover counts as fully covered. */
export const percent = (c: Counter): number => c.found === 0 ? 100 : (c.hit / c.found) * 100;

export function totals(files: FileCoverage[]): Omit<FileCoverage, 'file'> {
  const sum = (pick: (f: FileCoverage) => Counter): Counter =>
    files.reduce((acc, f) => ({ found: acc.found + pick(f).found, hit: acc.hit + pick(f).hit }), {
      found: 0,
      hit: 0,
    });
  return {
    lines: sum((f) => f.lines),
    branches: sum((f) => f.branches),
    functions: sum((f) => f.functions),
  };
}

const pct = (c: Counter) => percent(c).toFixed(1).padStart(5);

/**
 * Fixed-width table for the terminal, lowest line coverage first. `limit` shows only
 * the N least-covered files (the total row always covers every file).
 */
export function formatTable(files: FileCoverage[], cwd = '', limit = Infinity): string {
  const rel = (f: string) => f.replaceAll('\\', '/').replace(cwd.replaceAll('\\', '/') + '/', '');
  const rows = [...files].sort((a, b) => percent(a.lines) - percent(b.lines)).slice(0, limit);
  const width = Math.max(4, ...rows.map((r) => rel(r.file).length));
  const head = `${'File'.padEnd(width)}  ${'Lines'.padStart(6)}  ${'Branch'.padStart(6)}  ${
    'Funcs'.padStart(6)
  }`;
  const body = rows.map((r) =>
    `${rel(r.file).padEnd(width)}  ${pct(r.lines)}%  ${pct(r.branches)}%  ${pct(r.functions)}%`
  );
  const t = totals(files);
  const foot = `${'All files'.padEnd(width)}  ${pct(t.lines)}%  ${pct(t.branches)}%  ${
    pct(t.functions)
  }%`;
  return [head, '-'.repeat(head.length), ...body, '-'.repeat(head.length), foot].join('\n');
}

export function formatMarkdown(files: FileCoverage[], minLines: number, cwd = ''): string {
  const rel = (f: string) => f.replaceAll('\\', '/').replace(cwd.replaceAll('\\', '/') + '/', '');
  const t = totals(files);
  const rows = [...files].sort((a, b) => percent(a.lines) - percent(b.lines)).map((r) =>
    `| \`${rel(r.file)}\` | ${percent(r.lines).toFixed(1)}% | ${
      percent(r.branches).toFixed(1)
    }% | ${percent(r.functions).toFixed(1)}% |`
  );
  return [
    '### Coverage',
    '',
    `**${percent(t.lines).toFixed(1)}% of lines** in the files tests load (floor: ${minLines}%).`,
    '',
    `<details><summary>Per-file coverage (${files.length} files, least covered first)</summary>`,
    '',
    '| File | Lines | Branches | Functions |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
    '',
    '</details>',
    '',
  ].join('\n');
}

/** Read `--min-lines=N` from the arguments (default 0 = report only). */
export function parseMinLines(args: string[]): number {
  const arg = args.find((a) => a.startsWith('--min-lines='));
  const n = arg ? Number(arg.split('=')[1]) : 0;
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error(`invalid ${arg}`);
  return n;
}

/** The coverage arguments for `vitest run`: LCOV always, plus HTML when asked for. */
export const coverageArgs = (dir: string, html = false): string[] => [
  '--coverage.enabled',
  `--coverage.reportsDirectory=${dir}`,
  '--coverage.reporter=lcovonly',
  ...(html ? ['--coverage.reporter=html'] : []),
];

/** Per-file counters from the LCOV file a `vitest run` with `coverageArgs(dir)` left in `dir`. */
export async function readCoverage(dir: string): Promise<FileCoverage[]> {
  return parseLcov(await readFile(`${dir}/lcov.info`, 'utf8'));
}

/**
 * Copy the HTML report (from a run with `coverageArgs(dir, true)`) to `out` and
 * return the path of its index page.
 */
export async function writeHtmlCoverage(dir: string, out: string): Promise<string> {
  await rm(out, { recursive: true, force: true });
  await cp(dir, out, { recursive: true });
  return `${out}/index.html`;
}
