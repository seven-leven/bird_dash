/// <reference lib="deno.ns" />
/**
 * scripts/version/bump.ts
 *
 * Called automatically by .githooks/post-commit after every git commit.
 *
 * Steps:
 *   1. Read the last commit message
 *   2. Bump patch version (or minor if commit starts with "feat:")
 *   3. Detect newly drawn items from the JSON diff
 *   4. Append an entry to CHANGELOG.md
 *   5. Stage version.json + CHANGELOG.md and amend the commit silently
 */

import { VersionManager } from './manager.ts';
import { CHANGELOG_FILE, VERSION_FILE } from '../collection/registry.ts';

// ---------------------------------------------------------------------------
// Git helper
// ---------------------------------------------------------------------------

async function git(...args: string[]): Promise<string> {
  const cmd = new Deno.Command('git', { args, stdout: 'piped', stderr: 'piped' });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(`git ${args.join(' ')} failed:\n${new TextDecoder().decode(stderr)}`);
  }
  return new TextDecoder().decode(stdout).trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const commitMsg = await git('log', '-1', '--pretty=%s');

  if (commitMsg === '__version_bump__') {
    console.log('[bump] skipping version-bump commit');
    return;
  }

  console.log(`[bump] commit: "${commitMsg}"`);

  const newDrawings = await VersionManager.getNewlyDrawnFromDiff();
  if (newDrawings.length > 0) {
    console.log(`[bump] new drawings: ${newDrawings.map((d) => d.name).join(', ')}`);
  }

  const version = await VersionManager.bumpAuto(commitMsg);
  console.log(`[bump] version → ${VersionManager.format(version)}`);

  await VersionManager.appendChangelog(version, commitMsg, newDrawings);
  console.log('[bump] changelog updated');

  try {
    await git('add', VERSION_FILE, CHANGELOG_FILE);
    await git('commit', '--amend', '--no-edit', '--no-verify', '--quiet');
    console.log('[bump] commit amended');
  } catch (e) {
    console.warn('[bump] could not amend commit:', (e as Error).message);
  }
}

main().catch((e) => {
  console.error('[bump] error:', e);
  Deno.exit(1);
});
