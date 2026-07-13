/// <reference lib="deno.ns" />
import { assert, assertStringIncludes } from '@std/assert';
import { insertEntries } from './changelog.ts';

const LINES = ['- 2025-01-02 | feat: b', '- 2025-01-01 | feat: a'];

Deno.test('insertEntries adds lines under an existing Unreleased header', () => {
  const changelog = '# Changelog\n\n---\n\n## Unreleased\n\n- 2024-12-31 | old\n';
  const out = insertEntries(changelog, LINES);
  const unreleasedAt = out.indexOf('## Unreleased');
  for (const line of LINES) assert(out.indexOf(line) > unreleasedAt, `${line} after header`);
  // the pre-existing entry is preserved
  assertStringIncludes(out, '- 2024-12-31 | old');
});

Deno.test('insertEntries creates an Unreleased section after the divider when absent', () => {
  const changelog = '# Changelog\n\n---\n\n## v0.8.0\n\n- shipped\n';
  const out = insertEntries(changelog, LINES);
  assertStringIncludes(out, '## Unreleased');
  const unreleasedAt = out.indexOf('## Unreleased');
  const releasedAt = out.indexOf('## v0.8.0');
  assert(unreleasedAt < releasedAt, 'Unreleased inserted above the last release');
  for (const line of LINES) assertStringIncludes(out, line);
});
