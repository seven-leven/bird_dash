import { test, vi } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { main, parseArgs, type RunnerDeps, withoutDots } from './run_tests.ts';

test('no arguments means every tier, in order', () => {
  const o = parseArgs([]);
  assertEquals(o.tiers, ['unit', 'dom', 'prop', 'contract']);
  assertEquals([o.verbose, o.failFast, o.coverage, o.minLines], [false, false, false, 0]);
});

test('tier names select tiers (in canonical order, whatever order they were typed)', () => {
  assertEquals(parseArgs(['prop', 'unit']).tiers, ['unit', 'prop']);
});

test('flags are parsed', () => {
  const o = parseArgs(['dom', '-v', '--fail-fast', '--coverage', '--min-lines=70']);
  assertEquals([o.verbose, o.failFast, o.coverage, o.minLines], [true, true, true, 70]);
});

test('unknown tiers and options are rejected with a helpful message', () => {
  assertThrows(() => parseArgs(['e2e']), Error, 'available: unit, dom, prop, contract');
  assertThrows(() => parseArgs(['--nope']), Error, 'unknown option --nope');
});

test('a coverage floor without --coverage is an error, not silently ignored', () => {
  assertThrows(() => parseArgs(['--min-lines=50']), Error, '--min-lines needs --coverage');
  assertThrows(() => parseArgs(['--min-branches=50']), Error, '--min-branches needs --coverage');
});

test("withoutDots drops the dot reporter's progress lines and keeps the rest", () => {
  const raw = ' RUN  v5\n·····x··*·-·\n\n FAIL  a_test.ts > boom\nAssertionError: bad\n··\n';
  assertEquals(withoutDots(raw), ' RUN  v5\n FAIL  a_test.ts > boom\nAssertionError: bad');
});

test('--report asks for the saved report; it is off by default', () => {
  assertEquals(parseArgs([]).report, false);
  assertEquals(parseArgs(['--coverage', '--report']).report, true);
});

test('a bare "--" separator is ignored, so both ways of passing flags work', () => {
  assertEquals(parseArgs(['--', '--verbose']).verbose, true);
  assertEquals(parseArgs(['unit', '--', '--fail-fast']).tiers, ['unit']);
});

test('--html asks for the HTML coverage report and needs --coverage', () => {
  assertEquals(parseArgs([]).html, false);
  assertEquals(parseArgs(['--coverage', '--html']).html, true);
  assertThrows(() => parseArgs(['--html']), Error, '--html needs --coverage');
});

// ── main, with a fake Vitest ────────────────────────────────────────────────────

/** A test result for the fake JUnit file: file, name and, when it failed, the message. */
type Case = [file: string, name: string, failure?: string];

const junit = (cases: Case[]) =>
  `<testsuites>${
    cases.map(([file, name, failure]) =>
      `<testcase classname="${file}" name="${name}" time="0.01">${
        failure ? `<failure message="${failure}"/>` : ''
      }</testcase>`
    ).join('')
  }</testsuites>`;

const lcov = (files: Record<string, [found: number, hit: number]>) =>
  Object.entries(files).map(([file, [found, hit]]) =>
    `SF:${file}\nLF:${found}\nLH:${hit}\nend_of_record\n`
  ).join('');

interface Run {
  code: number;
  out: string;
  /** The arguments main passed to Vitest. */
  args: string[];
  resultsDir: string;
}

/**
 * Run `main` against a fake Vitest that writes the given JUnit (and LCOV, when asked for
 * coverage) where main told it to, with console output captured and a temporary results folder.
 */
