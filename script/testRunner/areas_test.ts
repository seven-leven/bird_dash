import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import {
  areaOf,
  AREAS,
  formatAreasMarkdown,
  formatAreasText,
  summarizeAreas,
  untestedFiles,
} from './areas.ts';
import type { TestCase } from './junit.ts';
import type { FileCoverage } from './coverage.ts';

const testCase = (file: string, failure?: string): TestCase => ({
  name: 't',
  file,
  line: 1,
  time: 0.01,
  failure,
});
const cov = (file: string, hit: number, found: number): FileCoverage => ({
  file,
  lines: { hit, found },
  branches: { hit: 0, found: 0 },
  functions: { hit: 0, found: 0 },
});

test('areaOf places a file by its path, whatever the slashes', () => {
  assertEquals(areaOf('src/domain/countWords.ts')?.id, 'data');
  assertEquals(areaOf('src\\shell\\layoutStore.ts')?.id, 'state');
  assertEquals(areaOf('./src/viewer/useViewer.ts')?.id, 'interface');
  assertEquals(areaOf('script/build/plan_changes.ts')?.id, 'pipeline');
  assertEquals(areaOf('script/changelog/changelog.ts')?.id, 'release');
  assertEquals(areaOf('script/testRunner/testRunner.ts')?.id, 'tooling');
  assertEquals(areaOf('somewhere/else.ts'), undefined);
});

test('area ids are unique and every area claims at least one path', () => {
  assertEquals(new Set(AREAS.map((a) => a.id)).size, AREAS.length);
  for (const a of AREAS) assert(a.paths.length > 0 && a.protects.length > 0, a.id);
});

test('summarizeAreas counts tests and failures per area', () => {
  const rows = summarizeAreas([
    testCase('src/domain/a_test.ts'),
    testCase('src/domain/a_test.ts', 'boom'),
    testCase('src/domain/b_test.ts'),
    testCase('script/build/plan_test.ts'),
  ]);
  const data = rows.find((r) => r.area.id === 'data')!;
  assertEquals([data.files, data.tests, data.failed], [2, 3, 1]);
  assertEquals(rows.find((r) => r.area.id === 'pipeline')!.tests, 1);
  assertEquals(rows.find((r) => r.area.id === 'state')!.tests, 0);
  assertEquals(data.lines, undefined, 'no coverage was given');
});

test('summarizeAreas adds coverage per area and lists files no test loaded', () => {
  const rows = summarizeAreas([testCase('src/domain/a_test.ts')], {
    coverage: [
      cov('src/domain/a.ts', 8, 10),
      cov('src/domain/b.ts', 10, 10),
      cov('src/shell/layoutStore.ts', 1, 4),
    ],
    sources: [
      'src/domain/a.ts',
      'src/domain/b.ts',
      'src/domain/never.ts',
      'src/shell/layoutStore.ts',
    ],
  });
  const data = rows.find((r) => r.area.id === 'data')!;
  assertEquals(data.lines, { hit: 18, found: 20 });
  assertEquals(data.unloaded, ['src/domain/never.ts']);
  assertEquals(rows.find((r) => r.area.id === 'state')!.lines, { hit: 1, found: 4 });
  assertEquals(rows.find((r) => r.area.id === 'release')!.lines, { hit: 0, found: 0 });
});

test('the console table shows coverage columns only when coverage was measured', () => {
  const plain = formatAreasText(summarizeAreas([testCase('src/domain/a_test.ts')]));
  assert(!plain.includes('lines'));
  assertStringIncludes(plain, '– no tests'); // areas with nothing are called out

  const withCov = formatAreasText(
    summarizeAreas([testCase('src/domain/a_test.ts', 'x')], {
      coverage: [cov('src/domain/a.ts', 9, 10)],
      sources: ['src/domain/a.ts', 'src/domain/never.ts'],
    }),
  );
  assertStringIncludes(withCov, 'untested files');
  assertStringIncludes(withCov, '90.0%');
  assertStringIncludes(withCov, '✗ 1 failed');
});

test('the markdown report names what each area protects and lists unloaded files', () => {
  const md = formatAreasMarkdown(
    summarizeAreas([testCase('src/domain/a_test.ts')], {
      coverage: [cov('src/domain/a.ts', 9, 10)],
      sources: ['src/domain/a.ts', 'script/build/build.ts'],
    }),
  );
  assertStringIncludes(md, '### By area');
  assertStringIncludes(md, AREAS[0].protects);
  assertStringIncludes(md, '1 source file(s) no test imports');
  assertStringIncludes(md, '`script/build/build.ts`');
  assertStringIncludes(md, '⚠️ no tests');
});

test('untestedFiles gathers the unloaded files of every area; empty when all are loaded', () => {
  const some = summarizeAreas([], {
    coverage: [cov('src/domain/a.ts', 1, 1)],
    sources: ['src/domain/a.ts', 'src/domain/never.ts', 'script/build/build.ts'],
  });
  assertEquals(untestedFiles(some).sort(), ['script/build/build.ts', 'src/domain/never.ts']);

  const none = summarizeAreas([], {
    coverage: [cov('src/domain/a.ts', 1, 1)],
    sources: ['src/domain/a.ts'],
  });
  assertEquals(untestedFiles(none), []);
});

test('with coverage but no source list, nothing is reported unloaded', () => {
  const rows = summarizeAreas([testCase('src/domain/a_test.ts')], {
    coverage: [cov('src/domain/a.ts', 0, 0)],
  });
  assertEquals(untestedFiles(rows), []);
  // An area whose loaded files have no lines shows a dash, not 0% or NaN.
  assertStringIncludes(formatAreasText(rows), '—');
});

test('the longest matching prefix wins: the generated data files are pipeline, the rest of generate/ tooling', () => {
  assertEquals(areaOf('script/generate/stats.ts')?.id, 'pipeline');
  assertEquals(areaOf('script/generate/stats_test.ts')?.id, 'pipeline');
  assertEquals(areaOf('script/generate/logo.ts')?.id, 'tooling');
});
