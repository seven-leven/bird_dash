/// <reference lib="deno.ns" />

/**
 * Run a git command and return its trimmed stdout.
 * Throws with the captured stderr on a non-zero exit.
 */
export async function git(...args: string[]): Promise<string> {
  const cmd = new Deno.Command('git', { args, stdout: 'piped', stderr: 'piped' });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${new TextDecoder().decode(stderr)}`);
  }
  return new TextDecoder().decode(stdout).trim();
}
