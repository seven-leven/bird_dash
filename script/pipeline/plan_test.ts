/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { blockingIssues, planWork } from './plan.ts';

const set = (...ids: string[]) => new Set(ids);

Deno.test('planWork derives every bucket from set arithmetic', () => {
  const plan = planWork({
    drawnIds: set('001', '002'), // marked drawn in JSON
    rawIds: set('001', '002', '003'), // 003 has a raw PNG but no JSON entry yet
    fullIds: set('001'), // only 001 has a full WebP
    thumbIds: set(), // no thumbs yet
  });

  assertEquals(plan.toRegister, ['003']); // raw but not yet drawn
  // allDrawn = {001,002,003}; missing full → transcode
  assertEquals(plan.toTranscode.sort(), ['002', '003']);
  // has full but missing thumb → thumb repair
  assertEquals(plan.toTranscodeThumb, ['001']);
  assertEquals(plan.missingRaw, []); // every drawn id has a raw PNG
  assertEquals(plan.orphanedFull, []);
  assertEquals(plan.orphanedThumb, []);
});

Deno.test('blockingIssues counts real problems but not missing raw PNGs (absent in CI)', () => {
  const clean = planWork({
    drawnIds: set('001'),
    rawIds: set(), // raw_png/ is gitignored, so CI never has it
    fullIds: set('001'),
    thumbIds: set('001'),
  });
  assertEquals(clean.missingRaw, ['001']);
  assertEquals(blockingIssues(clean), 0);

  const broken = planWork({
    drawnIds: set('001', '002'), // 002 has neither a full image nor a thumb
    rawIds: set(),
    fullIds: set('001', '777'), // 777 is an orphan
    thumbIds: set('001'),
  });
  // 002 needs transcoding (1) + orphaned full 777 (1)
  assertEquals(blockingIssues(broken), 2);
});

Deno.test('planWork flags orphans and missing raws', () => {
  const plan = planWork({
    drawnIds: set('001', '009'), // 009 drawn in JSON but…
    rawIds: set('001'), // …no raw PNG for it
    fullIds: set('001', '777'), // 777 full WebP with no JSON entry
    thumbIds: set('888'), // 888 thumb with no JSON entry
  });

  assertEquals(plan.missingRaw, ['009']);
  assertEquals(plan.orphanedFull, ['777']);
  assertEquals(plan.orphanedThumb, ['888']);
});
