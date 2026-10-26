// What every command shares (docs/SCRIPTS.md, principles 7 and 8): reading its
// arguments, its exit codes and how it reports a problem.
import type { Io } from './io.ts';
import { errorMessage } from './error.ts';

/** Exit codes: done; the work found a problem; the command was used wrongly. */
export const EXIT = { done: 0, problem: 1, usage: 2 } as const;

/** The marks every command's output uses. */
export const MARK = { done: '✓', problem: '✗', skipped: '·' } as const;

/** A line of a report; a problem goes to stderr. Reports are built as lines, then printed. */
export interface Line {
  text: string;
  problem?: boolean;
}

/** Print a report's lines: problems on stderr, the rest on stdout. */
export function printLines(io: Io, lines: Line[]): void {
  for (const line of lines) (line.problem ? io.err : io.out)(line.text);
}

/** Thrown for arguments the command does not take; the command exits 2. */
export class UsageError extends Error {}

export interface Args {
  flags: Set<string>;
  /** Options that take a value (`--into <dir>`), by name. */
  values: Map<string, string>;
  /** The arguments that are not flags, in order. */
  words: string[];
}

/**
 * Split `args` into flags, options with a value, and words, accepting only `flags` and
 * `options` (and `--help`). A bare `--` (which npm passes through) is ignored. Throws
 * UsageError for any other flag, or for an option with no value after it.
 */
export function parseArgs(
  args: string[],
  flags: readonly string[],
  options: readonly string[] = [],
): Args {
  const known = new Set([...flags, ...options, '--help']);
  const parsed: Args = { flags: new Set(), values: new Map(), words: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') continue;
    if (!arg.startsWith('-')) {
      parsed.words.push(arg);
      continue;
    }
    if (!known.has(arg)) {
      throw new UsageError(`unknown option ${arg} (this command takes: ${[...known].join(', ')})`);
    }
    if (!options.includes(arg)) {
      parsed.flags.add(arg);
      continue;
    }
    const value = args[++i];
    if (value === undefined || value.startsWith('-')) throw new UsageError(`${arg} needs a value`);
    parsed.values.set(arg, value);
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