async function runMain(argv: string[], opts: {
  cases?: Case[];
  coverage?: Record<string, [number, number]>;
  sources?: string[];
  success?: boolean;
  env?: Record<string, string>;
  tests?: string[];
  /** Raw LCOV, used instead of `coverage` (for branch counters). */
  lcovText?: string;
  /** Vitest died before writing its JUnit file. */
  crashed?: boolean;
} = {}): Promise<Run> {
  const resultsDir = await mkdtemp(join(tmpdir(), 'bird_dash_runner_'));
  const lines: string[] = [];
  const capture = (...args: unknown[]) => lines.push(args.join(' '));
  const log = vi.spyOn(console, 'log').mockImplementation(capture);
  const error = vi.spyOn(console, 'error').mockImplementation(capture);
  let args: string[] = [];
  const deps: RunnerDeps = {
    discoverTests: async () => opts.tests ?? ['src/lib/a_test.ts', 'src/lib/b_dom_test.ts'],
    discoverSources: async () =>
      opts.sources ?? (opts.lcovText ? ['src/lib/a.ts'] : Object.keys(opts.coverage ?? {})),
    vitest: async (given) => {
      args = given;
      const value = (flag: string) => given.find((a) => a.startsWith(flag))?.slice(flag.length);
      if (!opts.crashed) await writeFile(value('--outputFile.junit=')!, junit(opts.cases ?? []));
      const covDir = value('--coverage.reportsDirectory=');
      if (covDir) {
        await mkdir(covDir, { recursive: true });
        await writeFile(`${covDir}/lcov.info`, opts.lcovText ?? lcov(opts.coverage ?? {}));
      }
      return { success: opts.success ?? true, output: ' RUN  v5\n···x\n FAIL  boom detail' };
    },
    env: opts.env ?? {},
    resultsDir,
  };
  try {
    const code = await main(argv, deps);
    return { code, out: lines.join('\n'), args, resultsDir };
  } finally {
    log.mockRestore();
    error.mockRestore();
  }
}

const cleanUp = (run: Run) => rm(run.resultsDir, { recursive: true, force: true });

test('main: bad arguments exit 2 before anything runs', async () => {
  const run = await runMain(['e2e']);
  await cleanUp(run);
  assertEquals(run.code, 2);
  assertStringIncludes(run.out, 'unknown tier "e2e"');
  assertEquals(run.args, []);
});

test('main: a tier with no test files exits 2', async () => {
  const run = await runMain(['prop']);
  await cleanUp(run);
  assertEquals(run.code, 2);
  assertStringIncludes(run.out, 'no test files for prop');
});

test('main: a green run exits 0, runs only the chosen tier and prints its tables', async () => {
  const run = await runMain(['unit'], { cases: [['src/lib/a_test.ts', 'adds']] });
  await cleanUp(run);
  assertEquals(run.code, 0);
  assertEquals(run.args.at(-1), 'src/lib/a_test.ts'); // the dom file is not passed
  assert(run.args.includes('--reporter=junit'));
  assertStringIncludes(run.out, '✓ all passing');
  assertStringIncludes(run.out, 'Site: data and search');
  assert(!run.out.includes('FAIL  boom detail'), "Vitest's own output is shown only on failure");
});

test("main: a failing run exits 1, lists the failure and replays Vitest's output", async () => {
  const run = await runMain(['--fail-fast'], {
    cases: [['src/lib/a_test.ts', 'adds', 'expected 2'], ['src/lib/b_dom_test.ts', 'renders']],
    success: false,
  });
  await cleanUp(run);
  assertEquals(run.code, 1);
  assert(run.args.includes('--bail=1'));
  assertStringIncludes(run.out, '✗ 1 failing');
  assertStringIncludes(run.out, 'expected 2');
  assertStringIncludes(run.out, 'FAIL  boom detail');
  assert(!run.out.includes('···x'), 'the dot line is dropped');
});

test('main: coverage at or above the floor passes and reports the total', async () => {
  const run = await runMain(['--coverage', '--min-lines=80'], {
    cases: [['src/lib/a_test.ts', 'adds']],
    coverage: { 'src/lib/a.ts': [10, 9] },
  });
  await cleanUp(run);
  assertEquals(run.code, 0);
  assert(run.args.includes('--coverage.enabled'));
  assertStringIncludes(run.out, '✓ line coverage 90.0% (floor 80%)');
  assertStringIncludes(run.out, 'least covered files');
});

test('main: coverage below the floor fails even when every test passes', async () => {
  const run = await runMain(['--coverage', '--min-lines=95'], {
    cases: [['src/lib/a_test.ts', 'adds']],
    coverage: { 'src/lib/a.ts': [10, 9] },
  });
  await cleanUp(run);
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '✗ line coverage 90.0% is below the 95% floor');
});

