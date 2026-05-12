/// <reference lib="deno.ns" />
import { markDrawn } from '../collection/record.ts';
import { transcode, transcodeThumb } from '../image/transcode.ts';
import { log } from './report.ts';
import type { Collection } from '../collection/registry.ts';
import type { WorkPlan } from './plan.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FailedItem {
  id: string;
  reason: string;
}

export interface ExecutionResult {
  registered: string[];
  transcoded: string[];
  failed: FailedItem[];
}

// ---------------------------------------------------------------------------
// Execute — one pass, no re-scanning
// ---------------------------------------------------------------------------

export async function executeWork(
  col: Collection,
  plan: WorkPlan,
  date: string,
): Promise<ExecutionResult> {
  const registered: string[] = [];
  const transcoded: string[] = [];
  const failed: FailedItem[] = [];

  // 1. Register new raw PNGs into JSON
  for (const id of plan.toRegister) {
    const name = await markDrawn(col, id, date);
    if (name) {
      registered.push(id);
      log.step(col.id, 'registered', `${name} (${id})`);
    } else {
      log.warn(col.id, `id ${id} not found in JSON — skipping`);
    }
  }

  // 2. Transcode items missing a full WebP (produces full + thumb in one pass)
  for (const id of plan.toTranscode) {
    log.step(col.id, 'transcoding', id);
    const result = await transcode(col, id);
    if (result.ok) {
      transcoded.push(id);
    } else {
      failed.push({ id, reason: result.error });
      log.error(col.id, `transcode failed  ${id}  ${result.error}`);
    }
  }

  // 3. Repair thumbnails for items that have a full WebP but no thumb
  for (const id of plan.toTranscodeThumb) {
    log.step(col.id, 'thumb repair', id);
    const result = await transcodeThumb(col, id);
    if (!result.ok) {
      failed.push({ id, reason: result.error });
      log.error(col.id, `thumb repair failed  ${id}  ${result.error}`);
    }
  }

  return { registered, transcoded, failed };
}
