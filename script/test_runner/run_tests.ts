/**
 * script/test.ts — the test runner behind `npm test`.
 *
 *   npm test                            every tier, compact summary
 *   npm test -- unit dom                just those tiers (see script/test/tiers.ts)
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
import { discoverTests, groupByTier, isTier, type Tier, TIER_ORDER } from './test/tiers.ts';
import { parseJunit } from './test/junit.ts';
import { annotations, formatConsole, formatMarkdown, summarize } from './test/report.ts';
import {
  discoverSources,
  formatAreasConsole,
  formatAreasMarkdown,
  summarizeAreas,
  untestedFiles,
} from './test/areas.ts';
import {
  coverageArgs,
  formatMarkdown as coverageMarkdown,
  formatTable,
  parseMinLines,
  percent,
  readCoverage,
  totals,
  writeHtmlCoverage,
} from './test/coverage.ts';

export interface Options {
  tiers: Tier[];
  verbose: boolean;
  failFast: boolean;
  coverage: boolean;
  minLines: number;
  /** Save the markdown report to test-results/report.md (always done in CI). */
  report: boolean;
  /** Write the HTML coverage report to test-results/coverage/ (needs --coverage). */
  html: boolean;
}

/** Positional arguments are tier names; everything else is a flag. */
export function parseArgs(args: string[]): Options {
  // A bare `--` (as in `npm test -- -- --verbose`) is a separator, not an option.
  args = args.filter((a) => a !== '--');
  const flags = args.filter((a) => a.startsWith('-'));
  const names = args.filter((a) => !a.startsWith('-'));

  const unknown = names.filter((n) => !isTier(n));
  if (unknown.length > 0) {
    throw new Error(`unknown tier "${unknown[0]}" (available: ${TIER_ORDER.join(', ')})`);
  }
  const known = new Set(['--verbose', '-v', '--fail-fast', '--coverage', '--report', '--html']);
  const bad = flags.find((f) => !known.has(f) && !f.startsWith('--min-lines='));
  if (bad) throw new Error(`unknown option ${bad}`);

  const minLines = parseMinLines(flags);
  const coverage = flags.includes('--coverage');
  if (minLines > 0 && !coverage) throw new Error('--min-lines needs --coverage');
  if (flags.includes('--html') && !coverage) throw new Error('--html needs --coverage');

  return {
    tiers: names.length > 0 ? TIER_ORDER.filter((t) => names.includes(t)) : [...TIER_ORDER],
    verbose: flags.includes('--verbose') || flags.includes('-v'),
    failFast: flags.includes('--fail-fast'),
    coverage,
    minLines,
    report: flags.includes('--report'),
    html: flags.includes('--html'),
  };
}

// eslint-disable-next-line no-control-regex -- the ESC byte is exactly what an ANSI colour code starts with
const ANSI = /\x1b\[[0-9;]*m/g;

/** The dot reporter's lines of marks say nothing the summary does not; drop them. */
export const withoutDots = (output: string): string =>
  output.split(/\r?\n/).filter((line) => !/^[·x*-]*$/.test(line.trim())).join('\n');

/** Run Vitest (with this Node, no shell) and collect its exit code and output. */
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

async function main(argv: string[]): Promise<number> {
  let opts: Options;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    console.error(`test: ${(e as Error).message}`);
    return 2;
  }

  const inCI = process.env.GITHUB_ACTIONS === 'true';
  const groups = groupByTier(await discoverTests());
  const files = opts.tiers.flatMap((t) => groups[t]);
  if (files.length === 0) {
    console.error(`test: no test files for ${opts.tiers.join(', ')}`);
    return 2;
  }

  const work = await mkdtemp(join(tmpdir(), 'test-'));
  try {
    const saveReport = inCI || opts.report;
    if (saveReport || opts.html) await mkdir('test-results', { recursive: true });
    const junitPath = inCI ? 'test-results/junit.xml' : `${work}/junit.xml`;
    const covDir = `${work}/coverage`;

    const run = await vitest([
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
    const tz = process.env.TZ;
    const title = `Tests${tz ? ` (TZ=${tz})` : ''} — ${opts.tiers.join(', ')}`;

    console.log(cases.length > 0 ? formatConsole(summary, { verbose: opts.verbose, cases }) : '');

    // Vitest's own output holds what the summary can't: assertion diffs, stack traces,
    // or the error that stopped a file from loading.
    if (!run.success) {
      if (inCI) console.log('::group::Full vitest output');
      console.log('\n' + withoutDots(raw).trim());
      if (inCI) console.log('::endgroup::');
      if (inCI) { for (const line of annotations(summary.failures)) console.log(line); }
    }

    let summaryMd = formatMarkdown(summary, title);
    let ok = run.success;

    // Coverage paths come back absolute; areas work on repo-relative ones.
    const cwd = process.cwd().replaceAll('\\', '/') + '/';
    const relative = (file: string) => file.replaceAll('\\', '/').replace(cwd, '');
    const cov = opts.coverage && run.success
      ? (await readCoverage(covDir)).map((f) => ({ ...f, file: relative(f.file) }))
      : undefined;

    // The second view of the same run: by area (what is protected) rather than tier.
    // "Untested files" only means something when every tier ran.
    const allTiers = opts.tiers.length === TIER_ORDER.length;
    const areas = summarizeAreas(cases, {
      coverage: cov,
      sources: cov && allTiers ? await discoverSources() : [],
    });
    if (cases.length > 0) console.log('\n' + formatAreasConsole(areas));
    summaryMd += '\n' + formatAreasMarkdown(areas);

    if (cov) {
      const actual = percent(totals(cov).lines);
      console.log('\nleast covered files:\n' + formatTable(cov, process.cwd(), 8));
      if (actual < opts.minLines) {
        console.error(
          `\n✗ line coverage ${actual.toFixed(1)}% is below the ${opts.minLines}% floor`,
        );
        ok = false;
      } else {
        console.log(`\n✓ line coverage ${actual.toFixed(1)}% (floor ${opts.minLines}%)`);
      }
      summaryMd += '\n' + coverageMarkdown(cov, opts.minLines, process.cwd());

      if (opts.html) {
        const index = await writeHtmlCoverage(covDir, 'test-results/coverage');
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
        ok = false;
      }
    }

    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    if (summaryFile) await appendFile(summaryFile, summaryMd + '\n');
    if (saveReport) {
      await writeFile('test-results/report.md', summaryMd + '\n');
      if (!inCI) console.log('\nfull report: test-results/report.md');
    }

    return ok ? 0 : 1;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
