/**
 * Test tiers. The tier of a test file is encoded in its name, and this module is
 * the ONE place that maps names to tiers — the runner, the CI summary and the
 * `npm run test:<tier>` scripts all read it.
 *
 *   unit      x_test.ts            pure logic, no environment            (fastest)
 *   dom       x_dom_test.ts        needs a browser-like global (fake DOM)
 *   prop      x_prop_test.ts       property-based: hundreds of generated inputs
 *   contract  x_contract_test.ts   checks real repo files (public/*.json, …)
 *
 * Browser tests (a real Chrome against the built site) would be a fifth tier.
 */

import { glob } from 'node:fs/promises';

export const TIERS = {
  unit: 'pure logic, no environment',
  dom: 'composables that need a browser-like global (fake DOM)',
  prop: 'property-based tests over generated inputs',
  contract: 'checks the real files in the repo (public/*.json, …)',
} as const;

export type Tier = keyof typeof TIERS;
export const TIER_ORDER = Object.keys(TIERS) as Tier[];

export const isTier = (value: string): value is Tier => Object.hasOwn(TIERS, value);

/** Which tier a test file belongs to, from its name alone. */
export function tierOf(path: string): Tier {
  const name = path.replaceAll('\\', '/');
  if (name.endsWith('_dom_test.ts')) return 'dom';
  if (name.endsWith('_prop_test.ts')) return 'prop';
  if (name.endsWith('_contract_test.ts')) return 'contract';
  if (name.endsWith('_test.ts')) return 'unit';
  throw new Error(`not a test file: ${path}`);
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
