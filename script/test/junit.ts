/**
 * Reads the JUnit XML that `deno test --junit-path` writes. Deno's output is small
 * and regular (one <testcase> per test, with a <failure> child when it failed), so a
 * few regexes are enough and no XML dependency is needed.
 */

export interface TestCase {
  name: string;
  /** Repo-relative posix path of the test file. */
  file: string;
  line: number;
  /** Seconds. */
  time: number;
  /** The failure message; undefined when the test passed. */
  failure?: string;
}

const decode = (s: string) =>
  s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'").replaceAll('&amp;', '&'); // &amp; last so "&amp;lt;" stays "&lt;"

const attributes = (text: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  for (const m of text.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[m[1]] = decode(m[2]);
  return attrs;
};

export function parseJunit(xml: string): TestCase[] {
  const cases: TestCase[] = [];
  for (const m of xml.matchAll(/<testcase\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const attrs = attributes(m[1]);
    const failure = /<(?:failure|error)\b([^>]*)/.exec(m[2] ?? '');
    cases.push({
      name: attrs.name ?? '(unnamed)',
      file: (attrs.classname ?? '').replace(/^\.\//, '').replaceAll('\\', '/'),
      line: Number(attrs.line ?? 0),
      time: Number(attrs.time ?? 0),
      failure: failure ? (attributes(failure[1]).message ?? 'failed') : undefined,
    });
  }
  return cases;
}
