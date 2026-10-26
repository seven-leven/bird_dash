// What ingesting a collection would change, decided from a scan alone: pure set
// arithmetic, no files (docs/SCRIPTS.md, principle 3).
import type { SourceScan } from './scanSources.ts';

export interface ChangePlan {
  /** Source art with no `drawn` date in the list yet: date it. */
  toRegister: string[];
  /** Drawn items with no full WebP: make the full image and the thumbnail. */
  toTranscode: string[];
  /** Drawn items with a full WebP but no thumbnail: make the thumbnail from it. */
  toRepairThumb: string[];
  /** Drawn items with no source art (a warning: raw_png/ is not in git, so CI never has it). */
  missingSource: string[];
  /** Full WebPs and thumbnails with no item in the list (a warning). */
  orphanedFull: string[];
  orphanedThumb: string[];
}

const minus = (a: Set<string>, b: Set<string>): string[] => [...a].filter((id) => !b.has(id));

export function planChanges(scan: SourceScan): ChangePlan {
  const { drawnIds, sourceIds, fullIds, thumbIds } = scan;
  // Source art about to be registered counts as drawn for the rest of the plan.
  const toRegister = minus(sourceIds, drawnIds);
  const allDrawn = new Set([...drawnIds, ...toRegister]);

  return {
    toRegister,
    toTranscode: minus(allDrawn, fullIds), // the thumbnail is made with it
    toRepairThumb: minus(allDrawn, thumbIds).filter((id) => fullIds.has(id)),
    missingSource: minus(drawnIds, sourceIds),
    orphanedFull: minus(fullIds, allDrawn),
    orphanedThumb: minus(thumbIds, allDrawn),
  };
}

/**
 * The problems that fail `npm run check`. Missing source art is left out on purpose:
 * raw_png/ is not in git, so CI never has it and every drawn item would count.
 */
export function countBlockingIssues(plan: ChangePlan): number {
  return plan.toRegister.length + plan.toTranscode.length + plan.toRepairThumb.length +
    plan.orphanedFull.length + plan.orphanedThumb.length;
}
