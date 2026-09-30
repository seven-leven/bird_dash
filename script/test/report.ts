import type { TestCase } from './junit.ts';
import { type Tier, TIER_ORDER, tierOf } from './tiers.ts';

export interface TierSummary {
  tier: Tier;
  files: number;
  tests: number;
  failed: number;
  /** Seconds, summed over the tests (parallel files overlap in wall-clock time). */
  time: number;
}

export interface Summary {
  tiers: TierSummary[];
  total: { files: number; tests: number; failed: number; time: number };
  failures: TestCase[];
  slowest: TestCase[];
}

/** Group test results by tier and pick out the failures and the slowest tests. */
export function summarize(cases: TestCase[], slowCount = 3): Summary {
  const tiers: TierSummary[] = [];
  for (const tier of TIER_ORDER) {
    const own = cases.filter((c) => tierOf(c.file) === tier);
    if (own.length === 0) continue;
    tiers.push({
      tier,
      files: new Set(own.map((c) => c.file)).size,
      tests: own.length,
      failed: own.filter((c) => c.failure !== undefined).length,
      time: own.reduce((s, c) => s + c.time, 0),
    });
  }
  const sum = (pick: (t: TierSummary) => number) => tiers.reduce((n, t) => n + pick(t), 0);
  return {
    tiers,
    total: {
      files: sum((t) => t.files),
      tests: sum((t) => t.tests),
      failed: sum((t) => t.failed),
      time: sum((t) => t.time),
    },
    failures: cases.filter((c) => c.failure !== undefined),
    slowest: [...cases].sort((a, b) => b.time - a.time).slice(0, slowCount),
  };
}

const secs = (t: number) => t < 0.05 ? `${Math.round(t * 1000)}ms` : `${t.toFixed(2)}s`;

/** The compact terminal summary: one row per tier, failures first. */
export function formatConsole(
  s: Summary,
  opts: { verbose?: boolean; cases?: TestCase[] } = {},
): string {
  const out: string[] = [];

  if (s.failures.length > 0) {
    out.push(`✗ ${s.failures.length} failing`, '');
    for (const f of s.failures) {
      out.push(
        `  ${f.file}:${f.line}`,
        `    ${f.name}`,
        `    ${(f.failure ?? '').split('\n')[0]}`,
        '',
      );
    }
  }

  const rows = s.tiers.map((t) => ({
    label: t.tier,
    files: String(t.files),
    tests: String(t.tests),
    time: secs(t.time),
    mark: t.failed > 0 ? `✗ ${t.failed} failed` : '✓',
  }));
  const width = Math.max(...rows.map((r) => r.label.length), 5);
  out.push(`${'tier'.padEnd(width)}  files  tests    time  result`);
  for (const r of rows) {
    out.push(
      `${r.label.padEnd(width)}  ${r.files.padStart(5)}  ${r.tests.padStart(5)}  ${
        r.time.padStart(6)
      }  ${r.mark}`,
    );
  }
  out.push(
    `${'total'.padEnd(width)}  ${String(s.total.files).padStart(5)}  ${
      String(s.total.tests).padStart(5)
    }  ${secs(s.total.time).padStart(6)}  ${
      s.total.failed > 0 ? `✗ ${s.total.failed} failed` : '✓ all passing'
    }`,
  );

  if (s.slowest.length > 0 && s.slowest[0].time >= 0.05) {
    out.push('', 'slowest:');
    for (const c of s.slowest.filter((c) => c.time >= 0.05)) {
      out.push(`  ${secs(c.time).padStart(6)}  ${c.file} › ${c.name}`);
    }
  }

  if (opts.verbose && opts.cases) {
    out.push('', 'files:');
    const perFile = new Map<string, { n: number; time: number; failed: number }>();
    for (const c of opts.cases) {
      const e = perFile.get(c.file) ?? { n: 0, time: 0, failed: 0 };
      e.n++;
      e.time += c.time;
      if (c.failure) e.failed++;
      perFile.set(c.file, e);
    }
    for (const [file, e] of [...perFile].sort()) {
      out.push(`  ${e.failed ? '✗' : '✓'} ${file}  ${e.n} tests  ${secs(e.time)}`);
    }
  }
  return out.join('\n');
}

/** The table shown on the GitHub Actions job summary page. */
export function formatMarkdown(s: Summary, title: string): string {
  const lines = [`### ${title}`, ''];
  lines.push(
    s.total.failed > 0
      ? `**${s.total.failed} of ${s.total.tests} tests failed.**`
      : `**All ${s.total.tests} tests passed.**`,
    '',
    '| Tier | Files | Tests | Time | Result |',
    '| --- | ---: | ---: | ---: | --- |',
  );
  for (const t of s.tiers) {
    lines.push(
      `| ${t.tier} | ${t.files} | ${t.tests} | ${secs(t.time)} | ${
        t.failed ? `❌ ${t.failed} failed` : '✅'
      } |`,
    );
  }
  if (s.failures.length > 0) {
    lines.push('', '#### Failures', '');
    for (const f of s.failures) {
      lines.push(
        `- \`${f.file}:${f.line}\` — ${f.name}`,
        `  > ${(f.failure ?? '').split('\n')[0]}`,
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}

const escapeData = (s: string) =>
  s.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
const escapeProp = (s: string) => escapeData(s).replaceAll(':', '%3A').replaceAll(',', '%2C');

/** `::error` workflow commands: GitHub shows each failure on the changed file in the PR. */
export function annotations(failures: TestCase[]): string[] {
  return failures.map((f) =>
    `::error file=${escapeProp(f.file)},line=${f.line},title=${
      escapeProp(`Test failed: ${f.name}`)
    }::${escapeData((f.failure ?? 'failed').split('\n')[0])}`
  );
}
