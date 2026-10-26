/**
 * script/testRunner/runTests.ts — the test runner behind `npm test`.
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
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discoverTests, groupByTier, isTier, type Tier, TIER_ORDER } from './tiers.ts';
import { parseJunit } from './junit.ts';
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
  parseMinBranches,
  parseMinLines,
  percent,
  readCoverage,
  totals,
  writeHtmlCoverage,
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
  // A bare `--` (as in `npm test -- -- --verbose`) is a separator, not an option.
  args = args.filter((a) => a !== '--');
  const flags = args.filter((a) => a.startsWith('-'));
  const positional = args.filter((a) => !a.startsWith('-'));
  const names = positional.filter((n) => isTier(n));
  const areas = positional.filter((n) => AREA_IDS.includes(n));
  const paths = positional.filter(isPath).map((p) => p.replaceAll('\\', '/').replace(/^\.\//, ''));

  const unknown = positional.filter((n) => !isTier(n) && !AREA_IDS.includes(n) && !isPath(n));
  if (unknown.length > 0) {
    throw new Error(
      `unknown tier or area "${unknown[0]}" (tiers: ${TIER_ORDER.join(', ')}; areas: ${
        AREA_IDS.join(', ')
      }; or a path such as src/components)`,
    );
  }
  const known = new Set(['--verbose', '-v', '--fail-fast', '--coverage', '--report', '--html']);
  const bad = flags.find((f) =>
    !known.has(f) && !f.startsWith('--min-lines=') && !f.startsWith('--min-branches=')
  );
  if (bad) throw new Error(`unknown option ${bad}`);

  const minLines = parseMinLines(flags);
  const coverage = flags.includes('--coverage');
  if (minLines > 0 && !coverage) throw new Error('--min-lines needs --coverage');
  const minBranches = parseMinBranches(flags);
  if (minBranches > 0 && !coverage) throw new Error('--min-branches needs --coverage');
  if (flags.includes('--html') && !coverage) throw new Error('--html needs --coverage');
  // A floor is a promise about the whole suite; part of it would fail for files it skipped.
  if ((minLines > 0 || minBranches > 0) && (areas.length > 0 || paths.length > 0)) {
    throw new Error('coverage floors apply to the whole suite, not to an area or a path');
  }

  return {
    tiers: names.length > 0 ? TIER_ORDER.filter((t) => names.includes(t)) : [...TIER_ORDER],
    areas,
    paths,
    verbose: flags.includes('--verbose') || flags.includes('-v'),
    failFast: flags.includes('--fail-fast'),
    coverage,
    minLines,
    minBranches,
    report: flags.includes('--report'),
    html: flags.includes('--html'),
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

/** What the runner touches outside itself — replaceable, so `main` can be tested. */
export interface RunnerDeps {
  discoverTests: () => Promise<string[]>;
  discoverSources: () => Promise<string[]>;
  vitest: (args: string[]) => Promise<{ success: boolean; output: string }>;
  env: Record<string, string | undefined>;
  /** Where the report, the JUnit file in CI and the HTML coverage go. */
  resultsDir: string;
}

const realDeps: RunnerDeps = {
  discoverTests,
  discoverSources,
  vitest,
  env: process.env,
  resultsDir: 'test-results',
};

