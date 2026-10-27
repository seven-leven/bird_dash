/**
 * script/testRunner/testRunner.ts — the test runner behind `npm test`.
 *
 *   npm test                            every tier, compact summary
 *   npm test -- unit dom                just those tiers (see script/testRunner/tiers.ts)
 *   npm test -- --verbose               also list every file
 *   npm run test:coverage               every tier + coverage table + line-coverage floor
 *   npm run test:report                 the same, and save the full report to test-results/report.md
 *   npm run test:html                   the same, plus an HTML coverage report in test-results/coverage/
 *
 * Vitest's own per-test log is long for a green run, so this runs the tests once
 * with the dot + JUnit reporters and prints one row per tier instead. On failure it
 * lists the failing tests first and then replays Vitest's full output (diffs, stack
 * traces, or the error that stopped a file from loading). In GitHub Actions it also writes a
 * job summary, emits per-failure annotations and keeps the JUnit file in test-results/.
 */

import { spawn } from 'node:child_process';
import { discoverTests, groupByTier, isTier, repoPath, type Tier, TIER_ORDER } from './tiers.ts';
import { parseJunit } from './junit.ts';
import { command, EXIT, parseArgs as parseCommandArgs, UsageError } from '../lib/cli.ts';
import type { Io } from '../lib/io.ts';
import { annotations, formatTiersMarkdown, formatTiersText, summarize } from './testSummary.ts';
import {
  areaOf,
  AREAS,
  discoverSources,
  formatAreasMarkdown,
  formatAreasText,
  summarizeAreas,
  untestedFiles,
} from './areas.ts';
import {
  coverageAnnotations,
  coverageArgs,
  formatCoverageMarkdown,
  formatCoverageText,
  formatGaps,
  notFullyCovered,
  parseFloor,
  percent,
  readCoverage,
  totals,
} from './coverage.ts';

export interface Options {
  tiers: Tier[];
  /** Area ids (`interface`, `data`…) and path prefixes (`src/components`) to narrow the run to. */
  areas: string[];
  paths: string[];
  verbose: boolean;
  failFast: boolean;
  coverage: boolean;
  minLines: number;
  minBranches: number;
  /** Save the markdown report to test-results/report.md (always done in CI). */
  report: boolean;
  /** Write the HTML coverage report to test-results/coverage/ (needs --coverage). */
  html: boolean;
}

const AREA_IDS = AREAS.map((a) => a.id);
/** A positional argument that names a folder or file rather than a tier or an area. */
const isPath = (arg: string) => arg.includes('/') || arg.includes('\\') || arg.endsWith('.ts');

/**
 * Positional arguments are tier names, area ids or path prefixes; everything else is
 * a flag. `npm test -- dom interface` runs the interface area's DOM tests;
 * `npm test -- src/components` runs the tests under that folder.
 */
export function parseArgs(args: string[]): Options {
  // The commands' own parser, Node's underneath (a bare `--`, as in `npm test -- --
  // --verbose`, is ignored there); `-v` is the one short flag.
  const { flags, values, words } = parseCommandArgs(
    args.map((arg) => (arg === '-v' ? '--verbose' : arg)),
    ['--verbose', '--fail-fast', '--coverage', '--report', '--html'],
    ['--min-lines', '--min-branches'],
  );
  const names = words.filter((n) => isTier(n));
  const areas = words.filter((n) => AREA_IDS.includes(n));
  const paths = words.filter(isPath).map(repoPath);

  const unknown = words.filter((n) => !isTier(n) && !AREA_IDS.includes(n) && !isPath(n));
  if (unknown.length > 0) {
    throw new UsageError(
      `unknown tier or area "${unknown[0]}" (tiers: ${TIER_ORDER.join(', ')}; areas: ${
        AREA_IDS.join(', ')
      }; or a path such as src/components)`,
    );
  }
  const minLines = parseFloor('--min-lines', values.get('--min-lines'));
  const coverage = flags.has('--coverage');
  if (minLines > 0 && !coverage) throw new UsageError('--min-lines needs --coverage');
  const minBranches = parseFloor('--min-branches', values.get('--min-branches'));
  if (minBranches > 0 && !coverage) throw new UsageError('--min-branches needs --coverage');
  if (flags.has('--html') && !coverage) throw new UsageError('--html needs --coverage');
  // A floor is a promise about the whole suite; part of it would fail for files it skipped.
  if ((minLines > 0 || minBranches > 0) && (areas.length > 0 || paths.length > 0)) {
    throw new UsageError('coverage floors apply to the whole suite, not to an area or a path');
  }

  return {
    tiers: names.length > 0 ? TIER_ORDER.filter((t) => names.includes(t)) : [...TIER_ORDER],
    areas,
    paths,
    verbose: flags.has('--verbose'),
    failFast: flags.has('--fail-fast'),
    coverage,
    minLines,
    minBranches,
    report: flags.has('--report'),
    html: flags.has('--html'),
  };
}

