import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { parseJunit } from './junit.ts';

// A JUnit file with line numbers (the shape `deno test --junit-path` wrote).
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="deno test" tests="3" failures="1" errors="0" time="0.005">
    <testsuite name="./src/a_test.ts" tests="2" disabled="0" errors="0" failures="1">
        <testcase name="boom &amp; &lt;b&gt;" classname="./src/a_test.ts" time="0.001" line="1" col="6">
            <failure message="Uncaught Error: bad &quot;thing&quot; happened">Error: bad
    at file:///x.ts:1:39</failure>
        </testcase>
        <testcase name="fine" classname="./src/a_test.ts" time="0.250" line="2" col="6">
        </testcase>
    </testsuite>
    <testsuite name="./script/b_prop_test.ts" tests="1" disabled="0" errors="0" failures="0">
        <testcase name="self closing" classname="./script/b_prop_test.ts" time="0.000" line="9" col="6"/>
    </testsuite>
</testsuites>`;

// Shape copied from real Vitest `--reporter=junit` output: no line numbers.
const VITEST_XML = `<?xml version="1.0" encoding="UTF-8" ?>
<testsuites name="vitest tests" tests="2" failures="1" errors="0" time="0.02">
    <testsuite name="script/lib/fs_test.ts" tests="2" failures="1" errors="0" skipped="0" time="0.02">
        <testcase classname="script/lib/fs_test.ts" name="lists files" time="0.0092155">
        </testcase>
        <testcase classname="script/lib/fs_test.ts" name="reads json" time="0.001473">
            <failure message="Values are not equal." type="AssertionError">
AssertionError: Values are not equal.
            </failure>
        </testcase>
    </testsuite>
</testsuites>`;

test("parseJunit reads Vitest's output, whose test cases carry no line", () => {
  assertEquals(
    parseJunit(VITEST_XML),
    [
      { name: 'lists files', file: 'script/lib/fs_test.ts', line: 0, time: 0.0092155 },
      {
        name: 'reads json',
        file: 'script/lib/fs_test.ts',
        line: 0,
        time: 0.001473,
        failure: 'Values are not equal.',
      },
    ].map((c) => ({ failure: undefined, ...c })),
  );
});

test('parseJunit reads every test case with file, line and time', () => {
  const cases = parseJunit(XML);
  assertEquals(cases.length, 3);
  assertEquals(cases[1], {
    name: 'fine',
    file: 'src/a_test.ts',
    line: 2,
    time: 0.25,
    failure: undefined,
  });
});

test('a failure is captured, with XML entities decoded', () => {
  const [failed] = parseJunit(XML);
  assertEquals(failed!.name, 'boom & <b>');
  assertEquals(failed!.failure, 'Uncaught Error: bad "thing" happened');
});

test('self-closing test cases and empty input are handled', () => {
  assertEquals(parseJunit(XML)[2]!.name, 'self closing');
  assertEquals(parseJunit(XML)[2]!.failure, undefined);
  assertEquals(parseJunit(''), []); // e.g. the run died before writing anything
});

test('entities are decoded once (&amp;lt; is the text "&lt;")', () => {
  const xml =
    '<testcase name="a &amp;lt; b" classname="./x_test.ts" time="0" line="1">\n</testcase>';
  assertEquals(parseJunit(xml)[0]!.name, 'a &lt; b');
});

test('missing attributes get defaults, and a failure without a message still counts', () => {
  assertEquals(parseJunit('<testcase ><failure/></testcase>'), [
    { name: '(unnamed)', file: '', line: 0, time: 0, failure: 'failed' },
  ]);
});
