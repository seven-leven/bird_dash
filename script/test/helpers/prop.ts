import * as fc from 'fast-check';

/**
 * `fc.assert` with a depth knob: FC_RUNS_MULTIPLIER scales every property's run
 * count, so the same tests are quick on a laptop (1×) and thorough in the nightly
 * job (see .github/workflows/nightly.yml). When a property fails, fast-check prints
 * the seed and path; re-run with `{ seed, path }` in the params to reproduce.
 * Synchronous properties only (that is all we have).
 */
const multiplier = Number(Deno.env.get('FC_RUNS_MULTIPLIER')) || 1;

export function assertProperty<Ts extends unknown[]>(
  property: fc.IProperty<Ts>,
  params: fc.Parameters<Ts> = {},
): void {
  fc.assert(property, { ...params, numRuns: Math.round((params.numRuns ?? 100) * multiplier) });
}
