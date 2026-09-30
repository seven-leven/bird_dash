/// <reference lib="deno.ns" />
/**
 * script/test.ts — the test runner behind `deno task test`.
 *
 *   deno task test                      every tier, compact summary
 *   deno task test unit dom             just those tiers (see script/test/tiers.ts)
 *   deno task test -- --verbose         also list every file
 *   deno task test:coverage             every tier + coverage table + line-coverage floor
 *
 * Deno's own per-test log is 150+ lines for a green run, so this runs the tests once
 * with the dot + JUnit reporters and prints one row per tier instead. On failure it
 * lists the failing tests first and then replays Deno's full output (diffs, stack
 * traces, or the type error that stopped the run). In GitHub Actions it also writes a
 * job summary, emits per-failure annotations and keeps the JUnit file in test-results/.
 */

import { discoverTests, groupByTier, isTier, type Tier, TIER_ORDER } from './test/tiers.ts';
import { parseJunit } from './test/junit.ts';
import { annotations, formatConsole, formatMarkdown, summarize } from './test/report.ts';
import {
  formatMarkdown as coverageMarkdown,
  formatTable,
  parseMinLines,
  percent,
  readCoverage,
  totals,
} from './test/coverage.ts';

export interface Options {
  tiers: Tier[];
  verbose: boolean;
  failFast: boolean;
  coverage: boolean;
  minLines: number;
}

/** Positional arguments are tier names; everything else is a flag. */
export function parseArgs(args: string[]): Options {
  const flags = args.filter((a) => a.startsWith('-'));
  const names = args.filter((a) => !a.startsWith('-'));

  const unknown = names.filter((n) => !isTier(n));
  if (unknown.length > 0) {
    throw new Error(`unknown tier "${unknown[0]}" (available: ${TIER_ORDER.join(', ')})`);
  }
  const known = new Set(['--verbose', '-v', '--fail-fast', '--coverage']);
  const bad = flags.find((f) => !known.has(f) && !f.startsWith('--min-lines='));
  if (bad) throw new Error(`unknown option ${bad}`);

  const minLines = parseMinLines(flags);
  const coverage = flags.includes('--coverage');
  if (minLines > 0 && !coverage) throw new Error('--min-lines needs --coverage');

  return {
    tiers: names.length > 0 ? TIER_ORDER.filter((t) => names.includes(t)) : [...TIER_ORDER],
    verbose: flags.includes('--verbose') || flags.includes('-v'),
    failFast: flags.includes('--fail-fast'),
    coverage,
    minLines,
  };
}

// deno-lint-ignore no-control-regex -- the ESC byte is exactly what an ANSI colour code starts with
const ANSI = /\x1b\[[0-9;]*m/g;
const decode = (b: Uint8Array) => new TextDecoder().decode(b).replace(ANSI, '');

/** Deno's dot reporter prints one "." per test on its own line when piped; drop them. */
export const withoutDots = (output: string): string =>
  output.split(/\r?\n/).filter((line) => !/^[.!]?$/.test(line.trim())).join('\n');

async function main(argv: string[]): Promise<number> {
  let opts: Options;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    console.error(`test: ${(e as Error).message}`);
    return 2;
  }

  const inCI = Deno.env.get('GITHUB_ACTIONS') === 'true';
  const groups = groupByTier(await discoverTests());
  const files = opts.tiers.flatMap((t) => groups[t]);
  if (files.length === 0) {
    console.error(`test: no test files for ${opts.tiers.join(', ')}`);
    return 2;
  }

  const work = await Deno.makeTempDir({ prefix: 'test-' });
  try {
    if (inCI) await Deno.mkdir('test-results', { recursive: true });
    const junitPath = inCI ? 'test-results/junit.xml' : `${work}/junit.xml`;
    const covDir = `${work}/coverage`;

    const run = await new Deno.Command(Deno.execPath(), {
      args: [
        'test',
        '-A',
        '--node-modules-dir',
        '--parallel',
        '--reporter=dot',
        `--junit-path=${junitPath}`,
        ...(opts.failFast ? ['--fail-fast'] : []),
        ...(opts.coverage ? [`--coverage=${covDir}`] : []),
        ...files,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    const raw = decode(run.stdout) + decode(run.stderr);
    const cases = parseJunit(await Deno.readTextFile(junitPath).catch(() => ''));
    const summary = summarize(cases);
    const tz = Deno.env.get('TZ');
    const title = `Tests${tz ? ` (TZ=${tz})` : ''} — ${opts.tiers.join(', ')}`;

    console.log(cases.length > 0 ? formatConsole(summary, { verbose: opts.verbose, cases }) : '');

    // Deno's own output holds what the summary can't: assertion diffs, stack traces,
    // or the type error that stopped the run before any test executed.
    if (!run.success) {
      if (inCI) console.log('::group::Full deno test output');
      console.log('\n' + withoutDots(raw).trim());
      if (inCI) console.log('::endgroup::');
      if (inCI) { for (const line of annotations(summary.failures)) console.log(line); }
    }

    let summaryMd = formatMarkdown(summary, title);
    let ok = run.success;

    if (opts.coverage && run.success) {
      const cov = await readCoverage(covDir);
      const actual = percent(totals(cov).lines);
      console.log('\nleast covered files:\n' + formatTable(cov, Deno.cwd(), 8));
      if (actual < opts.minLines) {
        console.error(
          `\n✗ line coverage ${actual.toFixed(1)}% is below the ${opts.minLines}% floor`,
        );
        ok = false;
      } else {
        console.log(`\n✓ line coverage ${actual.toFixed(1)}% (floor ${opts.minLines}%)`);
      }
      summaryMd += '\n' + coverageMarkdown(cov, opts.minLines, Deno.cwd());
    }

    const summaryFile = Deno.env.get('GITHUB_STEP_SUMMARY');
    if (summaryFile) await Deno.writeTextFile(summaryFile, summaryMd + '\n', { append: true });

    return ok ? 0 : 1;
  } finally {
    await Deno.remove(work, { recursive: true }).catch(() => {});
  }
}

if (import.meta.main) Deno.exit(await main(Deno.args));
