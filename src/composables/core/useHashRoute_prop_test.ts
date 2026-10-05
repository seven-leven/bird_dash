/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import * as fc from 'fast-check';
import { assertProperty } from '../../../test/prop.ts';
import { buildHash, parseHash } from './useHashRoute.ts';

// ids that can legally appear in a URL segment of ours: no '/', no '#'
const segment = fc.stringMatching(/^[a-zA-Z0-9_-]{1,16}$/);

Deno.test('property: parseHash inverts buildHash for any collection and item', () => {
  assertProperty(
    fc.property(segment, fc.oneof(fc.constant(''), segment), (collectionId, itemId) => {
      assertEquals(parseHash(`#${buildHash(collectionId, itemId)}`), { collectionId, itemId });
    }),
  );
});

Deno.test('property: parseHash never throws and never returns a "/" inside an id', () => {
  assertProperty(
    fc.property(fc.string(), (hash) => {
      const { collectionId, itemId } = parseHash(hash);
      assert(!collectionId.includes('/') && !itemId.includes('/'));
    }),
    { numRuns: 500 },
  );
});

Deno.test('property: a leading "#" or "#/" prefix makes no difference', () => {
  assertProperty(
    fc.property(segment, segment, (c, i) => {
      const body = buildHash(c, i);
      assertEquals(parseHash(`#${body}`), parseHash(`#/${body}`));
    }),
  );
});
