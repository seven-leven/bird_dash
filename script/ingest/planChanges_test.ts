import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { countBlockingIssues, planChanges } from './planChanges.ts';

const set = (...ids: string[]) => new Set(ids);

test('planChanges derives every bucket from set arithmetic', () => {
  const plan = planChanges({
    drawnIds: set('001', '002'),
    extraIds: new Set<string>(), // marked drawn in JSON
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
    extraIds: new Set<string>(),
    sourceIds: set(), // raw_png/ is gitignored, so CI never has it
    fullIds: set('001'),
    thumbIds: set('001'),
    smallIds: set('001'),
  });
  assertEquals(clean.missingSource, ['001']);
  assertEquals(countBlockingIssues(clean), 0);

  const broken = planChanges({
    drawnIds: set('001', '002'),
    extraIds: new Set<string>(), // 002 has neither a full image nor a thumb
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
    drawnIds: set('001', '009'),
    extraIds: new Set<string>(), // 009 drawn in JSON but…
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
    extraIds: new Set<string>(),
    sourceIds: set('001', '002'),
    fullIds: set('001', '002'),
    thumbIds: set('001', '002', '777'), // 002 has no small size; 777 is no item's
    smallIds: set('001', '888'), // 888 is no item's either
  });
  assertEquals(plan.toRepairThumb, ['002']);
  assertEquals(plan.orphanedThumb.sort(), ['777', '888']);
});

test("an item's other images are full WebPs to make, never drawings to register", () => {
  const plan = planChanges({
    drawnIds: set('001'),
    extraIds: set('001-2', '001-3'), // the list counts three images
    sourceIds: set('001', '001-2', '001-3', '001-4'), // and a fourth it does not count
    fullIds: set('001', '001-3', '002-2'), // 002-2 belongs to nothing drawn
    thumbIds: set('001'),
    smallIds: set('001'),
  });
  assertEquals(plan.toRegister, []);
  assertEquals(plan.toTranscode, []);
  assertEquals(plan.toTranscodeExtra, ['001-2']);
  assertEquals(plan.toRepairThumb, []); // an extra image has no thumbnail
  assertEquals(plan.uncountedSource, ['001-4']);
  assertEquals(plan.orphanedFull, ['002-2']);
  assertEquals(countBlockingIssues(plan), 2); // the missing 001-2, the orphaned 002-2
});

test("an extra image with no source art is noted, like a drawing's", () => {
  const plan = planChanges({
    drawnIds: set('001'),
    extraIds: set('001-2'),
    sourceIds: set('001'),
    fullIds: set('001'),
    thumbIds: set('001'),
    smallIds: set('001'),
  });
  assertEquals(plan.missingSource, ['001-2']);
});
