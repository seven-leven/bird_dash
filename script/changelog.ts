/// <reference lib="deno.ns" />
/**
 * script/changelog.ts — keep CHANGELOG.md in sync with git history
 *
 *   deno task changelog            insert unlogged commits under "## Unreleased"
 *   deno task changelog --dry-run  print what would be inserted, change nothing
 *
 * "Unlogged" means: commits made after the last commit that touched
 * CHANGELOG.md itself. Updating the changelog therefore marks everything
 * up to that point as logged — no state file, no version bump commit.
 *
 * Merge commits are skipped (their PR subject duplicates the branch commits).
 */

import { CHANGELOG_FILE } from './collection/registry.ts';

const UNRELEASED_HEADER = '## Unreleased';

async function git(...args: string[]): Promise<string> {
  const cmd = new Deno.Command('git', { args, stdout: 'piped', stderr: 'piped' });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(stderr)}`);
  }
  return new TextDecoder().decode(stdout).trim();
}

/** Commits since CHANGELOG.md was last modified, oldest first. */
async function unloggedCommits(): Promise<Array<{ date: string; subject: string }>> {
  const lastTouch = await git('log', '-1', '--format=%H', '--', CHANGELOG_FILE);
  const range = lastTouch ? `${lastTouch}..HEAD` : 'HEAD';
  const raw = await git(
    'log',
    '--no-merges',
    '--reverse',
    '--format=%ad|%s',
    '--date=short',
    range,
  );
  if (!raw) return [];
  return raw.split('\n').map((line) => {
    const [date, ...rest] = line.split('|');
    return { date, subject: rest.join('|') };
  });
}

function insertEntries(changelog: string, lines: string[]): string {
  const idx = changelog.indexOf(UNRELEASED_HEADER);
  if (idx === -1) {
    // No Unreleased section yet — create one after the first "---" divider.
    const divider = changelog.indexOf('---');
    const at = divider === -1 ? 0 : changelog.indexOf('\n', divider) + 1;
    const section = `\n${UNRELEASED_HEADER}\n\n${lines.join('\n')}\n`;
    return changelog.slice(0, at) + section + changelog.slice(at);
  }
  const at = changelog.indexOf('\n', idx) + 1;
  return changelog.slice(0, at) + '\n' + lines.join('\n') + '\n' +
    changelog.slice(at, changelog.length).replace(/^\n/, '\n');
}

async function main() {
  const dryRun = Deno.args.includes('--dry-run');

  const commits = await unloggedCommits();
  if (commits.length === 0) {
    console.log('[changelog] up to date — no commits since CHANGELOG.md was last touched');
    return;
  }

  const lines = commits.map((c) => `- ${c.date} | ${c.subject}`);
  console.log(`[changelog] ${commits.length} unlogged commit(s):`);
  for (const line of lines) console.log(`  ${line}`);

  if (dryRun) {
    console.log('[changelog] dry run — nothing written');
    return;
  }

  const changelog = await Deno.readTextFile(CHANGELOG_FILE);
  await Deno.writeTextFile(CHANGELOG_FILE, insertEntries(changelog, lines));
  console.log(`[changelog] inserted under "${UNRELEASED_HEADER}" — review, edit, and commit`);
}

main().catch((e) => {
  console.error('[changelog] error:', e);
  Deno.exit(1);
});
