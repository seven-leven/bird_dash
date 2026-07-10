/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { planWork } from './plan.ts';

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
