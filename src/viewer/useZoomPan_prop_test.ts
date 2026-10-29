import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../testing/propertyRuns.ts';
import { clampScale, pinchScale, swipeDirection } from './useZoomPan.ts';

// Any number a gesture could plausibly feed in — including the awkward ones.
const anyNumber = fc.double({ noNaN: false });

test('for any number, the zoom is kept to a usable scale in [1, 5]', () => {
  assertProperty(
    fc.property(anyNumber, (x) => {
      const y = clampScale(x);
      assert(y >= 1 && y <= 5, `clampScale(${x}) = ${y}`);
    }),
    { numRuns: 1000 },
  );
});

test('for any numbers, keeping the zoom in range is idempotent and monotonic', () => {
  assertProperty(
    fc.property(fc.double({ noNaN: true }), fc.double({ noNaN: true }), (a, b) => {
      assertEquals(clampScale(clampScale(a)), clampScale(a));
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      assert(clampScale(lo) <= clampScale(hi));
    }),
    { numRuns: 1000 },
  );
});

test('for any spread, an unchanged pinch keeps the zoom and a pinch scales it linearly', () => {
  const pos = fc.double({ min: 0.01, max: 1e4, noNaN: true });
  assertProperty(
    fc.property(pos, pos, (scale, dist) => {
      assertEquals(pinchScale(scale, dist, dist), scale);
      const doubled = pinchScale(scale, dist, dist * 2);
      assert(Math.abs(doubled - scale * 2) <= scale * 2 * 1e-9);
    }),
  );
});

test('for any drag, swiping right is the mirror image of swiping left', () => {
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

test('for any drag, a mostly vertical one is never a swipe', () => {
  const d = fc.double({ min: -1e4, max: 1e4, noNaN: true });
  assertProperty(
    fc.property(d, d, (dx, dy) => {
      if (Math.abs(dx) < Math.abs(dy) * 2) assertEquals(swipeDirection(dx, dy), null);
    }),
    { numRuns: 1000 },
  );
});
