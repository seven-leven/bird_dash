/**
 * Test tiers, as one table. A test file's tier is in its name, and everything that
 * needs to know what a tier is reads it from here: the runner, `tierOf`, the
 * `npm run test:<tier>` scripts, Vitest's projects (vite.config.ts, through
 * `vitestProjects`) and the table in docs/TESTING.md (a contract test compares them).
 *
 * Two axes, kept apart: an ENVIRONMENT is where a test runs (plain Node, or a fake
 * browser); a TIER is one environment plus what is its own (its suffix, what it is for,
 * the helper it brings). A real browser would be one more environment and one more row.
 */

import { glob } from 'node:fs/promises';

export interface Environment {
  /** Vitest's `environment` for the files that run here. */
  vitest: 'node' | 'happy-dom';
  /** Run before each file here (and, through it, before each test). */
  setupFiles: string[];
  /** Where its tests may live. */
  roots: string[];
}

export const ENVIRONMENTS = {
  node: { vitest: 'node', setupFiles: [], roots: ['src', 'script'] },
  dom: { vitest: 'happy-dom', setupFiles: ['src/testing/domSetup.ts'], roots: ['src'] },
} as const satisfies Record<string, Environment>;

export type EnvironmentName = keyof typeof ENVIRONMENTS;

export interface TierRow {
  /** The file name ends with it: `x` + suffix. */
  suffix: string;
  environment: EnvironmentName;
  /** What the tier is for, as docs/TESTING.md's table says it. */
  about: string;
  /** What the tier brings of its own, from src/testing/, or "none". */
  helper: string;
}

/** The tiers, in the order the report lists them. */
export const TIERS = {
  unit: {
    suffix: '_test.ts',
    environment: 'node',
    about: 'Pure logic. Start here',
    helper: '`testing/fixtures.ts`',
  },
  dom: {
    suffix: '_dom_test.ts',
    environment: 'dom',
    about: 'Code that needs `document`, `location`, focus or storage',
    helper: '`testing/domSetup.ts`, before every test',
  },
  journey: {
    suffix: '_journey_test.ts',
    environment: 'dom',
    about: 'A whole visit, through the real app',
    helper: '`testing/renderApp.ts` (`renderApp`)',
  },
  prop: {
    suffix: '_prop_test.ts',
    environment: 'node',
    about: 'A rule that must hold for _any_ input',
    helper: '`testing/propertyRuns.ts` (`assertProperty`)',
  },
  contract: {
    suffix: '_contract_test.ts',
    environment: 'node',
    about: 'The real files and history of this repo',
    helper: 'none',
  },
} as const satisfies Record<string, TierRow>;

export type Tier = keyof typeof TIERS;
export const TIER_ORDER = Object.keys(TIERS) as Tier[];

export const isTier = (value: string): value is Tier => Object.hasOwn(TIERS, value);

// Longest suffix first: "x_dom_test.ts" also ends with "_test.ts".
const BY_SUFFIX = [...TIER_ORDER].sort((a, b) => TIERS[b].suffix.length - TIERS[a].suffix.length);

/** Which tier a test file belongs to, from its name alone. */
export function tierOf(path: string): Tier {
  const name = path.replaceAll('\\', '/');
  const tier = BY_SUFFIX.find((t) => name.endsWith(TIERS[t].suffix));
  if (!tier) throw new Error(`not a test file: ${path}`);
  return tier;
}

/**
 * Vitest's projects, one per environment: each takes the files of its tiers under its
 * roots, and leaves the other environments' suffixes to them.
 */
export function vitestProjects() {
  return (Object.keys(ENVIRONMENTS) as EnvironmentName[]).map((name) => {
    const env: Environment = ENVIRONMENTS[name];
    const suffix = (t: Tier) => TIERS[t].suffix;
    const own = TIER_ORDER.filter((t) => TIERS[t].environment === name);
    // "_test.ts" already takes in "_prop_test.ts": include the shortest suffixes only.
    const included = own.filter((t) => !own.some((o) => o !== t && suffix(t).endsWith(suffix(o))));
    // Leave out the other environments' files that those patterns would catch: node's
    // "_test.ts" takes in "_dom_test.ts" too, so node leaves it to dom.
    const excluded = TIER_ORDER.filter((t) =>
      TIERS[t].environment !== name && included.some((i) => suffix(t).endsWith(suffix(i)))
    );
    return {
      extends: true as const,
      test: {
        name,
        include: env.roots.flatMap((root) => included.map((t) => `${root}/**/*${suffix(t)}`)),
        exclude: [...excluded.map((t) => `**/*${suffix(t)}`), '**/node_modules/**'],
        environment: env.vitest,
        ...(env.setupFiles.length > 0 ? { setupFiles: [...env.setupFiles] } : {}),
      },
    };
  });
}

/** docs/TESTING.md's table of tiers, as the table here makes it. */
export function tiersMarkdown(): string[] {
  return TIER_ORDER.map((t) =>
    `| \`${t}\` | \`x${TIERS[t].suffix}\` | ${TIERS[t].about} | ${TIERS[t].helper} |`
  );
}

/** A path as the runner compares them: forward slashes, no leading `./`. */
export const repoPath = (path: string): string => path.replaceAll('\\', '/').replace(/^\.\//, '');

/** Every `*_test.ts` under the given roots, as sorted repo-relative posix paths. */
export async function discoverTests(roots = ['src', 'script']): Promise<string[]> {
  return await findFiles(roots, '*_test.ts');
}

/** Every file matching `pattern` under the given roots (skipping node_modules), as sorted posix paths. */
export async function findFiles(roots: string[], pattern: string): Promise<string[]> {
  const found = await Array.fromAsync(glob(roots.map((root) => `${root}/**/${pattern}`), {
    exclude: (path) => path.includes('node_modules'),
  }));
  return found.map((path) => path.replaceAll('\\', '/')).sort();
}

export function groupByTier(files: string[]): Record<Tier, string[]> {
  const groups = Object.fromEntries(TIER_ORDER.map((t) => [t, [] as string[]])) as Record<
    Tier,
    string[]
  >;
  for (const file of files) groups[tierOf(file)].push(file);
  return groups;
}
