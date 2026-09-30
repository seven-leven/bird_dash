import type { CollectionState } from './scan.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkPlan {
  toRegister: string[]; // raw PNGs with no drawn date in JSON yet
  toTranscode: string[]; // drawn items missing both full + thumb WebPs
  toTranscodeThumb: string[]; // drawn items with full WebP but missing thumb
  missingRaw: string[]; // drawn items with no raw PNG (warn only)
  orphanedFull: string[]; // full WebPs with no JSON entry (warn only)
  orphanedThumb: string[]; // thumb WebPs with no JSON entry (warn only)
}

// ---------------------------------------------------------------------------
// Plan — pure set arithmetic, no I/O
// Fully testable without filesystem mocks.
// ---------------------------------------------------------------------------

/**
 * Problems that make `deno task check` fail. `missingRaw` is deliberately
 * excluded: raw PNGs are gitignored, so CI never has them and every drawn item
 * would trip it.
 */
export function blockingIssues(plan: WorkPlan): number {
  return plan.toRegister.length + plan.toTranscode.length + plan.toTranscodeThumb.length +
    plan.orphanedFull.length + plan.orphanedThumb.length;
}

function diff(a: Set<string>, b: Set<string>): string[] {
  return Array.from(a).filter((id) => !b.has(id));
}

export function planWork(state: CollectionState): WorkPlan {
  const { drawnIds, rawIds, fullIds, thumbIds } = state;

  // Items that will be registered get promoted into drawnIds for the
  // rest of the plan so downstream steps see the complete picture.
  const toRegister = diff(rawIds, drawnIds);
  const allDrawn = new Set([...drawnIds, ...toRegister]);

  return {
    toRegister,
    toTranscode: diff(allDrawn, fullIds), // missing full (thumb will be co-produced)
    toTranscodeThumb: diff(allDrawn, thumbIds).filter((id) => fullIds.has(id)), // has full, missing thumb
    missingRaw: diff(drawnIds, rawIds), // warn only
    orphanedFull: diff(fullIds, allDrawn), // warn only
    orphanedThumb: diff(thumbIds, allDrawn), // warn only
  };
}
