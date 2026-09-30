/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { parseJunit } from './junit.ts';

// Shape copied from real `deno test --junit-path` output (passing and failing).
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

Deno.test('parseJunit reads every test case with file, line and time', () => {
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

Deno.test('a failure is captured, with XML entities decoded', () => {
  const [failed] = parseJunit(XML);
  assertEquals(failed.name, 'boom & <b>');
  assertEquals(failed.failure, 'Uncaught Error: bad "thing" happened');
});

Deno.test('self-closing test cases and empty input are handled', () => {
  assertEquals(parseJunit(XML)[2].name, 'self closing');
  assertEquals(parseJunit(XML)[2].failure, undefined);
  assertEquals(parseJunit(''), []); // e.g. the run died before writing anything
});

Deno.test('entities are decoded once (&amp;lt; is the text "&lt;")', () => {
  const xml =
    '<testcase name="a &amp;lt; b" classname="./x_test.ts" time="0" line="1">\n</testcase>';
  assertEquals(parseJunit(xml)[0].name, 'a &lt; b');
});
