/**
 * Coverage helpers for the test runner (script/testRunner/runTests.ts): parse LCOV, total it up,
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
  /** Lines no test ran, and lines holding a branch no test took (ascending, no repeats). */
  missedLines?: number[];
  missedBranches?: number[];
}

const empty = (): Counter => ({ found: 0, hit: 0 });
/** A path made relative to `cwd`, with forward slashes; left whole when there is no `cwd`. */
const relativeTo = (cwd: string) => (file: string) => {
  const f = file.replaceAll('\\', '/');
  return cwd ? f.replace(cwd.replaceAll('\\', '/') + '/', '') : f;
};

const addLine = (list: number[], line: number) => {
  if (!list.includes(line)) list.push(line);
};

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
        current = {
          file: value,
          lines: empty(),
          branches: empty(),
          functions: empty(),
          missedLines: [],
          missedBranches: [],
        };
        break;
      // DA:<line>,<hits>
      case 'DA': {
        const [ln, hits] = value.split(',');
        if (current && Number(hits) === 0) addLine(current.missedLines!, Number(ln));
        break;
      }
      // BRDA:<line>,<block>,<branch>,<taken> — taken is "-" when the block never ran
      case 'BRDA': {
        const [ln, , , taken] = value.split(',');
        if (current && (taken === '-' || Number(taken) === 0)) {
          addLine(current.missedBranches!, Number(ln));
        }
        break;
      }
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
        if (current) {
          current.missedLines!.sort((a, b) => a - b);
          current.missedBranches!.sort((a, b) => a - b);
          files.push(current);
        }
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

/** "3–5, 9": sorted line numbers, runs collapsed. */
export function lineRanges(lines: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const start = lines[i];
    while (lines[i + 1] === lines[i] + 1) i++;
    out.push(start === lines[i] ? `${start}` : `${start}–${lines[i]}`);
  }
  return out.join(', ');
}

/**
 * Files that miss any line or branch, measured exactly (99.95% is a miss, though it
 * prints as 100.0%), worst first. `.vue` files count like any other once a test loads them.
 */
export function notFullyCovered(files: FileCoverage[]): FileCoverage[] {
  const missing = (c: Counter) => c.found - c.hit;
  return files
    .filter((f) => missing(f.lines) > 0 || missing(f.branches) > 0)
    .sort((a, b) =>
      Math.min(percent(a.lines), percent(a.branches)) -
      Math.min(percent(b.lines), percent(b.branches))
    );
}

/**
 * One block per file that misses something: the file, how much it misses, and the
 * line numbers to look at, so a dropped floor names its cause in the terminal.
 */
export function formatGaps(files: FileCoverage[], cwd = ''): string {
  const rel = relativeTo(cwd);
  return files.map((f) => {
    const parts = [`  ${rel(f.file)}`];
    if (f.lines.hit < f.lines.found) {
      parts.push(
        `    lines ${f.lines.hit}/${f.lines.found}, missed: ${lineRanges(f.missedLines ?? [])}`,
      );
    }
    if (f.branches.hit < f.branches.found) {
      parts.push(
        `    branches ${f.branches.hit}/${f.branches.found}, missed on: ${
          lineRanges(f.missedBranches ?? [])
        }`,
      );
    }
    return parts.join('\n');
  }).join('\n');
}

/**
 * Fixed-width table for the terminal, lowest line coverage first. `limit` shows only
 * the N least-covered files (the total row always covers every file).
 */
export function formatCoverageText(files: FileCoverage[], cwd = '', limit = Infinity): string {
  const rel = relativeTo(cwd);
  // Worst first by whichever measure is lower, so a file short only on branches still shows.
  const worst = (f: FileCoverage) => Math.min(percent(f.lines), percent(f.branches));
  const rows = [...files].sort((a, b) => worst(a) - worst(b)).slice(0, limit);
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

export function formatCoverageMarkdown(
  files: FileCoverage[],
  minLines: number,
  cwd = '',
  minBranches = 0,
): string {
  const rel = relativeTo(cwd);
  const t = totals(files);
  const worst = (f: FileCoverage) => Math.min(percent(f.lines), percent(f.branches));
  const rows = [...files].sort((a, b) => worst(a) - worst(b)).map((r) =>
    `| \`${rel(r.file)}\` | ${percent(r.lines).toFixed(1)}% | ${
      percent(r.branches).toFixed(1)
    }% | ${percent(r.functions).toFixed(1)}% |`
  );
  // What needs attention comes first and in the terminal's words; the full table folds away.
  const gaps = notFullyCovered(files);
  const gapLines = gaps.length > 0
    ? [`**Not fully covered (${gaps.length}):**`, '', '```', formatGaps(gaps, cwd), '```', '']
    : [];
  return [
    '### Coverage',
    '',
    `**${percent(t.lines).toFixed(1)}% of lines** (floor: ${minLines}%) and **${
      percent(t.branches).toFixed(1)
    }% of branches** (floor: ${minBranches}%) in the files tests load.`,
    '',
    ...gapLines,
    `<details><summary>Every file (${files.length}, least covered first)</summary>`,
    '',
    '| File | Lines | Branches | Functions |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
    '',
    '</details>',
    '',
  ].join('\n');
}

const escapeData = (s: string) =>
  s.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
const escapeProp = (s: string) => escapeData(s).replaceAll(':', '%3A').replaceAll(',', '%2C');

/**
 * GitHub workflow commands that mark each gap on its file in the pull request: one per
 * file, on its first missed line, listing the rest. `error` when the run fails for it
 * (below a floor), `warning` when it is only a report.
 */
export function coverageAnnotations(
  files: FileCoverage[],
  cwd = '',
  level: 'error' | 'warning' = 'warning',
): string[] {
  const rel = relativeTo(cwd);
  return files.map((f) => {
    const lines = f.missedLines ?? [];
    const branches = f.missedBranches ?? [];
    const first = Math.min(...lines, ...branches);
    const said = [
      lines.length > 0 ? `lines ${lineRanges(lines)} never run` : '',
      branches.length > 0 ? `a branch on ${lineRanges(branches)} never taken` : '',
    ].filter(Boolean).join('; ');
    return `::${level} file=${escapeProp(rel(f.file))}${
      Number.isFinite(first) ? `,line=${first}` : ''
    },title=${escapeProp('Not covered by any test')}::${escapeData(said || 'not fully covered')}`;
  });
}

/** A percentage floor, the value of `--min-lines` or `--min-branches` (absent: 0, report only). */
export function parseFloor(flag: string, value: string | undefined): number {
  const n = value === undefined ? 0 : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error(`invalid ${flag}=${value}`);
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
