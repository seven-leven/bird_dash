import { COLLECTIONS } from '../collection/registry.ts';
import type { Collection } from '../collection/registry.ts';
import type { WorkPlan } from './plan.ts';
import type { ExecutionResult } from './execute.ts';

// ---------------------------------------------------------------------------
// Column width — derived once from the longest collection id
// ---------------------------------------------------------------------------

const COL_W = Math.max(...COLLECTIONS.map((c) => c.id.length));
const VERB_W = 14;

function pad(s: string, w: number) {
  return s.padEnd(w);
}

// ---------------------------------------------------------------------------
// Live log — called during execution
// ---------------------------------------------------------------------------

export const log = {
  step(colId: string, verb: string, detail: string): void {
    console.log(`  ${pad(colId, COL_W)}  ${pad(verb, VERB_W)}  ${detail}`);
  },
  warn(colId: string, detail: string): void {
    console.log(`  ${pad(colId, COL_W)}  ${'warn'.padEnd(VERB_W)}  ${detail}`);
  },
  error(colId: string, detail: string): void {
    console.error(`  ${pad(colId, COL_W)}  ${'error'.padEnd(VERB_W)}  ${detail}`);
  },
};

// ---------------------------------------------------------------------------
// Pre-run warnings — called after plan, before execute
// ---------------------------------------------------------------------------

export function reportWarnings(col: Collection, plan: WorkPlan): void {
  for (const id of plan.missingRaw) {
    log.warn(col.id, `drawn in JSON but raw PNG missing  ${id}`);
  }
  for (const id of plan.orphanedFull) {
    log.warn(col.id, `orphaned full WebP (no JSON entry)  ${id}`);
  }
  for (const id of plan.orphanedThumb) {
    log.warn(col.id, `orphaned thumb (no JSON entry)  ${id}`);
  }
}

// ---------------------------------------------------------------------------
// Types for the final summary
// ---------------------------------------------------------------------------

export interface CollectionSummary {
  col: Collection;
  plan: WorkPlan;
  result: ExecutionResult;
  drawnCount: number;
}

// ---------------------------------------------------------------------------
// Final summary — printed once after all collections finish
// ---------------------------------------------------------------------------

function plural(n: number, word: string): string {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`;
}

export function printSummary(
  summaries: CollectionSummary[],
  version: string,
  durationMs: number,
): void {
  const divider = '─'.repeat(50);

  console.log('');
  console.log(`  ${divider}`);

  for (const { col, result, drawnCount } of summaries) {
    const hasErrors = result.failed.length > 0;
    const status = hasErrors ? `✗ ${plural(result.failed.length, 'error')}` : '✓ clean';
    const newLabel = result.registered.length > 0
      ? `  ${plural(result.registered.length, 'new')}`
      : '';

    console.log(
      `  ${col.emoji} ${pad(col.label, COL_W + 2)}` +
        `  ${pad(String(drawnCount) + ' drawn', 10)}` +
        `${newLabel.padEnd(12)}` +
        `  ${status}`,
    );

    if (hasErrors) {
      for (const { id, reason } of result.failed) {
        console.error(`    ✗ ${id}  ${reason}`);
      }
    }
  }

  console.log(`  ${divider}`);
  console.log(`  ${version}   ${(durationMs / 1000).toFixed(2)}s`);
  console.log('');
}
