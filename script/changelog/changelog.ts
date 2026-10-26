/**
 * script/changelog/changelog.ts — keep CHANGELOG.md in sync with git history
 *
 *   npm run changelog              insert unlogged commits at the top of the newest section
 *   npm run changelog -- --dry-run print what would be inserted, change nothing
 *
 * "Unlogged" means: commits made after the last commit that touched
 * CHANGELOG.md itself. Updating the changelog therefore marks everything
 * up to that point as logged — no state file, no version bump commit.
 *
 * Merge commits are skipped (their PR subject duplicates the branch commits).
 */

import type { Io } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { command, parseArgs } from '../lib/cli.ts';

export interface LoggedCommit {
  date: string;
  subject: string;
}

/** Parse `git log --format=%ad|%s` output. A subject may itself contain `|`. */
export function parseLog(raw: string): LoggedCommit[] {
  if (!raw.trim()) return [];
  return raw.split('\n').map((line) => {
    const [date, ...rest] = line.split('|');
    return { date, subject: rest.join('|') };
  });
}

/** One changelog line per commit, in the file's `- date | subject` form. */
export const toLines = (commits: LoggedCommit[]): string[] =>
  commits.map((c) => `- ${c.date} | ${c.subject}`);

/** Commits since CHANGELOG.md was last modified, oldest first. */
export async function readUnloggedCommits(io: Io): Promise<LoggedCommit[]> {
  const lastTouch = await io.git('log', '-1', '--format=%H', '--', PATHS.changelog);
  // "Never committed" happens only in a repository without a CHANGELOG.md commit, not this one.
  /* c8 ignore next */
  const range = lastTouch ? `${lastTouch}..HEAD` : 'HEAD';
  const raw = await io.git(
    'log',
    '--no-merges',
    '--reverse',
    '--format=%ad|%s',
    '--date=short',
    range,
  );
  return parseLog(raw);
}

/**
 * Insert `lines` at the top of the newest section (the first `## ` heading).
 * The site deploys on every merge, so there is no "Unreleased" section: new
 * work belongs to the current line of work straight away.
 */
export function insertEntries(changelog: string, lines: string[]): string {
  const block = lines.join('\n') + '\n';
  const heading = changelog.search(/^## /m);
  if (heading === -1) {
    // No section yet — put the entries after the first "---" divider.
    const divider = changelog.indexOf('---');
    const at = divider === -1 ? 0 : changelog.indexOf('\n', divider) + 1;
    return changelog.slice(0, at) + '\n' + block + changelog.slice(at);
  }
  const at = changelog.indexOf('\n', heading) + 1;
  return changelog.slice(0, at) + '\n' + block + changelog.slice(at).replace(/^\n/, '');
}

export type Outcome = 'up-to-date' | 'dry-run' | 'written';

/** Write the unlogged commits into the changelog (unless `dryRun`), and say what was done. */
export async function writeChangelog(io: Io, dryRun = false): Promise<Outcome> {
  const commits = await readUnloggedCommits(io);
  if (commits.length === 0) {
    io.out('[changelog] up to date — no commits since CHANGELOG.md was last touched');
    return 'up-to-date';
  }

  const lines = toLines(commits);
  io.out(`[changelog] ${commits.length} unlogged commit(s):`);
  for (const line of lines) io.out(`  ${line}`);

  if (dryRun) {
    io.out('[changelog] dry run — nothing written');
    return 'dry-run';
  }

  await io.writeText(PATHS.changelog, insertEntries(await io.readText(PATHS.changelog), lines));
  io.out('[changelog] inserted at the top of the newest section — review, edit, and commit');
  return 'written';
}

const USAGE = `npm run changelog [-- --dry-run]
  Inserts every commit since CHANGELOG.md was last touched at the top of the newest
  section, ready to edit into one entry per piece of work. --dry-run changes nothing.`;

export const main = command(USAGE, async (args, io) => {
  const { flags } = parseArgs(args, ['--dry-run']);
  await writeChangelog(io, flags.has('--dry-run'));
});

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
