// Carrying out a collection's plan, and nothing it did not say: date the new drawings,
// make the missing images, repair the missing thumbnails. Each step is reported as it
// happens; a failed image is recorded and the rest go on.
import { markDrawn } from '../lib/lists.ts';
import type { Collection } from '../lib/collections.ts';
import { type Io, realIo } from '../lib/io.ts';
import { sharpTranscoder, type Transcoder } from './transcodeImages.ts';
import { formatStep } from './formatIngestReport.ts';
import type { ChangePlan } from './planChanges.ts';

export interface Failure {
  id: string;
  reason: string;
}

export interface AppliedChanges {
  /** Ids dated as drawn. */
  registered: string[];
  failures: Failure[];
}

export async function applyChanges(
  collection: Collection,
  plan: ChangePlan,
  options: { date: string; io?: Io; transcoder?: Transcoder },
): Promise<AppliedChanges> {
  const { date, io = realIo, transcoder = sharpTranscoder } = options;
  const step = (verb: string, detail: string) => io.out(formatStep(collection.id, verb, detail));
  const fail = (detail: string) => io.err(formatStep(collection.id, 'error', detail));
  const applied: AppliedChanges = { registered: [], failures: [] };

  for (const id of plan.toRegister) {
    const name = await markDrawn(collection, id, date, io);
    if (name) {
      applied.registered.push(id);
      step('registered', `${name} (${id})`);
    } else {
      step('warn', `no item ${id} in the list; its source art is skipped`);
    }
  }

  for (const id of plan.toTranscode) {
    step('making', id);
    const made = await transcoder.full(collection, id);
    if (!made.ok) {
      applied.failures.push({ id, reason: made.error });
      fail(`could not make  ${id}  ${made.error}`);
    }
  }

  for (const id of plan.toTranscodeExtra) {
    step('making', id);
    const made = await transcoder.extra(collection, id);
    if (!made.ok) {
      applied.failures.push({ id, reason: made.error });
      fail(`could not make  ${id}  ${made.error}`);
    }
  }

  for (const id of plan.toRepairThumb) {
    step('repairing', id);
    const made = await transcoder.thumb(collection, id);
    if (!made.ok) {
      applied.failures.push({ id, reason: made.error });
      fail(`could not repair the thumbnail  ${id}  ${made.error}`);
    }
  }

  return applied;
}
