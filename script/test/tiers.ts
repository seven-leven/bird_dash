/// <reference lib="deno.ns" />
/**
 * Test tiers. The tier of a test file is encoded in its name, and this module is
 * the ONE place that maps names to tiers — the runner, the CI summary and the
 * `deno task test:<tier>` tasks all read it.
 *
 *   unit      x_test.ts            pure logic, no environment            (fastest)
 *   dom       x_dom_test.ts        needs a browser-like global (fake DOM)
 *   prop      x_prop_test.ts       property-based: hundreds of generated inputs
 *   contract  x_contract_test.ts   checks real repo files (public/*.json, …)
 *
 * Browser tests (a real Chrome against the built site) would be a fifth tier.
 */

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

/** Every `*_test.ts` under the given roots, as sorted repo-relative posix paths. */
export async function discoverTests(roots = ['src', 'script']): Promise<string[]> {
  const found: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name !== 'node_modules') await walk(path);
      } else if (entry.isFile && entry.name.endsWith('_test.ts')) {
        found.push(path);
      }
    }
  };
  for (const root of roots) await walk(root);
  return found.sort();
}

export function groupByTier(files: string[]): Record<Tier, string[]> {
  const groups = Object.fromEntries(TIER_ORDER.map((t) => [t, [] as string[]])) as Record<
    Tier,
    string[]
  >;
  for (const file of files) groups[tierOf(file)].push(file);
  return groups;
}
