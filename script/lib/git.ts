import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

/**
 * Run a git command and return its trimmed stdout.
 * Throws with the captured stderr on a non-zero exit.
 */
export async function git(...args: string[]): Promise<string> {
  try {
    const { stdout } = await exec('git', args, { maxBuffer: 64 * 1024 * 1024 });
    return stdout.trim();
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? (err as Error).message;
    throw new Error(`git ${args.join(' ')} failed: ${stderr}`, { cause: err });
  }
}
