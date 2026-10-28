import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { countBlockingIssues, planChanges } from './planChanges.ts';

const set = (...ids: string[]) => new Set(ids);

test('planChanges derives every bucket from set arithmetic', () => {
  const plan = planChanges({
    drawnIds: set('001', '002'), // marked drawn in JSON
    sourceIds: set('001', '002', '003'), // 003 has a raw PNG but no JSON entry yet
    fullIds: set('001'), // only 001 has a full WebP
    thumbIds: set(),
    smallIds: set(), // no thumbs yet
  });

  assertEquals(plan.toRegister, ['003']); // raw but not yet drawn
  // allDrawn = {001,002,003}; missing full → transcode
  assertEquals(plan.toTranscode.sort(), ['002', '003']);
  // has full but missing thumb → thumb repair
  assertEquals(plan.toRepairThumb, ['001']);
  assertEquals(plan.missingSource, []); // every drawn id has a raw PNG
  assertEquals(plan.orphanedFull, []);
  assertEquals(plan.orphanedThumb, []);
});

test('countBlockingIssues counts real problems but not missing raw PNGs (absent in CI)', () => {
  const clean = planChanges({
    drawnIds: set('001'),
    sourceIds: set(), // raw_png/ is gitignored, so CI never has it
    fullIds: set('001'),
    thumbIds: set('001'),
    smallIds: set('001'),
  });
  assertEquals(clean.missingSource, ['001']);
  assertEquals(countBlockingIssues(clean), 0);

  const broken = planChanges({
    drawnIds: set('001', '002'), // 002 has neither a full image nor a thumb
    sourceIds: set(),
    fullIds: set('001', '777'), // 777 is an orphan
    thumbIds: set('001'),
    smallIds: set('001'),
  });
  // 002 needs transcoding (1) + orphaned full 777 (1)
  assertEquals(countBlockingIssues(broken), 2);
});

test('planChanges flags orphans and missing raws', () => {
  const plan = planChanges({
    drawnIds: set('001', '009'), // 009 drawn in JSON but…
    sourceIds: set('001'), // …no raw PNG for it
    fullIds: set('001', '777'), // 777 full WebP with no JSON entry
    thumbIds: set('888'),
    smallIds: set('888'), // 888 thumb with no JSON entry
  });

  assertEquals(plan.missingSource, ['009']);
  assertEquals(plan.orphanedFull, ['777']);
  assertEquals(plan.orphanedThumb, ['888']);
});

test('a thumbnail is whole in both sizes: either missing is repaired, either alone is an orphan', () => {
  const plan = planChanges({
    drawnIds: set('001', '002'),
    sourceIds: set('001', '002'),
    fullIds: set('001', '002'),
    thumbIds: set('001', '002', '777'), // 002 has no small size; 777 is no item's
    smallIds: set('001', '888'), // 888 is no item's either
  });
  assertEquals(plan.toRepairThumb, ['002']);
  assertEquals(plan.orphanedThumb.sort(), ['777', '888']);
});
