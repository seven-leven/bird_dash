// The one way a test quiets or reads the console (docs/TESTING.md, rule 4). Lines that match
// are kept for the test to read and not printed; any other line still reaches the real console,
// so a warning nobody expected is never hidden. Leaving the `using` block restores it.
//
//   using console = captureConsole((line) => line.includes('no active component instance'));

const LEVELS = ['log', 'info', 'warn', 'error'] as const;
type Level = (typeof LEVELS)[number];

export interface CapturedConsole extends Disposable {
  /** The lines captured, each with its level, in order. */
  lines: { level: Level; text: string }[];
}

/** Capture the console lines `matches` picks (every line when none is given). */
export function captureConsole(matches: (text: string) => boolean = () => true): CapturedConsole {
  const real = Object.fromEntries(LEVELS.map((level) => [level, console[level]])) as Record<
    Level,
    (...args: unknown[]) => void
  >;
  const lines: CapturedConsole['lines'] = [];
  for (const level of LEVELS) {
    console[level] = (...args: unknown[]) => {
      const text = args.map(String).join(' ');
      if (matches(text)) lines.push({ level, text });
      else real[level](...args);
    };
  }
  return {
    lines,
    [Symbol.dispose]: () => {
      for (const level of LEVELS) console[level] = real[level];
    },
  };
}
