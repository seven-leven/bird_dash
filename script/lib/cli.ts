// What every command shares (docs/SCRIPTS.md, principles 7 and 8): reading its
// arguments, its exit codes and how it reports a problem.
import type { Io } from './io.ts';
import { errorMessage } from './error.ts';

/** Exit codes: done; the work found a problem; the command was used wrongly. */
export const EXIT = { done: 0, problem: 1, usage: 2 } as const;

/** The marks every command's output uses. */
export const MARK = { done: '✓', problem: '✗', skipped: '·' } as const;

/** Thrown for arguments the command does not take; the command exits 2. */
export class UsageError extends Error {}

export interface Args {
  flags: Set<string>;
  /** The arguments that are not flags, in order. */
  words: string[];
}

/**
 * Split `args` into flags and words, accepting only `flags` (and `--help`). A bare
 * `--` (which npm passes through) is ignored. Throws UsageError for any other flag.
 */
export function parseArgs(args: string[], flags: readonly string[]): Args {
  const known = new Set([...flags, '--help']);
  const parsed: Args = { flags: new Set(), words: [] };
  for (const arg of args) {
    if (arg === '--') continue;
    if (!arg.startsWith('-')) {
      parsed.words.push(arg);
      continue;
    }
    if (!known.has(arg)) {
      throw new UsageError(`unknown option ${arg} (this command takes: ${[...known].join(', ')})`);
    }
    parsed.flags.add(arg);
  }
  return parsed;
}

/**
 * Run a command's body and turn the outcome into an exit code. `--help` prints `usage`
 * and exits 0; wrong arguments exit 2; anything thrown is reported, with its first line
 * after `✗`, and exits 1. The body returns its own code when it found a problem itself.
 */
export async function runCommand(
  io: Io,
  args: string[],
  usage: string,
  body: () => Promise<number | void>,
): Promise<number> {
  if (args.includes('--help')) {
    io.out(usage);
    return EXIT.done;
  }
  try {
    return (await body()) ?? EXIT.done;
  } catch (err) {
    if (err instanceof UsageError) {
      io.err(`${MARK.problem} ${err.message}`);
      io.err(usage);
      return EXIT.usage;
    }
    io.err(`${MARK.problem} ${errorMessage(err).split('\n')[0]}`);
    return EXIT.problem;
  }
}
