/// <reference lib="deno.ns" />
import { assert, assertMatch } from '@std/assert';
import { unloggedCommits } from './changelog.ts';

// Runs against the real repository's history.
Deno.test('unloggedCommits returns dated, non-merge commits (possibly none)', async () => {
  const commits = await unloggedCommits();
  assert(Array.isArray(commits));
  for (const c of commits) {
    assertMatch(c.date, /^\d{4}-\d{2}-\d{2}$/);
    assert(c.subject.trim().length > 0);
    assert(!c.subject.startsWith('Merge pull request'), 'merge commits must be skipped');
  }
});
