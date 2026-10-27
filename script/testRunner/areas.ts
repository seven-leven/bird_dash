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
import { findFiles, repoPath } from './tiers.ts';
import { formatPercent } from './coverage.ts';

export interface Area {
  id: string;
  label: string;
  /** What breaks for a visitor or for you if this area is wrong. */
  protects: string;
  /**
   * Repo-relative path prefixes. The longest prefix that matches a path wins, so an
   * area can claim a file out of a folder another area owns (the icons in src/lib/).
   */
  paths: string[];
}

export const AREAS: Area[] = [
  {
    id: 'data',
    label: 'Site: data and search',
    protects: 'loading collections, filtering, grouping, search results',
    paths: ['src/domain/', 'src/lib/', 'src/composables/collection/', 'src/composables/search/'],
  },
  {
    id: 'state',
    label: 'Site: state and routing',
    protects: 'the stores, shareable links, the pages, theme, accent',
    paths: ['src/stores/', 'src/composables/core/', 'src/pages'], // pages.ts and its test,
  },
  {
    id: 'interface',
    label: 'Site: viewer and interface',
    protects: 'the lightbox, scroll-spy, icons and logo',
    paths: [
      'src/composables/ui/',
      'src/components/',
      'src/styles/',
      'src/lib/icons',
      'src/lib/logo',
    ],
  },
  {
    id: 'journeys',
    label: 'Site: journeys',
    protects: 'a whole visit: first load, collections, views, search, the viewer, links, failures',
    paths: ['src/journeys/', 'src/App.vue'],
  },
  {
    id: 'pipeline',
    label: 'Asset pipeline and data files',
    protects: 'image builds, the integrity check, the files in public/',
    paths: [
      'script/ingest/',
      'script/check/',
      'script/build/',
      'script/lib/',
      // The generated files the site serves; the rest of generate/ is the docs' images.
      'script/generate/stats',
      'script/generate/placeholders',
    ],
  },
  {
    id: 'release',
    label: 'Version and changelog',
    protects: 'the version in the footer, the changelog task',
    paths: ['script/version/', 'script/changelog/'],
  },
  {
    id: 'tooling',
    label: 'Test harness and docs tooling',
    protects:
      'the test runner, the test kit and its reports, generated guide images, the docs site',
    paths: ['script/testRunner/', 'script/generate/', 'script/docs/', 'src/testing/'],
  },
];

/** The area a repo-relative path belongs to, or undefined if none claims it. */
export function areaOf(path: string): Area | undefined {
  const p = repoPath(path);
  let best: { area: Area; length: number } | undefined;
  for (const area of AREAS) {
    for (const prefix of area.paths) {
      if (p.startsWith(prefix) && prefix.length > (best?.length ?? 0)) {
        best = { area, length: prefix.length };
      }
    }
  }
  return best?.area;
}

/**
 * Source files that could be tested: every `.ts` and `.vue` under the roots except tests,
 * test helpers, type declarations, type-only modules and the entry point. A component no
 * test loads is reported like a module no test imports.
 */
export async function discoverSources(roots = ['src', 'script']): Promise<string[]> {
  const skip = (path: string) =>
    path.endsWith('_test.ts') || path.endsWith('.d.ts') ||
    path.startsWith('src/testing/') || path.startsWith('src/types/') ||
    path === 'src/main.ts'; // only mounts App.vue into the page
  const files = [...await findFiles(roots, '*.ts'), ...await findFiles(roots, '*.vue')];
  return files.filter((path) => !skip(path)).sort();
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
  const loaded = new Set((opts.coverage ?? []).map((f) => repoPath(f.file)));
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
      ? (opts.sources ?? []).filter((s) => areaOf(s)?.id === area.id && !loaded.has(repoPath(s)))
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

/** Every source file no test imports, across all areas. The coverage run fails if there are any. */
export const untestedFiles = (rows: AreaSummary[]): string[] => rows.flatMap((r) => r.unloaded);

// `undefined` is only a type-level case: the tables call pct only when coverage was measured.
/* c8 ignore next */
const pct = (c: Counter | undefined): string => (c === undefined ? '' : formatPercent(c));

/** Terminal table: one row per area. The coverage columns appear only when measured. */
export function formatAreasText(rows: AreaSummary[]): string {
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
