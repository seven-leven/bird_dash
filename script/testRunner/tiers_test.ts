import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { groupByTier, isTier, TIER_ORDER, tierOf } from './tiers.ts';

test('the tier comes from the file-name suffix', () => {
  assertEquals(tierOf('src/composables/core/useHashRoute_test.ts'), 'unit');
  assertEquals(tierOf('src/composables/core/useHashRoute_dom_test.ts'), 'dom');
  assertEquals(tierOf('src/journeys/search_journey_test.ts'), 'journey');
  assertEquals(tierOf('src/composables/core/useHashRoute_prop_test.ts'), 'prop');
  assertEquals(tierOf('script/lib/collections_contract_test.ts'), 'contract');
});

test('the longer suffix wins over the plain _test.ts', () => {
  // "x_dom_test.ts" also ends with "_test.ts"; it must not fall through to unit
  assertEquals(tierOf('a/b_dom_test.ts'), 'dom');
  assertEquals(tierOf('a/b_journey_test.ts'), 'journey');
  assertEquals(tierOf('a/b_prop_test.ts'), 'prop');
});

test('Windows-style paths are understood', () => {
  assertEquals(tierOf('src\\stores\\search_dom_test.ts'), 'dom');
});

test('a file that is not a test is rejected rather than guessed', () => {
  assertThrows(() => tierOf('src/lib/flashItem.ts'), Error, 'not a test file');
});

test('groupByTier puts every file in exactly one tier and keeps empty tiers', () => {
  const groups = groupByTier(['a_test.ts', 'b_dom_test.ts', 'c_test.ts']);
  assertEquals(groups.unit, ['a_test.ts', 'c_test.ts']);
  assertEquals(groups.dom, ['b_dom_test.ts']);
  assertEquals(groups.prop, []);
  assertEquals(Object.keys(groups), TIER_ORDER);
});

test('isTier accepts real tiers only', () => {
  assertEquals(isTier('prop'), true);
  assertEquals(isTier('e2e'), false);
  assertEquals(isTier('toString'), false); // not a prototype-property false positive
});
