/// <reference lib="deno.ns" />
/**
 * script/coverage.ts — run the unit tests with coverage, print a per-file table,
 * and fail if total line coverage drops below a floor.
 *
 *   deno task test:coverage                    run with the floor set in deno.jsonc
 *   deno run -A script/coverage.ts --min-lines=60
 *
 * Only `.ts` sources are measured: Deno cannot load `.vue` files, so component
 * behaviour is covered by the browser (E2E) tests rather than this number.
 * In GitHub Actions the table is also written to the job summary.
 */

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

/** Parse LCOV text (the format `deno coverage --lcov` prints) into per-file counters. */
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

/** Fixed-width table for the terminal, lowest line coverage first. */
export function formatTable(files: FileCoverage[], cwd = ''): string {
  const rel = (f: string) => f.replaceAll('\\', '/').replace(cwd.replaceAll('\\', '/') + '/', '');
  const rows = [...files].sort((a, b) => percent(a.lines) - percent(b.lines));
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
    '### Unit test coverage',
    '',
    `**${
      percent(t.lines).toFixed(1)
    }% of lines** (floor: ${minLines}%). \`.vue\` files are not measured.`,
    '',
    '| File | Lines | Branches | Functions |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
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

async function run(args: string[], capture: boolean) {
  return await new Deno.Command(Deno.execPath(), {
    args,
    stdout: capture ? 'piped' : 'inherit',
    stderr: 'inherit',
  }).output();
}

if (import.meta.main) {
  const minLines = parseMinLines(Deno.args);
  const dir = await Deno.makeTempDir({ prefix: 'coverage-' });

  try {
    const test = await run(
      ['test', '-A', '--node-modules-dir', `--coverage=${dir}`, 'src/', 'script/'],
      false,
    );
    if (!test.success) Deno.exit(test.code || 1);

    const report = await run([
      'coverage',
      dir,
      '--lcov',
      '--include=^file:.*/(src|script)/',
      '--exclude=_test\\.ts|/test/|\\.d\\.ts',
    ], true);
    if (!report.success) throw new Error('deno coverage failed');

    const files = parseLcov(new TextDecoder().decode(report.stdout));
    const cwd = Deno.cwd();
    console.log('\n' + formatTable(files, cwd) + '\n');

    const summary = Deno.env.get('GITHUB_STEP_SUMMARY');
    if (summary) {
      await Deno.writeTextFile(summary, formatMarkdown(files, minLines, cwd), { append: true });
    }

    const actual = percent(totals(files).lines);
    if (actual < minLines) {
      console.error(`Line coverage ${actual.toFixed(1)}% is below the ${minLines}% floor.\n`);
      Deno.exit(1);
    }
    console.log(`Line coverage ${actual.toFixed(1)}% (floor ${minLines}%).`);
  } finally {
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
}
