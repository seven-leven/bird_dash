/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { areaOf, AREAS, formatAreasConsole, formatAreasMarkdown, summarizeAreas } from './areas.ts';
import type { TestCase } from './junit.ts';
import type { FileCoverage } from './coverage.ts';

const test = (file: string, failure?: string): TestCase => ({
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

Deno.test('areaOf places a file by its path, whatever the slashes', () => {
  assertEquals(areaOf('src/lib/formatCount.ts')?.id, 'data');
  assertEquals(areaOf('src\\stores\\ui.ts')?.id, 'state');
  assertEquals(areaOf('./src/composables/ui/useLightBox.ts')?.id, 'interface');
  assertEquals(areaOf('script/pipeline/plan.ts')?.id, 'pipeline');
  assertEquals(areaOf('script/changelog.ts')?.id, 'release');
  assertEquals(areaOf('script/test.ts')?.id, 'tooling');
  assertEquals(areaOf('somewhere/else.ts'), undefined);
});

Deno.test('area ids are unique and every area claims at least one path', () => {
  assertEquals(new Set(AREAS.map((a) => a.id)).size, AREAS.length);
  for (const a of AREAS) assert(a.paths.length > 0 && a.protects.length > 0, a.id);
});

Deno.test('summarizeAreas counts tests and failures per area', () => {
  const rows = summarizeAreas([
    test('src/lib/a_test.ts'),
    test('src/lib/a_test.ts', 'boom'),
    test('src/lib/b_test.ts'),
    test('script/pipeline/plan_test.ts'),
  ]);
  const data = rows.find((r) => r.area.id === 'data')!;
  assertEquals([data.files, data.tests, data.failed], [2, 3, 1]);
  assertEquals(rows.find((r) => r.area.id === 'pipeline')!.tests, 1);
  assertEquals(rows.find((r) => r.area.id === 'state')!.tests, 0);
  assertEquals(data.lines, undefined, 'no coverage was given');
});

Deno.test('summarizeAreas adds coverage per area and lists files no test loaded', () => {
  const rows = summarizeAreas([test('src/lib/a_test.ts')], {
    coverage: [
      cov('src/lib/a.ts', 8, 10),
      cov('src/lib/b.ts', 10, 10),
      cov('src/stores/ui.ts', 1, 4),
    ],
    sources: ['src/lib/a.ts', 'src/lib/b.ts', 'src/lib/never.ts', 'src/stores/ui.ts'],
  });
  const data = rows.find((r) => r.area.id === 'data')!;
  assertEquals(data.lines, { hit: 18, found: 20 });
  assertEquals(data.unloaded, ['src/lib/never.ts']);
  assertEquals(rows.find((r) => r.area.id === 'state')!.lines, { hit: 1, found: 4 });
  assertEquals(rows.find((r) => r.area.id === 'release')!.lines, { hit: 0, found: 0 });
});

Deno.test('the console table shows coverage columns only when coverage was measured', () => {
  const plain = formatAreasConsole(summarizeAreas([test('src/lib/a_test.ts')]));
  assert(!plain.includes('lines'));
  assertStringIncludes(plain, '– no tests'); // areas with nothing are called out

  const withCov = formatAreasConsole(
    summarizeAreas([test('src/lib/a_test.ts', 'x')], {
      coverage: [cov('src/lib/a.ts', 9, 10)],
      sources: ['src/lib/a.ts', 'src/lib/never.ts'],
    }),
  );
  assertStringIncludes(withCov, 'untested files');
  assertStringIncludes(withCov, '90.0%');
  assertStringIncludes(withCov, '✗ 1 failed');
});

Deno.test('the markdown report names what each area protects and lists unloaded files', () => {
  const md = formatAreasMarkdown(
    summarizeAreas([test('src/lib/a_test.ts')], {
      coverage: [cov('src/lib/a.ts', 9, 10)],
      sources: ['src/lib/a.ts', 'script/build.ts'],
    }),
  );
  assertStringIncludes(md, '### By area');
  assertStringIncludes(md, AREAS[0].protects);
  assertStringIncludes(md, '1 source file(s) no test imports');
  assertStringIncludes(md, '`script/build.ts`');
  assertStringIncludes(md, '⚠️ no tests');
});
