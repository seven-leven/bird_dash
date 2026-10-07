/// <reference lib="deno.ns" />
/**
 * Areas: what part of the project a file belongs to. Tiers (tiers.ts) say *how*
 * a test runs; areas say *what* it protects. The report groups tests and
 * coverage by area, so "where are we thin?" has a one-table answer.
 *
 * Every source file and every test file must fall into exactly one area — a
 * contract test checks that, so a new folder has to be placed here.
 */
import type { TestCase } from './junit.ts';
import type { Counter, FileCoverage } from './coverage.ts';

export interface Area {
  id: string;
  label: string;
  /** What breaks for a visitor or for you if this area is wrong. */
  protects: string;
  /** Repo-relative path prefixes. The first area that matches a path wins. */
  paths: string[];
}

export const AREAS: Area[] = [
  {
    id: 'data',
    label: 'Site: data and search',
    protects: 'loading collections, filtering, grouping, search results',
    paths: ['src/lib/', 'src/composables/collection/', 'src/composables/search/'],
  },
  {
    id: 'state',
    label: 'Site: state and routing',
    protects: 'the stores, shareable links, theme, accent',
    paths: ['src/stores/', 'src/composables/core/'],
  },
  {
    id: 'interface',
    label: 'Site: viewer and interface',
    protects: 'the lightbox, scroll-spy, icons and logo',
    paths: ['src/composables/ui/', 'src/components/'],
  },
  {
    id: 'pipeline',
    label: 'Asset pipeline and data files',
    protects: 'image builds, the integrity check, the files in public/',
    paths: [
      'script/pipeline/',
      'script/image/',
      'script/collection/',
      'script/placeholders/',
      'script/lib/',
      'script/build.ts',
    ],
  },
  {
    id: 'release',
    label: 'Version and changelog',
    protects: 'the version in the footer, the changelog task',
    paths: ['script/version/', 'script/changelog'],
  },
  {
    id: 'tooling',
    label: 'Test harness and docs tooling',
    protects: 'the test runner and its reports, generated guide images',
    paths: ['script/test', 'script/docs/'],
  },
];

const posix = (path: string) => path.replaceAll('\\', '/').replace(/^\.\//, '');

/** The area a repo-relative path belongs to, or undefined if none claims it. */
export function areaOf(path: string): Area | undefined {
  const p = posix(path);
  return AREAS.find((a) => a.paths.some((prefix) => p.startsWith(prefix)));
}

/**
 * Source files that could be tested: every `.ts` under the roots except tests,
 * test helpers, type declarations, type-only modules and the entry point. (`.vue` files cannot be
 * imported by Deno, so they are outside this list and outside coverage.)
 */
export async function discoverSources(roots = ['src', 'script']): Promise<string[]> {
  const skip = (path: string) =>
    path.endsWith('_test.ts') || path.endsWith('.d.ts') ||
    path.startsWith('script/test/helpers/') || path.startsWith('src/types/') ||
    path === 'src/main.ts' || // only mounts App.vue, which Deno cannot import
    path === 'script/test.ts'; // Deno treats a file named test.ts as a test and never measures it
  const found: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name !== 'node_modules') await walk(path);
      } else if (entry.isFile && entry.name.endsWith('.ts') && !skip(path)) {
        found.push(path);
      }
    }
  };
  for (const root of roots) await walk(root);
  return found.sort();
}

export interface AreaSummary {
  area: Area;
  /** Test files and tests whose file sits in this area. */
  files: number;
  tests: number;
  failed: number;
  /** Line coverage over the area's files that a test loaded; undefined without coverage. */
  lines?: Counter;
  /** Source files in the area that no test imported, so coverage says nothing about them. */
  unloaded: string[];
}

/**
 * Group test results — and, when given, coverage and the list of source files —
 * by area. `coverage` paths must already be repo-relative.
 */
export function summarizeAreas(
  cases: TestCase[],
  opts: { coverage?: FileCoverage[]; sources?: string[] } = {},
): AreaSummary[] {
  const loaded = new Set((opts.coverage ?? []).map((f) => posix(f.file)));
  return AREAS.map((area) => {
    const own = cases.filter((c) => areaOf(c.file)?.id === area.id);
    const covered = (opts.coverage ?? []).filter((f) => areaOf(f.file)?.id === area.id);
    const lines = opts.coverage
      ? covered.reduce<Counter>(
        (acc, f) => ({ found: acc.found + f.lines.found, hit: acc.hit + f.lines.hit }),
        { found: 0, hit: 0 },
      )
      : undefined;
    const unloaded = opts.coverage
      ? (opts.sources ?? []).filter((s) => areaOf(s)?.id === area.id && !loaded.has(posix(s)))
      : [];
    return {
      area,
      files: new Set(own.map((c) => c.file)).size,
      tests: own.length,
      failed: own.filter((c) => c.failure !== undefined).length,
      lines,
      unloaded,
    };
  });
}

const pct = (c: Counter | undefined): string =>
  c === undefined ? '' : c.found === 0 ? '—' : `${((c.hit / c.found) * 100).toFixed(1)}%`;

/** Terminal table: one row per area. The coverage columns appear only when measured. */
export function formatAreasConsole(rows: AreaSummary[]): string {
  const withCoverage = rows.some((r) => r.lines !== undefined);
  const width = Math.max(4, ...rows.map((r) => r.area.label.length));
  const out = [
    `${'area'.padEnd(width)}  tests` + (withCoverage ? '  lines   untested files' : '') +
    '  result',
  ];
  for (const r of rows) {
    const result = r.failed > 0 ? `✗ ${r.failed} failed` : r.tests === 0 ? '– no tests' : '✓';
    out.push(
      `${r.area.label.padEnd(width)}  ${String(r.tests).padStart(5)}` +
        (withCoverage
          ? `  ${pct(r.lines).padStart(6)}  ${String(r.unloaded.length).padStart(14)}`
          : '') +
        `  ${result}`,
    );
  }
  return out.join('\n');
}

/** The same table for the GitHub job summary and the saved report, plus the untested files. */
export function formatAreasMarkdown(rows: AreaSummary[]): string {
  const withCoverage = rows.some((r) => r.lines !== undefined);
  const lines = ['### By area', ''];
  lines.push(
    withCoverage
      ? '| Area | Protects | Tests | Line coverage | Untested files | Result |'
      : '| Area | Protects | Tests | Result |',
    withCoverage ? '| --- | --- | ---: | ---: | ---: | --- |' : '| --- | --- | ---: | --- |',
  );
  for (const r of rows) {
    const result = r.failed > 0 ? `❌ ${r.failed} failed` : r.tests === 0 ? '⚠️ no tests' : '✅';
    lines.push(
      `| ${r.area.label} | ${r.area.protects} | ${r.tests} | ` +
        (withCoverage ? `${pct(r.lines)} | ${r.unloaded.length} | ` : '') + `${result} |`,
    );
  }
  const unloaded = rows.flatMap((r) => r.unloaded.map((f) => ({ f, area: r.area.label })));
  if (unloaded.length > 0) {
    lines.push(
      '',
      `<details><summary>${unloaded.length} source file(s) no test imports</summary>`,
      '',
      'Coverage only counts files a test loads, so these are not in the percentage at all.',
      '',
      ...unloaded.map((u) => `- \`${u.f}\` (${u.area})`),
      '',
      '</details>',
    );
  }
  lines.push('');
  return lines.join('\n');
}
