// What ingesting a collection would change, decided from a scan alone: pure set
// arithmetic, no files (docs/SCRIPTS.md, principle 3).
import type { SourceScan } from './scanSources.ts';

export interface ChangePlan {
  /** Source art with no `drawn` date in the list yet: date it. */
  toRegister: string[];
  /** Drawn items with no full WebP: make the full image and the thumbnail. */
  toTranscode: string[];
  /** An item's other images (`001-2`) with no full WebP: make the full image alone. */
  toTranscodeExtra: string[];
  /** Drawn items with a full WebP but a thumbnail size missing: make both sizes from it. */
  toRepairThumb: string[];
  /** Drawn items with no source art (a warning: raw_png/ is not in git, so CI never has it). */
  missingSource: string[];
  /** Source art for an image the list does not count (`001-4` of an item with three; a warning). */
  uncountedSource: string[];
  /** Full WebPs and thumbnails (of either size) with no item in the list (a warning). */
  orphanedFull: string[];
  orphanedThumb: string[];
}

const minus = (a: Set<string>, b: Set<string>): string[] => [...a].filter((id) => !b.has(id));

export function planChanges(scan: SourceScan): ChangePlan {
  const { drawnIds, extraIds, sourceIds, fullIds, thumbIds, smallIds } = scan;
  // A thumbnail is whole only in both sizes; a file of either size alone is still one.
  const wholeThumbs = new Set([...thumbIds].filter((id) => smallIds.has(id)));
  const anyThumb = new Set([...thumbIds, ...smallIds]);
  // An item's other images are `<id>-<n>`; only a bare id is a drawing to register.
  const isExtra = (id: string) => id.includes('-');
  // Source art about to be registered counts as drawn for the rest of the plan.
  const toRegister = minus(sourceIds, drawnIds).filter((id) => !isExtra(id));
  const allDrawn = new Set([...drawnIds, ...toRegister]);
  const allImages = new Set([...allDrawn, ...extraIds]);

  return {
    toRegister,
    toTranscode: minus(allDrawn, fullIds), // the thumbnail is made with it
    toTranscodeExtra: minus(extraIds, fullIds),
    toRepairThumb: minus(allDrawn, wholeThumbs).filter((id) => fullIds.has(id)),
    missingSource: minus(new Set([...drawnIds, ...extraIds]), sourceIds),
    uncountedSource: minus(sourceIds, allImages).filter(isExtra),
    orphanedFull: minus(fullIds, allImages),
    orphanedThumb: minus(anyThumb, allDrawn),
  };
}

/**
 * The problems that fail `npm run check`. Missing source art is left out on purpose:
 * raw_png/ is not in git, so CI never has it and every drawn item would count.
 */
export function countBlockingIssues(plan: ChangePlan): number {
  return plan.toRegister.length + plan.toTranscode.length + plan.toTranscodeExtra.length +
    plan.toRepairThumb.length + plan.orphanedFull.length + plan.orphanedThumb.length;
}
