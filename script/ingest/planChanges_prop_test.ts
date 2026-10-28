import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../../src/testing/propertyRuns.ts';
import { countBlockingIssues, planChanges } from './planChanges.ts';

// Small id pool so the four sets overlap a lot (that's where the bugs live).
const POOL: string[] = ['001', '002', '003', '004', '005', '006', '007', '008'];
const ids = fc.uniqueArray(fc.constantFrom(...POOL));
const state = fc.record({ drawn: ids, source: ids, full: ids, thumb: ids }).map((s) => ({
  drawnIds: new Set(s.drawn),
  extraIds: new Set<string>(),
  sourceIds: new Set(s.source),
  fullIds: new Set(s.full),
  thumbIds: new Set(s.thumb),
  smallIds: new Set(s.thumb),
}));

const sorted = (a: Iterable<string>) => [...a].sort();
const minus = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x));

test('property: every bucket is exactly the set difference the docs promise', () => {
  assertProperty(
    fc.property(state, (s) => {
      const plan = planChanges(s);
      const allDrawn = new Set([...s.drawnIds, ...minus(s.sourceIds, s.drawnIds)]);

      assertEquals(sorted(plan.toRegister), sorted(minus(s.sourceIds, s.drawnIds)));
      assertEquals(sorted(plan.toTranscode), sorted(minus(allDrawn, s.fullIds)));
      assertEquals(
        sorted(plan.toRepairThumb),
        sorted(minus(allDrawn, s.thumbIds).filter((id) => s.fullIds.has(id))),
      );
      assertEquals(sorted(plan.missingSource), sorted(minus(s.drawnIds, s.sourceIds)));
      assertEquals(sorted(plan.orphanedFull), sorted(minus(s.fullIds, allDrawn)));
      assertEquals(sorted(plan.orphanedThumb), sorted(minus(s.thumbIds, allDrawn)));
    }),
    { numRuns: 500 },
  );
});

test('property: carrying out a plan leaves nothing left to do', () => {
  assertProperty(
    fc.property(state, (s) => {
      const first = planChanges(s);
      // Simulate applyChanges: register new PNGs, transcode (full + thumb), repair thumbs.
      const after = {
        drawnIds: new Set([...s.drawnIds, ...first.toRegister]),
        extraIds: new Set<string>(),
        sourceIds: s.sourceIds,
        fullIds: new Set([...s.fullIds, ...first.toTranscode]),
        thumbIds: new Set([...s.thumbIds, ...first.toTranscode, ...first.toRepairThumb]),
        smallIds: new Set([...s.smallIds, ...first.toTranscode, ...first.toRepairThumb]),
      };
      const second = planChanges(after);

      assertEquals(second.toRegister, []);
      assertEquals(second.toTranscode, []);
      assertEquals(second.toRepairThumb, []);
    }),
    { numRuns: 500 },
  );
});

test('property: a fully consistent state has no blocking issues', () => {
  assertProperty(
    fc.property(ids, (drawn) => {
      const set = new Set(drawn);
      // every drawn id has raw, full and thumb; nothing else exists
      const plan = planChanges({
        drawnIds: set,
        extraIds: new Set<string>(),
        sourceIds: set,
        fullIds: set,
        thumbIds: set,
        smallIds: set,
      });
      assertEquals(countBlockingIssues(plan), 0);
    }),
  );
});
