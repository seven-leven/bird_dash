/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../../../script/test/helpers/prop.ts';
import { useSearchHighlight } from './useSearchHighlight.ts';

const { highlightText } = useSearchHighlight();

// Random strings almost never collide with HTML entity names, so build text and
// queries partly from the tokens that matter: markup characters and entity words.
const tokens = fc.constantFrom(
  '&',
  '<',
  '>',
  '"',
  ';',
  ' ',
  'amp',
  'lt',
  'gt',
  'quot',
  'a',
  'B',
  'mark',
);
const tokenString = fc.array(tokens, { maxLength: 8 }).map((t) => t.join(''));
const anyText = fc.oneof(fc.string(), tokenString);

const MARK = /<mark class="[^"]*">|<\/mark>/g;
const unescapeHtml = (s: string) =>
  s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll(
    '&amp;',
    '&',
  );

// Highlighted strings are rendered with v-html, so two things must always hold
// for ANY text and query: nothing but our own <mark> tags may be markup, and
// removing the marks must give back exactly the original text.

Deno.test('property: the output never contains markup other than <mark>', () => {
  assertProperty(
    fc.property(anyText, anyText, (text, query) => {
      const withoutMarks = highlightText(text, query).replace(MARK, '');
      return !/[<>]/.test(withoutMarks) && !withoutMarks.includes('"');
    }),
    { numRuns: 500 },
  );
});

// A browser decodes entities within each run of text between tags; an entity can
// never span a tag. Model that: decode every segment on its own, then join.
Deno.test('property: the text a browser would show is exactly the original text', () => {
  assertProperty(
    fc.property(anyText, anyText, (text, query) => {
      const shown = highlightText(text, query).split(MARK).map(unescapeHtml).join('');
      assertEquals(shown, text);
    }),
    { numRuns: 500 },
  );
});

Deno.test('property: a highlighted span is a case-insensitive match of the query', () => {
  assertProperty(
    fc.property(anyText, anyText, (text, query) => {
      const q = query.trim();
      if (!q) return true;
      const out = highlightText(text, query);
      for (const m of out.matchAll(/<mark class="[^"]*">(.*?)<\/mark>/gs)) {
        if (unescapeHtml(m[1]).toLowerCase() !== q.toLowerCase()) return false;
      }
      return true;
    }),
    { numRuns: 500 },
  );
});
