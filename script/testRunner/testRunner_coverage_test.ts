// The runner's coverage: the floors, the gaps it names, and files no test loads (testRunner.ts).
import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { runWithFakeVitest } from '../../src/testing/fakes/fakeVitest.ts';

test('coverage at or above the floor passes and reports the total', async () => {
  const run = await runWithFakeVitest(['--coverage', '--min-lines=80'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    coverage: { 'src/domain/a.ts': [10, 9] },
  });
  assertEquals(run.code, 0);
  assert(run.args.includes('--coverage.enabled'));
  assertStringIncludes(run.out, '✓ line coverage 90.0% (floor 80%)');
  // A file short of 100% is named with its gap, not lost in a rounded table.
  assertStringIncludes(run.out, 'not fully covered (1):\n  src/domain/a.ts\n    lines 9/10');
});

test('with nothing missed, the least-covered table is shown instead', async () => {
  const run = await runWithFakeVitest(['--coverage'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    coverage: { 'src/domain/a.ts': [10, 10] },
  });
  assertStringIncludes(run.out, 'least covered files');
  assert(!run.out.includes('not fully covered'));
});

test('coverage below the floor fails even when every test passes', async () => {
  const run = await runWithFakeVitest(['--coverage', '--min-lines=95'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    coverage: { 'src/domain/a.ts': [10, 9] },
  });
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '✗ line coverage 90.0% is below the 95% floor');
});

test('a source file no test loads fails the coverage run and is named', async () => {
  const run = await runWithFakeVitest(['--coverage'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    coverage: { 'src/domain/a.ts': [10, 10] },
    sources: ['src/domain/a.ts', 'src/domain/forgotten.ts'],
  });
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '1 source file(s) are not imported by any test');
  assertStringIncludes(run.out, 'src/domain/forgotten.ts');
});

test('--html points to the coverage report Vitest wrote into the results folder', async () => {
  const run = await runWithFakeVitest(['--coverage', '--html'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    coverage: { 'src/domain/a.ts': [4, 4] },
  });
  assertEquals(run.code, 0);
  assert(run.args.includes('--coverage.reporter=html'));
  assertStringIncludes(run.out, 'coverage report: results/coverage/index.html');
  assertStringIncludes(run.result('coverage/lcov.info')!, 'src/domain/a.ts');
});

const withBranches = (found: number, hit: number) =>
  `SF:src/domain/a.ts\nLF:10\nLH:10\nBRF:${found}\nBRH:${hit}\nend_of_record\n`;

test('branch coverage below its floor fails even when lines are fine', async () => {
  const run = await runWithFakeVitest(['--coverage', '--min-lines=90', '--min-branches=95'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    lcovText: withBranches(20, 18),
  });
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '✓ line coverage 100.0% (floor 90%)');
  assertStringIncludes(run.out, '✗ branch coverage 90.0% is below the 95% floor');
});

test('branch coverage at its floor passes', async () => {
  const run = await runWithFakeVitest(['--coverage', '--min-branches=90'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    lcovText: withBranches(20, 18),
  });
  assertEquals(run.code, 0);
  assertStringIncludes(run.out, '✓ branch coverage 90.0% (floor 90%)');
});

test('a narrowed coverage run does not report the files it did not load as untested', async () => {
  const run = await runWithFakeVitest(['data', '--coverage'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    coverage: { 'src/domain/a.ts': [10, 10] },
    sources: ['src/domain/a.ts', 'src/domain/never_loaded.ts'],
  });
  assertEquals(run.code, 0);
  assert(!run.out.includes('not imported by any test'));
});

test('in CI each coverage gap is marked on its file: an error below the floor, else a warning', async () => {
  const lcovText = 'SF:src/domain/a.ts\nDA:3,0\nDA:4,0\nLF:10\nLH:8\nend_of_record\n';
  const failing = await runWithFakeVitest(['--coverage', '--min-lines=100'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    lcovText,
    env: { GITHUB_ACTIONS: 'true' },
  });
  assertStringIncludes(
    failing.out,
    '::error file=src/domain/a.ts,line=3,title=Not covered by any test::lines 3–4 never run',
  );

  const reporting = await runWithFakeVitest(['--coverage'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    lcovText,
    env: { GITHUB_ACTIONS: 'true' },
  });
  assertStringIncludes(reporting.out, '::warning file=src/domain/a.ts,line=3');
});
