/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from '@std/assert';
import { groupByTier, isTier, TIER_ORDER, tierOf } from './tiers.ts';

Deno.test('the tier comes from the file-name suffix', () => {
  assertEquals(tierOf('src/composables/useHashRoute_test.ts'), 'unit');
  assertEquals(tierOf('src/composables/useHashRoute_dom_test.ts'), 'dom');
  assertEquals(tierOf('src/composables/useHashRoute_prop_test.ts'), 'prop');
  assertEquals(tierOf('script/collection/data_contract_test.ts'), 'contract');
});

Deno.test('the longer suffix wins over the plain _test.ts', () => {
  // "x_dom_test.ts" also ends with "_test.ts"; it must not fall through to unit
  assertEquals(tierOf('a/b_dom_test.ts'), 'dom');
  assertEquals(tierOf('a/b_prop_test.ts'), 'prop');
});

Deno.test('Windows-style paths are understood', () => {
  assertEquals(tierOf('src\\stores\\search_dom_test.ts'), 'dom');
});

Deno.test('a file that is not a test is rejected rather than guessed', () => {
  assertThrows(() => tierOf('src/lib/flashItem.ts'), Error, 'not a test file');
});

Deno.test('groupByTier puts every file in exactly one tier and keeps empty tiers', () => {
  const groups = groupByTier(['a_test.ts', 'b_dom_test.ts', 'c_test.ts']);
  assertEquals(groups.unit, ['a_test.ts', 'c_test.ts']);
  assertEquals(groups.dom, ['b_dom_test.ts']);
  assertEquals(groups.prop, []);
  assertEquals(Object.keys(groups), TIER_ORDER);
});

Deno.test('isTier accepts real tiers only', () => {
  assertEquals(isTier('prop'), true);
  assertEquals(isTier('e2e'), false);
  assertEquals(isTier('toString'), false); // not a prototype-property false positive
});
