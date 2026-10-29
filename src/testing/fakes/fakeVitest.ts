// The test runner (script/testRunner/testRunner.ts) against a fake Vitest, on a fake Io: what
// it printed, what it passed to Vitest, and the files it left. The runner's own tests use it.
//
//   const run = await runWithFakeVitest(['--coverage'], { cases: [['src/a_test.ts', 'adds']] })
import { main, type RunnerOptions } from '../../../script/testRunner/testRunner.ts';
import { fakeIo } from '../../../script/lib/fakeIo.ts';

/** A test as the JUnit file reports it: its file, its title, and its failure if it failed. */
export type Case = [file: string, name: string, failure?: string];

const junit = (cases: Case[]) =>
  `<testsuites>${
    cases.map(([file, name, failure]) =>
      `<testcase classname="${file}" name="${name}" time="0.01">${
        failure ? `<failure message="${failure}"/>` : ''
      }</testcase>`
    ).join('')
  }</testsuites>`;

const lcov = (files: Record<string, [found: number, hit: number]>) =>
  Object.entries(files).map(([file, [found, hit]]) =>
    `SF:${file}\nLF:${found}\nLH:${hit}\nend_of_record\n`
  ).join('');

export interface Run {
  code: number;
  /** Everything it printed, problems included, in order. */
  out: string;
  /** The arguments main passed to Vitest. */
  args: string[];
  /** A file it left in the results folder, or undefined. */
  result: (name: string) => string | undefined;
  /** A file anywhere, as the run left it (the CI job summary). */
  file: (path: string) => string | undefined;
}

/**
 * Run `main` on a fake Io, against a fake Vitest that writes the given JUnit (and LCOV, when
 * asked for coverage) where main told it to.
 */
export async function runWithFakeVitest(argv: string[], opts: {
  cases?: Case[];
  coverage?: Record<string, [number, number]>;
  sources?: string[];
  success?: boolean;
  env?: Record<string, string>;
  tests?: string[];
  /** Raw LCOV, used instead of `coverage` (for branch counters). */
  lcovText?: string;
  /** Vitest died before writing its JUnit file. */
  crashed?: boolean;
} = {}): Promise<Run> {
  const io = fakeIo({ env: opts.env });
  let args: string[] = [];
  const options: RunnerOptions = {
    discoverTests: async () => opts.tests ?? ['src/domain/a_test.ts', 'src/domain/b_dom_test.ts'],
    discoverSources: async () =>
      opts.sources ?? (opts.lcovText ? ['src/domain/a.ts'] : Object.keys(opts.coverage ?? {})),
    vitest: async (given) => {
      args = given;
      const value = (flag: string) => given.find((a) => a.startsWith(flag))?.slice(flag.length);
      if (!opts.crashed) await io.writeText(value('--outputFile.junit=')!, junit(opts.cases ?? []));
      const covDir = value('--coverage.reportsDirectory=');
      if (covDir) {
        await io.writeText(`${covDir}/lcov.info`, opts.lcovText ?? lcov(opts.coverage ?? {}));
      }
      return { success: opts.success ?? true, output: ' RUN  v5\n···x\n FAIL  boom detail' };
    },
    resultsDir: 'results',
  };
  const code = await main(argv, io, options);
  return {
    code,
    out: io.printed.join('\n'),
    args,
    result: (name) => io.files.get(`results/${name}`),
    file: (path) => io.files.get(path),
  };
}
