/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../../../test/prop.ts';
import { clampScale, pinchScale, swipeDirection } from './useLightBox.ts';

// Any number a gesture could plausibly feed in — including the awkward ones.
const anyNumber = fc.double({ noNaN: false });

Deno.test('property: clampScale always returns a usable scale in [1, 5]', () => {
  assertProperty(
    fc.property(anyNumber, (x) => {
      const y = clampScale(x);
      assert(y >= 1 && y <= 5, `clampScale(${x}) = ${y}`);
    }),
    { numRuns: 1000 },
  );
});

Deno.test('property: clampScale is idempotent and monotonic', () => {
  assertProperty(
    fc.property(fc.double({ noNaN: true }), fc.double({ noNaN: true }), (a, b) => {
      assertEquals(clampScale(clampScale(a)), clampScale(a));
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      assert(clampScale(lo) <= clampScale(hi));
    }),
    { numRuns: 1000 },
  );
});

Deno.test('property: pinchScale is the identity for unchanged spread and scales linearly', () => {
  const pos = fc.double({ min: 0.01, max: 1e4, noNaN: true });
  assertProperty(
    fc.property(pos, pos, (scale, dist) => {
      assertEquals(pinchScale(scale, dist, dist), scale);
      const doubled = pinchScale(scale, dist, dist * 2);
      assert(Math.abs(doubled - scale * 2) <= scale * 2 * 1e-9);
    }),
  );
});

Deno.test('property: swiping right is the mirror image of swiping left', () => {
  const d = fc.double({ min: -1e4, max: 1e4, noNaN: true });
  assertProperty(
    fc.property(d, d, (dx, dy) => {
      const flip = { next: 'prev', prev: 'next' } as const;
      const fwd = swipeDirection(dx, dy);
      const back = swipeDirection(-dx, dy);
      assertEquals(back, fwd === null ? null : flip[fwd]);
    }),
    { numRuns: 1000 },
  );
});

Deno.test('property: a mostly-vertical drag is never a swipe', () => {
  const d = fc.double({ min: -1e4, max: 1e4, noNaN: true });
  assertProperty(
    fc.property(d, d, (dx, dy) => {
      if (Math.abs(dx) < Math.abs(dy) * 2) assertEquals(swipeDirection(dx, dy), null);
    }),
    { numRuns: 1000 },
  );
});
