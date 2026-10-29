import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { toQuietOutput } from './testRunner.ts';
import { runWithFakeVitest } from '../../src/testing/fakes/fakeVitest.ts';

test("toQuietOutput drops the dot reporter's progress lines and keeps the rest", () => {
  const raw = ' RUN  v5\n·····x··*·-·\n\n FAIL  a_test.ts > boom\nAssertionError: bad\n··\n';
  assertEquals(toQuietOutput(raw), ' RUN  v5\n FAIL  a_test.ts > boom\nAssertionError: bad');
});

// ── main, with a fake Vitest ────────────────────────────────────────────────────

/** A test result for the fake JUnit file: file, name and, when it failed, the message. */
test('bad arguments exit 2 before anything runs', async () => {
  const run = await runWithFakeVitest(['e2e']);
  assertEquals(run.code, 2);
  assertStringIncludes(run.out, 'unknown tier or area "e2e"');
  assertEquals(run.args, []);
});

test('a tier with no test files exits 2', async () => {
  const run = await runWithFakeVitest(['prop']);
  assertEquals(run.code, 2);
  assertStringIncludes(run.out, 'no test files for prop');
});

test('a green run exits 0, runs only the chosen tier and prints its tables', async () => {
  const run = await runWithFakeVitest(['unit'], { cases: [['src/domain/a_test.ts', 'adds']] });
  assertEquals(run.code, 0);
  assertEquals(run.args.at(-1), 'src/domain/a_test.ts'); // the dom file is not passed
  assert(run.args.includes('--reporter=junit'));
  assertStringIncludes(run.out, '✓ all passing');
  assertStringIncludes(run.out, 'Site: data and search');
  assert(!run.out.includes('FAIL  boom detail'), "Vitest's own output is shown only on failure");
});

test("a failing run exits 1, lists the failure and replays Vitest's output", async () => {
  const run = await runWithFakeVitest(['--fail-fast'], {
    cases: [['src/domain/a_test.ts', 'adds', 'expected 2'], [
      'src/domain/b_dom_test.ts',
      'renders',
    ]],
    success: false,
  });
  assertEquals(run.code, 1);
  assert(run.args.includes('--bail=1'));
  assertStringIncludes(run.out, '✗ 1 failing');
  assertStringIncludes(run.out, 'expected 2');
  assertStringIncludes(run.out, 'FAIL  boom detail');
  assert(!run.out.includes('···x'), 'the dot line is dropped');
});

test('in CI it keeps the JUnit file, saves the report, annotates failures and fills the job summary', async () => {
  const run = await runWithFakeVitest([], {
    cases: [['src/domain/a_test.ts', 'adds', 'expected 2']],
    success: false,
    env: { GITHUB_ACTIONS: 'true', GITHUB_STEP_SUMMARY: 'summary.md', TZ: 'UTC' },
  });
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, '::group::Full vitest output');
  assertStringIncludes(run.out, '::error file=src/domain/a_test.ts,title=Test failed%3A adds');
  assertStringIncludes(run.result('junit.xml')!, 'adds');
  assertStringIncludes(run.result('report.md')!, '### By area');
  assertStringIncludes(run.result('report.md')!, '### By area and tier');
  const md = run.file('summary.md')!;
  assertStringIncludes(md, '### Tests (TZ=UTC)');
  // The verdict comes first, before any table.
  assert(md.startsWith('**❌ 1 of 1 test failed**'), md.slice(0, 60));
  assertStringIncludes(run.out, '❌ 1 of 1 test failed');
});

test('a run that produced no results prints no tables and fails', async () => {
  const run = await runWithFakeVitest([], { success: false });
  assertEquals(run.code, 1);
  assert(!run.out.includes('tier '), 'no tier table without results');
  assertStringIncludes(run.out, 'FAIL  boom detail');
});

test('--report saves the report and says where, outside CI', async () => {
  const run = await runWithFakeVitest(['--report'], { cases: [['src/domain/a_test.ts', 'adds']] });
  assertEquals(run.code, 0);
  assertStringIncludes(run.out, 'full report: results/report.md');
  assertStringIncludes(run.result('report.md')!, 'All 1 tests passed');
});

test('a Vitest crash that left no JUnit file fails with its output, not an error of our own', async () => {
  const run = await runWithFakeVitest([], { crashed: true, success: false });
  assertEquals(run.code, 1);
  assertStringIncludes(run.out, 'FAIL  boom detail');
});

test('an area or a path narrows the run to its test files', async () => {
  const tests = ['src/domain/a_test.ts', 'src/ui/x/b_dom_test.ts', 'script/lib/c_test.ts'];
  const byArea = await runWithFakeVitest(['interface'], {
    tests,
    cases: [['src/ui/x/b_dom_test.ts', 'draws']],
  });
  // Only the area that ran is reported; the others would only say "no tests". No grid: its
  // gaps would be the ones the narrowing made.
  assertStringIncludes(byArea.out, 'Site: viewer and interface');
  assert(!byArea.out.includes('Site: data and search'));
  assert(!byArea.out.includes('journey   prop'));
  assertEquals(byArea.args.filter((a) => a.endsWith('_test.ts')), [
    'src/ui/x/b_dom_test.ts',
  ]);

  const byPath = await runWithFakeVitest(['script/lib'], { tests });
  assertEquals(byPath.args.filter((a) => a.endsWith('_test.ts')), ['script/lib/c_test.ts']);
});

test('a narrowed run with no matching files exits 2 and says what it looked for', async () => {
  const run = await runWithFakeVitest(['release'], { tests: ['src/domain/a_test.ts'] });
  assertEquals(run.code, 2);
  assertStringIncludes(run.out, 'no test files for unit, dom, journey, prop, contract, release');
});

test('the verdict names every reason a run failed, in one line', async () => {
  const run = await runWithFakeVitest(['--coverage', '--min-lines=95', '--min-branches=50'], {
    cases: [['src/domain/a_test.ts', 'adds']],
    lcovText:
      'SF:src/domain/a.ts\nDA:3,0\nLF:10\nLH:9\nBRDA:7,0,0,1\nBRF:1\nBRH:1\nend_of_record\n',
    sources: ['src/domain/a.ts', 'src/domain/forgotten.ts'],
  });
  assertEquals(run.code, 1);
  assertStringIncludes(
    run.out,
    '❌ 1 test passed · line coverage 90.0% (floor 95%) · branch coverage 100.0% · ' +
      '1 source file(s) no test loads',
  );
});

test('a run that dies before reporting says so in the verdict', async () => {
  const run = await runWithFakeVitest([], { crashed: true, success: false });
  assertStringIncludes(run.out, '❌ the run stopped before any test reported');
});

test('a file no area claims is left out of an area run', async () => {
  const run = await runWithFakeVitest(['data'], {
    tests: ['src/domain/a_test.ts', 'misc/loose_test.ts'],
  });
  assertEquals(run.args.filter((a) => a.endsWith('_test.ts')), ['src/domain/a_test.ts']);
});
