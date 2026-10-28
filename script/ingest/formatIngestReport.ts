// What `npm run ingest` says, as lines: the warnings before it starts, each step as it
// happens, what a dry run would do, and the summary at the end. Pure; the command prints.
import { plural } from '../../src/domain/countWords.ts';
import { COLLECTIONS } from '../lib/collections.ts';
import type { Collection } from '../lib/collections.ts';
import { type Line, MARK } from '../lib/cli.ts';
import type { ChangePlan } from './planChanges.ts';
import type { AppliedChanges } from './applyChanges.ts';

/** Columns, so the collections' lines line up. */
const ID_WIDTH = Math.max(...COLLECTIONS.map((collection) => collection.id.length));
const VERB_WIDTH = 14;
const DIVIDER = '─'.repeat(52);

/** One step, as it happens: `  birds  registered      Watercock (029)`. */
export function formatStep(collectionId: string, verb: string, detail: string): string {
  return `  ${collectionId.padEnd(ID_WIDTH)}  ${verb.padEnd(VERB_WIDTH)}  ${detail}`;
}

/** Before ingesting: source art that is needed but missing, and images nothing points to. */
export function formatWarnings(collection: Collection, plan: ChangePlan): Line[] {
  const warn = (detail: string): Line => ({ text: formatStep(collection.id, 'warn', detail) });
  return [
    // Missing source art matters only for an item that still needs its images.
    ...plan.missingSource.filter((id) =>
      plan.toTranscode.includes(id) || plan.toTranscodeExtra.includes(id)
    )
      .map((id) => warn(`drawn in the list but its source art is missing; cannot make  ${id}`)),
    ...plan.orphanedFull.map((id) => warn(`a full WebP with no item in the list  ${id}`)),
    ...plan.orphanedThumb.map((id) => warn(`a thumbnail with no item in the list  ${id}`)),
    ...plan.uncountedSource.map((id) =>
      warn(`source art for an image the list does not count  ${id}`)
    ),
  ];
}

/** What a dry run would do for one collection. */
export function formatDryRun(collection: Collection, plan: ChangePlan): Line[] {
  const would = (verb: string, ids: string[]): Line[] =>
    ids.map((id) => ({ text: formatStep(collection.id, verb, id) }));
  const lines = [
    ...would('would register', plan.toRegister),
    ...would('would make', [...plan.toTranscode, ...plan.toTranscodeExtra]),
    ...would('would repair', plan.toRepairThumb),
  ];
  return lines.length > 0
    ? lines
    : [{ text: formatStep(collection.id, MARK.skipped, 'nothing to do') }];
}

/** One collection's outcome, for the summary. */
export interface IngestSummary {
  collection: Collection;
  applied: AppliedChanges;
  /** Drawn items after ingesting. */
  drawnCount: number;
}

/** The table at the end: each collection's count, what is new, what failed; the version and time. */
export function formatIngestSummary(
  summaries: IngestSummary[],
  versionLine: string,
  durationMs: number,
): Line[] {
  const lines: Line[] = [{ text: `\n  ${DIVIDER}` }];
  for (const { collection, applied, drawnCount } of summaries) {
    const failed = applied.failures.length;
    const status = failed > 0 ? `${MARK.problem} ${plural(failed, 'error')}` : MARK.done;
    const added = applied.registered.length > 0 ? `  +${applied.registered.length} new` : '';
    lines.push({
      text: `  ${collection.emoji} ${collection.label.padEnd(ID_WIDTH + 2)}` +
        `  ${`${drawnCount} drawn`.padEnd(10)}${added.padEnd(10)}  ${status}`,
    });
    for (const { id, reason } of applied.failures) {
      lines.push({ text: `      ${MARK.problem} ${id}  ${reason}`, problem: true });
    }
  }
  lines.push({ text: `  ${DIVIDER}` });
  lines.push({ text: `  ${versionLine}   ${(durationMs / 1000).toFixed(2)}s\n` });
  return lines;
}
