/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { insertEntries } from './changelog.ts';

const LINES = ['- 2025-01-02 | feat: b', '- 2025-01-01 | feat: a'];

Deno.test('insertEntries puts new lines at the top of the newest section', () => {
  const changelog =
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2024-12-31 | old\n\n## v0.8.0\n\n- older\n';
  const out = insertEntries(changelog, LINES);
  assertEquals(
    out,
    '# Changelog\n\n---\n\n## v0.9.0\n\n- 2025-01-02 | feat: b\n- 2025-01-01 | feat: a\n' +
      '- 2024-12-31 | old\n\n## v0.8.0\n\n- older\n',
  );
});

Deno.test('insertEntries never creates an "Unreleased" section: every merge is live', () => {
  const out = insertEntries('# Changelog\n\n---\n\n## v0.9.0\n\n- shipped\n', LINES);
  assert(!out.includes('Unreleased'));
});

Deno.test('insertEntries with no section yet adds the lines after the divider', () => {
  const out = insertEntries('# Changelog\n\n---\n', LINES);
  assert(out.indexOf(LINES[0]) > out.indexOf('---'));
  for (const line of LINES) assertStringIncludes(out, line);
});
