/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import type { TestCase } from './junit.ts';
import { annotations, formatConsole, formatMarkdown, summarize } from './report.ts';

const t = (file: string, name: string, time = 0.001, failure?: string): TestCase => ({
  name,
  file,
  line: 7,
  time,
  failure,
});

const cases: TestCase[] = [
  t('src/a_test.ts', 'a1'),
  t('src/a_test.ts', 'a2', 0.3),
  t('src/b_test.ts', 'b1'),
  t('src/c_dom_test.ts', 'dom1', 0.01, 'Uncaught AssertionError: nope\nsecond line'),
  t('src/d_prop_test.ts', 'prop1'),
];

Deno.test('summarize groups by tier, counts files/tests/failures, and skips empty tiers', () => {
  const s = summarize(cases);
  assertEquals(s.tiers.map((x) => [x.tier, x.files, x.tests, x.failed]), [
    ['unit', 2, 3, 0],
    ['dom', 1, 1, 1],
    ['prop', 1, 1, 0],
  ]);
  assertEquals(s.total, { files: 4, tests: 5, failed: 1, time: s.total.time });
  assertEquals(s.failures.map((f) => f.name), ['dom1']);
});

Deno.test('summarize reports the slowest tests first', () => {
  assertEquals(summarize(cases, 2).slowest.map((c) => c.name), ['a2', 'dom1']);
});

Deno.test('the console summary is short when everything passes', () => {
  const out = formatConsole(summarize(cases.filter((c) => !c.failure)));
  assertStringIncludes(out, 'all passing');
  assert(!out.includes('failing'));
  assert(out.split('\n').length < 14, 'a green run should stay compact');
});

Deno.test('failures are listed first, with file:line and only the first message line', () => {
  const out = formatConsole(summarize(cases));
  const lines = out.split('\n');
  assertEquals(lines[0], '✗ 1 failing');
  assertStringIncludes(out, 'src/c_dom_test.ts:7');
  assertStringIncludes(out, 'Uncaught AssertionError: nope');
  assert(!out.includes('second line'));
});

Deno.test('verbose lists each file with its test count', () => {
  const out = formatConsole(summarize(cases), { verbose: true, cases });
  assertStringIncludes(out, '✓ src/a_test.ts  2 tests');
  assertStringIncludes(out, '✗ src/c_dom_test.ts  1 tests');
});

Deno.test('the markdown summary has a per-tier table and names the failures', () => {
  const md = formatMarkdown(summarize(cases), 'Tests (TZ=UTC)');
  assertStringIncludes(md, '### Tests (TZ=UTC)');
  assertStringIncludes(md, '| unit | 2 | 3 |');
  assertStringIncludes(md, '❌ 1 failed');
  assertStringIncludes(md, '`src/c_dom_test.ts:7` — dom1');
});

Deno.test('annotations use GitHub workflow-command escaping', () => {
  const [line] = annotations([
    t('src/x_test.ts', 'has, comma: and colon', 0, '100% bad\nnext line'),
  ]);
  assertEquals(
    line,
    '::error file=src/x_test.ts,line=7,title=Test failed%3A has%2C comma%3A and colon::100%25 bad',
  );
});
