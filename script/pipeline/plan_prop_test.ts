/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../test/helpers/prop.ts';
import { blockingIssues, planWork } from './plan.ts';

// Small id pool so the four sets overlap a lot (that's where the bugs live).
const POOL: string[] = ['001', '002', '003', '004', '005', '006', '007', '008'];
const ids = fc.uniqueArray(fc.constantFrom(...POOL));
const state = fc.record({ drawn: ids, raw: ids, full: ids, thumb: ids }).map((s) => ({
  drawnIds: new Set(s.drawn),
  rawIds: new Set(s.raw),
  fullIds: new Set(s.full),
  thumbIds: new Set(s.thumb),
}));

const sorted = (a: Iterable<string>) => [...a].sort();
const minus = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x));

Deno.test('property: every bucket is exactly the set difference the docs promise', () => {
  assertProperty(
    fc.property(state, (s) => {
      const plan = planWork(s);
      const allDrawn = new Set([...s.drawnIds, ...minus(s.rawIds, s.drawnIds)]);

      assertEquals(sorted(plan.toRegister), sorted(minus(s.rawIds, s.drawnIds)));
      assertEquals(sorted(plan.toTranscode), sorted(minus(allDrawn, s.fullIds)));
      assertEquals(
        sorted(plan.toTranscodeThumb),
        sorted(minus(allDrawn, s.thumbIds).filter((id) => s.fullIds.has(id))),
      );
      assertEquals(sorted(plan.missingRaw), sorted(minus(s.drawnIds, s.rawIds)));
      assertEquals(sorted(plan.orphanedFull), sorted(minus(s.fullIds, allDrawn)));
      assertEquals(sorted(plan.orphanedThumb), sorted(minus(s.thumbIds, allDrawn)));
    }),
    { numRuns: 500 },
  );
});

Deno.test('property: carrying out a plan leaves nothing left to do', () => {
  assertProperty(
    fc.property(state, (s) => {
      const first = planWork(s);
      // Simulate executeWork: register new PNGs, transcode (full + thumb), repair thumbs.
      const after = {
        drawnIds: new Set([...s.drawnIds, ...first.toRegister]),
        rawIds: s.rawIds,
        fullIds: new Set([...s.fullIds, ...first.toTranscode]),
        thumbIds: new Set([...s.thumbIds, ...first.toTranscode, ...first.toTranscodeThumb]),
      };
      const second = planWork(after);

      assertEquals(second.toRegister, []);
      assertEquals(second.toTranscode, []);
      assertEquals(second.toTranscodeThumb, []);
    }),
    { numRuns: 500 },
  );
});

Deno.test('property: a fully consistent state has no blocking issues', () => {
  assertProperty(
    fc.property(ids, (drawn) => {
      const set = new Set(drawn);
      // every drawn id has raw, full and thumb; nothing else exists
      const plan = planWork({ drawnIds: set, rawIds: set, fullIds: set, thumbIds: set });
      assertEquals(blockingIssues(plan), 0);
    }),
  );
});