test('main: a source file no test loads fails the coverage run and is named', async () => {
  const run = await runMain(['--coverage'], {
    cases: [['src/lib/a_test.ts', 'adds']],
    coverage: { 'src/lib/a.ts': [10, 10] },
    sources: ['src/lib/a.ts', 'src/lib/forgotten.ts'],
  });
  await cleanUp(run);
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '1 source file(s) are not imported by any test');
  assertStringIncludes(run.out, 'src/lib/forgotten.ts');
});

test('main: in CI it keeps the JUnit file, saves the report, annotates failures and fills the job summary', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_summary_'));
  try {
    const summary = `${dir}/summary.md`;
    const run = await runMain([], {
      cases: [['src/lib/a_test.ts', 'adds', 'expected 2']],
      success: false,
      env: { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: summary, TZ: 'UTC' },
    });
    try {
      assertEquals(run.code, 1);
      assertStringIncludes(run.out, '::group::Full vitest output');
      assertStringIncludes(run.out, '::error file=src/lib/a_test.ts,title=Test failed%3A adds');
      assertStringIncludes(await readFile(`${run.resultsDir}/junit.xml`, 'utf8'), 'adds');
      assertStringIncludes(await readFile(`${run.resultsDir}/report.md`, 'utf8'), '### By area');
      assertStringIncludes(await readFile(summary, 'utf8'), '### Tests (TZ=UTC)');
    } finally {
      await cleanUp(run);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('main: --html copies the coverage report into the results folder', async () => {
  const run = await runMain(['--coverage', '--html'], {
    cases: [['src/lib/a_test.ts', 'adds']],
    coverage: { 'src/lib/a.ts': [4, 4] },
  });
  try {
    assertEquals(run.code, 0);
    assert(run.args.includes('--coverage.reporter=html'));
    assertStringIncludes(run.out, `coverage report: ${run.resultsDir}/coverage/index.html`);
    assertStringIncludes(
      await readFile(`${run.resultsDir}/coverage/lcov.info`, 'utf8'),
      'src/lib/a.ts',
    );
  } finally {
    await cleanUp(run);
  }
});

test('main: a run that produced no results prints no tables and fails', async () => {
  const run = await runMain([], { success: false });
  await cleanUp(run);
  assertEquals(run.code, 1);
  assert(!run.out.includes('tier '), 'no tier table without results');
  assertStringIncludes(run.out, 'FAIL  boom detail');
});

test('main: --report saves the report and says where, outside CI', async () => {
  const run = await runMain(['--report'], { cases: [['src/lib/a_test.ts', 'adds']] });
  try {
    assertEquals(run.code, 0);
    assertStringIncludes(run.out, `full report: ${run.resultsDir}/report.md`);
    assertStringIncludes(
      await readFile(`${run.resultsDir}/report.md`, 'utf8'),
      'All 1 tests passed',
    );
  } finally {
    await cleanUp(run);
  }
});

test('--min-branches sets the branch floor', () => {
  assertEquals(parseArgs(['--coverage']).minBranches, 0);
  assertEquals(parseArgs(['--coverage', '--min-branches=95']).minBranches, 95);
});

/** LCOV with branch counters, for the branch-floor tests. */
const withBranches = (found: number, hit: number) =>
  `SF:src/lib/a.ts\nLF:10\nLH:10\nBRF:${found}\nBRH:${hit}\nend_of_record\n`;

test('main: branch coverage below its floor fails even when lines are fine', async () => {
  const run = await runMain(['--coverage', '--min-lines=90', '--min-branches=95'], {
    cases: [['src/lib/a_test.ts', 'adds']],
    lcovText: withBranches(20, 18),
  });
  await cleanUp(run);
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '✓ line coverage 100.0% (floor 90%)');
  assertStringIncludes(run.out, '✗ branch coverage 90.0% is below the 95% floor');
});

test('main: branch coverage at its floor passes', async () => {
  const run = await runMain(['--coverage', '--min-branches=90'], {
    cases: [['src/lib/a_test.ts', 'adds']],
    lcovText: withBranches(20, 18),
  });
  await cleanUp(run);
  assertEquals(run.code, 0);
  assertStringIncludes(run.out, '✓ branch coverage 90.0% (floor 90%)');
});

test('main: a Vitest crash that left no JUnit file fails with its output, not an error of our own', async () => {
  const run = await runMain([], { crashed: true, success: false });
  await cleanUp(run);
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, 'FAIL  boom detail');
});
