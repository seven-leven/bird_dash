// What every command shares (docs/SCRIPTS.md, principles 7 and 8): reading its
// arguments, its exit codes and how it reports a problem.
import { parseArgs as parseNodeArgs } from 'node:util';
import { type Io, realIo } from './io.ts';
import { errorMessage } from './error.ts';
import { isErrno } from './fs.ts';

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
 * Split `args` into flags, options with a value (`--into <dir>` or `--into=<dir>`), and
 * words, accepting only `flags` and `options` (and `--help`), with Node's own parser. A
 * bare `--` (which npm passes through) is ignored, so flags after it still count. Throws
 * UsageError for any other flag, or for an option with no value after it.
 */
export function parseArgs(
  args: string[],
  flags: readonly string[],
  options: readonly string[] = [],
): Args {
  const known = [...flags, ...options, '--help'];
  const config = Object.fromEntries(known.map((name) => [
    name.slice(2),
    { type: options.includes(name) ? 'string' as const : 'boolean' as const },
  ]));
  let values: Record<string, string | boolean | undefined>;
  let words: string[];
  try {
    ({ values, positionals: words } = parseNodeArgs({
      args: args.filter((arg) => arg !== '--'),
      options: config,
      strict: true,
      allowPositionals: true,
    }));
  } catch (err) {
    throw new UsageError(usageProblem(err, known));
  }
  const parsed: Args = { flags: new Set(), values: new Map(), words };
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === 'string') parsed.values.set(`--${name}`, value);
    else parsed.flags.add(`--${name}`);
  }
  return parsed;
}

/** Node's parse error, in the words every command uses. */
function usageProblem(err: unknown, known: string[]): string {
  const message = errorMessage(err);
  const option = /'(-[^' ]+)/.exec(message)![1];
  if (isErrno(err, 'ERR_PARSE_ARGS_UNKNOWN_OPTION')) {
    return `unknown option ${option} (this command takes: ${known.join(', ')})`;
  }
  return message.includes('does not take') ? `${option} takes no value` : `${option} needs a value`;
}

/** A command's entry: its arguments, the Io (the real one by default), any test options. */
export type Main<Options> = (args: string[], io?: Io, options?: Options) => Promise<number>;

/**
 * Make a command's `main` from its usage and the work it does (docs/SCRIPTS.md,
 * principle 7). The `main` turns the outcome into an exit code: `--help` prints `usage`
 * and exits 0; wrong arguments exit 2; anything thrown is reported by its first line,
 * after `✗`, and exits 1. The work returns its own code when it found a problem itself.
 *
 *   export const main = command(USAGE, async (args, io) => { … });
 */
export function command<Options = Record<string, never>>(
  usage: string,
  work: (args: string[], io: Io, options: Options) => Promise<number | void>,
): Main<Options> {
  return async (args, io = realIo, options = {} as Options) => {
    if (args.includes('--help')) {
      io.out(usage);
      return EXIT.done;
    }
    try {
      return (await work(args, io, options)) ?? EXIT.done;
    } catch (err) {
      if (err instanceof UsageError) {
        io.err(`${MARK.problem} ${err.message}`);
        io.err(usage);
        return EXIT.usage;
      }
      io.err(`${MARK.problem} ${errorMessage(err).split('\n')[0]}`);
      return EXIT.problem;
    }
  };
}