// eslint-disable-next-line no-control-regex -- the ESC byte is exactly what an ANSI colour code starts with
const ANSI = /\x1b\[[0-9;]*m/g;

/** The dot reporter's lines of marks say nothing the summary does not; drop them. */
export const toQuietOutput = (output: string): string =>
  output.split(/\r?\n/).filter((line) => !/^[·x*-]*$/.test(line.trim())).join('\n');

/** Run Vitest (with this Node, no shell) and collect its exit code and output. */
// Starts a real Vitest, so no test calls it; main is tested with a stand-in.
/* c8 ignore start */
function vitest(args: string[]): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', ...args], {
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('error', reject).on(
      'close',
      (code) => resolve({ success: code === 0, output: output.replace(ANSI, '') }),
    );
  });
}
/* c8 ignore stop */

/** What `main` is run with besides the Io: how it finds files and runs Vitest, and where the results go. */
export interface RunnerOptions {
  discoverTests: () => Promise<string[]>;
  discoverSources: () => Promise<string[]>;
  vitest: (args: string[]) => Promise<{ success: boolean; output: string }>;
  /** Where the JUnit file, the coverage (with the HTML report) and the saved report go. */
  resultsDir: string;
}

const realOptions: RunnerOptions = {
  discoverTests,
  discoverSources,
  vitest,
  resultsDir: 'test-results',
};

