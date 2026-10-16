import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { useSearchHighlight } from './useSearchHighlight.ts';

const { highlightText } = useSearchHighlight();

test('no query returns HTML-escaped text unchanged otherwise', () => {
  assertEquals(highlightText('Plain', ''), 'Plain');
  assertEquals(highlightText('<b>&"', ''), '&lt;b&gt;&amp;&quot;');
});

test('a match is wrapped in a <mark>', () => {
  const out = highlightText('Mallard Duck', 'mall');
  assertStringIncludes(out, '<mark');
  assertStringIncludes(out, '</mark>');
  assertStringIncludes(out.toLowerCase(), '>mall</mark>');
});

test('matching is case-insensitive and preserves original case', () => {
  assertStringIncludes(highlightText('MALLARD', 'mall'), '>MALL</mark>');
});

test('a query cannot match inside an escaped HTML entity', () => {
  // "amp" appears in the escaped "&amp;" but not in the visible text, so nothing
  // should be highlighted (and the entity must stay intact for the browser).
  assertEquals(highlightText('Tom & Jerry', 'amp'), 'Tom &amp; Jerry');
  assertEquals(highlightText('a<b', 'lt'), 'a&lt;b');
  // a real match next to an entity still highlights just that part
  assertStringIncludes(highlightText('Tom & Jerry', 'tom'), '>Tom</mark> &amp; Jerry');
});

test('regex-special characters in the query are escaped, not interpreted', () => {
  // '.' must match a literal dot, not any char
  const out = highlightText('a.b axb', 'a.b');
  assertStringIncludes(out, '>a.b</mark>');
  assert(!out.includes('>axb</mark>'));
});
