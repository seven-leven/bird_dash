import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../testing/propertyRuns.ts';
import { buildHash, parseHash } from './useHashRoute.ts';

// ids that can legally appear in a URL segment of ours: no '/', no '#'
const anySegment = fc.stringMatching(/^[a-zA-Z0-9_-]{1,16}$/);

test('for any collection and item, reading the address back gives what was written', () => {
  assertProperty(
    fc.property(anySegment, fc.oneof(fc.constant(''), anySegment), (collectionId, itemId) => {
      assertEquals(parseHash(`#${buildHash(collectionId, itemId)}`), { collectionId, itemId });
    }),
  );
});

test('for any address, reading it never throws and never puts a "/" inside an id', () => {
  assertProperty(
    fc.property(fc.string(), (hash) => {
      const { collectionId, itemId } = parseHash(hash);
      assert(!collectionId.includes('/') && !itemId.includes('/'));
    }),
    { numRuns: 500 },
  );
});

test('for any address, a leading "#" or "#/" makes no difference', () => {
  assertProperty(
    fc.property(anySegment, anySegment, (c, i) => {
      const body = buildHash(c, i);
      assertEquals(parseHash(`#${body}`), parseHash(`#/${body}`));
    }),
  );
});