/** Run the tests for these arguments, report them, and say whether the run passed. */
async function runTheTests(args: string[], io: Io, given: Partial<RunnerOptions>): Promise<number> {
  const deps = { ...realOptions, ...given };
  const opts = parseArgs(args);
  const { resultsDir } = deps;
  const inCI = io.env('GITHUB_ACTIONS') === 'true';
  const groups = groupByTier(await deps.discoverTests());
  const narrowed = opts.areas.length > 0 || opts.paths.length > 0;
  const wanted = (file: string) => {
    const f = repoPath(file);
    return opts.areas.includes(areaOf(f)?.id ?? '') || opts.paths.some((p) => f.startsWith(p));
  };
  const files = opts.tiers.flatMap((t) => groups[t]).filter((f) => !narrowed || wanted(f));
  if (files.length === 0) {
    throw new UsageError(
      `no test files for ${[...opts.tiers, ...opts.areas, ...opts.paths].join(', ')}`,
    );
  }

  // Vitest writes its results into resultsDir, which git ignores; an empty JUnit file first, so
  // a run that dies before writing one reads as no results, not as the last run's.
  await io.makeDir(resultsDir);
  const junitPath = `${resultsDir}/junit.xml`;
  const covDir = `${resultsDir}/coverage`;
  await io.writeText(junitPath, '');

  const run = await deps.vitest([
    '--reporter=dot',
    '--reporter=junit',
    `--outputFile.junit=${junitPath}`,
    ...(opts.failFast ? ['--bail=1'] : []),
    ...(opts.coverage ? coverageArgs(covDir, opts.html) : []),
    ...files,
  ]);

  const raw = run.output;
  const cases = parseJunit(await io.readText(junitPath).catch(() => ''));
  const summary = summarize(cases);
  const tz = io.env('TZ');
  const title = `Tests${tz ? ` (TZ=${tz})` : ''} — ${opts.tiers.join(', ')}`;

  io.out(cases.length > 0 ? formatTiersText(summary, { verbose: opts.verbose, cases }) : '');

  // Vitest's own output holds what the summary can't: assertion diffs, stack traces,
  // or the error that stopped a file from loading.
  if (!run.success) {
    if (inCI) io.out('::group::Full vitest output');
    io.out('\n' + toQuietOutput(raw).trim());
    if (inCI) io.out('::endgroup::');
    if (inCI) { for (const line of annotations(summary.failures)) io.out(line); }
  }

  let summaryMd = formatTiersMarkdown(summary, title);
  let ok = run.success;
  // The verdict, built up as the run is judged: the first line of the job summary and
  // the last line in the terminal (docs/TESTING.md, "What the runner reports").
  const tests = (n: number) => `${n} test${n === 1 ? '' : 's'}`;
  const verdictParts = [
    cases.length === 0 && !run.success
      ? 'the run stopped before any test reported'
      : summary.total.failed > 0
      ? `${summary.total.failed} of ${tests(summary.total.tests)} failed`
      : `${tests(summary.total.tests)} passed`,
  ];

  // Coverage paths come back absolute; areas work on repo-relative ones.
  const cwd = repoPath(process.cwd()) + '/';
  const relative = (file: string) => repoPath(file).replace(cwd, '');
  const cov = opts.coverage && run.success
    ? (await readCoverage(io, covDir)).map((f) => ({ ...f, file: relative(f.file) }))
    : undefined;

  // The second view of the same run: by area (what is protected) rather than tier.
  // "Untested files" only means something when the whole suite ran.
  const allTiers = opts.tiers.length === TIER_ORDER.length && !narrowed;
  const areas = summarizeAreas(cases, {
    coverage: cov,
    sources: cov && allTiers ? await deps.discoverSources() : [],
  });
  // A narrowed run reports the areas it ran, not a row of "no tests" for the rest.
  const shown = narrowed ? areas.filter((a) => a.tests > 0) : areas;
  if (cases.length > 0) io.out('\n' + formatAreasText(shown));
  summaryMd += '\n' + formatAreasMarkdown(shown);

  if (cov) {
    const total = totals(cov);
    // Name what is missing, exactly and with line numbers, rather than a rounded table
    // where 99.95% reads as 100.0% and a .vue file short on branches sorts out of view.
    const gaps = notFullyCovered(cov);
    io.out(
      gaps.length > 0
        ? `\nnot fully covered (${gaps.length}):\n` + formatGaps(gaps, process.cwd())
        : '\nleast covered files:\n' + formatCoverageText(cov, process.cwd(), 8),
    );
    const floors = [
      ['line', percent(total.lines), opts.minLines],
      ['branch', percent(total.branches), opts.minBranches],
    ] as const;
    let belowFloor = false;
    for (const [measure, actual, floor] of floors) {
      if (actual < floor) {
        io.err(`\n✗ ${measure} coverage ${actual.toFixed(1)}% is below the ${floor}% floor`);
        verdictParts.push(`${measure} coverage ${actual.toFixed(1)}% (floor ${floor}%)`);
        ok = false;
        belowFloor = true;
      } else {
        io.out(`\n✓ ${measure} coverage ${actual.toFixed(1)}% (floor ${floor}%)`);
        verdictParts.push(`${measure} coverage ${actual.toFixed(1)}%`);
      }
    }
    // Each gap marked on its file in the pull request, where it can be fixed.
    if (inCI) {
      const level = belowFloor ? 'error' : 'warning';
      for (const line of coverageAnnotations(gaps, process.cwd(), level)) io.out(line);
    }
    summaryMd += '\n' +
      formatCoverageMarkdown(cov, opts.minLines, process.cwd(), opts.minBranches);

    if (opts.html) io.out(`\ncoverage report: ${covDir}/index.html`);

    // A file no test imports is invisible to the percentage above, so it gets
    // its own gate: every source file must be loaded by at least one test.
    const untested = untestedFiles(areas);
    if (untested.length > 0) {
      io.err(
        `\n✗ ${untested.length} source file(s) are not imported by any test:\n` +
          untested.map((f) => `    ${f}`).join('\n') +
          '\n  Add a test for each (docs/TEST-PROCEDURES.md, section 9).',
      );
      verdictParts.push(`${untested.length} source file(s) no test loads`);
      ok = false;
    }
  }

  const verdict = `${ok ? '✅' : '❌'} ${verdictParts.join(' · ')}`;
  io.out(`\n${verdict}`);
  summaryMd = `**${verdict}**\n\n` + summaryMd;

  const summaryFile = io.env('GITHUB_STEP_SUMMARY');
  if (summaryFile) await io.appendText(summaryFile, summaryMd + '\n');
  if (inCI || opts.report) {
    await io.writeText(`${resultsDir}/report.md`, summaryMd + '\n');
    if (!inCI) io.out(`\nfull report: ${resultsDir}/report.md`);
  }

  return ok ? EXIT.done : EXIT.problem;
}

const USAGE = `npm test [-- <tier|area|path>…] [--verbose] [--fail-fast]
           [--coverage [--min-lines=N] [--min-branches=N] [--report] [--html]]
  Runs the tests, one row per tier and per area; tiers: ${TIER_ORDER.join(', ')}.
  See docs/TESTING.md ("Running them").`;

export const main = command<Partial<RunnerOptions>>(USAGE, runTheTests);

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
