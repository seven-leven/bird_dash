import { COLLECTIONS } from '../collection/registry.ts';
import type { Collection } from '../collection/registry.ts';
import type { CollectionState } from './scan.ts';
import type { WorkPlan } from './plan.ts';
import type { ExecutionResult } from './execute.ts';

// ---------------------------------------------------------------------------
// Column widths — derived from collection data once
// ---------------------------------------------------------------------------

const COL_W = Math.max(...COLLECTIONS.map((c) => c.id.length));
const VERB_W = 14;

function pad(s: string, w: number) {
  return s.padEnd(w);
}

function plural(n: number, word: string): string {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`;
}

// ---------------------------------------------------------------------------
// Live log — called during execution from execute.ts
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
    // In CI, raw PNGs are intentionally absent — only warn if we'd need them
    if (plan.toTranscode.includes(id)) {
      log.warn(col.id, `drawn in JSON but raw PNG missing — cannot transcode  ${id}`);
    }
  }
  // orphan warnings unchanged
  for (const id of plan.orphanedFull) {
    log.warn(col.id, `orphaned full WebP (not in JSON)  ${id}`);
  }
  for (const id of plan.orphanedThumb) {
    log.warn(col.id, `orphaned thumb (not in JSON)  ${id}`);
  }
}

// ---------------------------------------------------------------------------
// Summary types
// ---------------------------------------------------------------------------

export interface CollectionSummary {
  col: Collection;
  plan: WorkPlan;
  result: ExecutionResult;
  drawnCount: number;
}

// ---------------------------------------------------------------------------
// Build summary — printed once after all collections finish
// ---------------------------------------------------------------------------

export function printSummary(
  summaries: CollectionSummary[],
  version: string,
  durationMs: number,
): void {
  const divider = '─'.repeat(52);
  console.log(`\n  ${divider}`);

  for (const { col, result, drawnCount } of summaries) {
    const hasErrors = result.failed.length > 0;
    const status = hasErrors ? `✗ ${plural(result.failed.length, 'error')}` : '✓';
    const newLabel = result.registered.length > 0 ? `  +${result.registered.length} new` : '';

    console.log(
      `  ${col.emoji} ${pad(col.label, COL_W + 2)}` +
        `  ${pad(String(drawnCount) + ' drawn', 10)}` +
        `${newLabel.padEnd(10)}` +
        `  ${status}`,
    );

    for (const { id, reason } of result.failed) {
      console.error(`      ✗ ${id}  ${reason}`);
    }
  }

  console.log(`  ${divider}`);
  console.log(`  ${version}   ${(durationMs / 1000).toFixed(2)}s\n`);
}

// ---------------------------------------------------------------------------
// Check report — read-only, printed by --check mode
// ---------------------------------------------------------------------------

export function printCheckReport(
  rows: Array<{ col: Collection; state: CollectionState; plan: WorkPlan }>,
  version: string,
): void {
  const divider = '─'.repeat(52);
  console.log(`\n  ${divider}`);
  console.log(`  ${version}`);
  console.log(`  ${divider}`);

  for (const { col, state, plan } of rows) {
    const issues = [
      ...plan.missingRaw.map((id) => `missing raw PNG       ${id}`),
      ...plan.toRegister.map((id) => `unregistered PNG      ${id}`),
      ...plan.toTranscode.map((id) => `missing full WebP     ${id}`),
      ...plan.toTranscodeThumb.map((id) => `missing thumb         ${id}`),
      ...plan.orphanedFull.map((id) => `orphaned full WebP    ${id}`),
      ...plan.orphanedThumb.map((id) => `orphaned thumb        ${id}`),
    ];

    const status = issues.length === 0 ? '✓' : `✗ ${plural(issues.length, 'issue')}`;

    console.log(
      `  ${col.emoji} ${pad(col.label, COL_W + 2)}` +
        `  ${pad(String(state.drawnIds.size) + ' drawn', 10)}` +
        `  ${pad(String(state.rawIds.size) + ' raw', 8)}` +
        `  ${status}`,
    );

    for (const msg of issues) {
      console.log(`      ${msg}`);
    }
  }

  console.log(`  ${divider}\n`);
}