/** Run the tests for these arguments and return the process exit code. */
export async function main(argv: string[], deps: RunnerDeps = realDeps): Promise<number> {
  let opts: Options;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    console.error(`test: ${(e as Error).message}`);
    return 2;
  }

  const { env, resultsDir } = deps;
  const inCI = env.GITHUB_ACTIONS === 'true';
  const groups = groupByTier(await deps.discoverTests());
  const narrowed = opts.areas.length > 0 || opts.paths.length > 0;
  const wanted = (file: string) => {
    const f = file.replaceAll('\\', '/');
    return opts.areas.includes(areaOf(f)?.id ?? '') || opts.paths.some((p) => f.startsWith(p));
  };
  const files = opts.tiers.flatMap((t) => groups[t]).filter((f) => !narrowed || wanted(f));
  if (files.length === 0) {
    const what = [...opts.tiers, ...opts.areas, ...opts.paths].join(', ');
    console.error(`test: no test files for ${what}`);
    return 2;
  }

  const work = await mkdtemp(join(tmpdir(), 'test-'));
  try {
    const saveReport = inCI || opts.report;
    if (saveReport || opts.html) await mkdir(resultsDir, { recursive: true });
    const junitPath = inCI ? `${resultsDir}/junit.xml` : `${work}/junit.xml`;
    const covDir = `${work}/coverage`;

    const run = await deps.vitest([
      '--reporter=dot',
      '--reporter=junit',
      `--outputFile.junit=${junitPath}`,
      ...(opts.failFast ? ['--bail=1'] : []),
      ...(opts.coverage ? coverageArgs(covDir, opts.html) : []),
      ...files,
    ]);

    const raw = run.output;
    const cases = parseJunit(await readFile(junitPath, 'utf8').catch(() => ''));
    const summary = summarize(cases);
    const tz = env.TZ;
    const title = `Tests${tz ? ` (TZ=${tz})` : ''} — ${opts.tiers.join(', ')}`;

    console.log(cases.length > 0 ? formatTiersText(summary, { verbose: opts.verbose, cases }) : '');

    // Vitest's own output holds what the summary can't: assertion diffs, stack traces,
    // or the error that stopped a file from loading.
    if (!run.success) {
      if (inCI) console.log('::group::Full vitest output');
      console.log('\n' + toQuietOutput(raw).trim());
      if (inCI) console.log('::endgroup::');
      if (inCI) { for (const line of annotations(summary.failures)) console.log(line); }
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
    const cwd = process.cwd().replaceAll('\\', '/') + '/';
    const relative = (file: string) => file.replaceAll('\\', '/').replace(cwd, '');
    const cov = opts.coverage && run.success
      ? (await readCoverage(covDir)).map((f) => ({ ...f, file: relative(f.file) }))
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
    if (cases.length > 0) console.log('\n' + formatAreasText(shown));
    summaryMd += '\n' + formatAreasMarkdown(shown);

    if (cov) {
      const total = totals(cov);
      // Name what is missing, exactly and with line numbers, rather than a rounded table
      // where 99.95% reads as 100.0% and a .vue file short on branches sorts out of view.
      const gaps = notFullyCovered(cov);
      console.log(
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
          console.error(
            `\n✗ ${measure} coverage ${actual.toFixed(1)}% is below the ${floor}% floor`,
          );
          verdictParts.push(`${measure} coverage ${actual.toFixed(1)}% (floor ${floor}%)`);
          ok = false;
          belowFloor = true;
        } else {
          console.log(`\n✓ ${measure} coverage ${actual.toFixed(1)}% (floor ${floor}%)`);
          verdictParts.push(`${measure} coverage ${actual.toFixed(1)}%`);
        }
      }
      // Each gap marked on its file in the pull request, where it can be fixed.
      if (inCI) {
        const level = belowFloor ? 'error' : 'warning';
        for (const line of coverageAnnotations(gaps, process.cwd(), level)) console.log(line);
      }
      summaryMd += '\n' +
        formatCoverageMarkdown(cov, opts.minLines, process.cwd(), opts.minBranches);

      if (opts.html) {
        const index = await writeHtmlCoverage(covDir, `${resultsDir}/coverage`);
        console.log(`\ncoverage report: ${index}`);
      }

      // A file no test imports is invisible to the percentage above, so it gets
      // its own gate: every source file must be loaded by at least one test.
      const untested = untestedFiles(areas);
      if (untested.length > 0) {
        console.error(
          `\n✗ ${untested.length} source file(s) are not imported by any test:\n` +
            untested.map((f) => `    ${f}`).join('\n') +
            '\n  Add a test for each (docs/TEST-PROCEDURES.md, section 9).',
        );
        verdictParts.push(`${untested.length} source file(s) no test loads`);
        ok = false;
      }
    }

    const verdict = `${ok ? '✅' : '❌'} ${verdictParts.join(' · ')}`;
    console.log(`\n${verdict}`);
    summaryMd = `**${verdict}**\n\n` + summaryMd;

    const summaryFile = env.GITHUB_STEP_SUMMARY;
    if (summaryFile) await appendFile(summaryFile, summaryMd + '\n');
    if (saveReport) {
      await writeFile(`${resultsDir}/report.md`, summaryMd + '\n');
      if (!inCI) console.log(`\nfull report: ${resultsDir}/report.md`);
    }

    return ok ? 0 : 1;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
