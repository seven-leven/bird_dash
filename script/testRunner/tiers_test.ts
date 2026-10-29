import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { groupByTier, isTier, TIER_ORDER, tierOf, tiersMarkdown, vitestProjects } from './tiers.ts';

test('the tier comes from the file-name suffix', () => {
  assertEquals(tierOf('src/app/useHashRoute_test.ts'), 'unit');
  assertEquals(tierOf('src/app/useHashRoute_dom_test.ts'), 'dom');
  assertEquals(tierOf('src/journeys/search_journey_test.ts'), 'journey');
  assertEquals(tierOf('src/app/useHashRoute_prop_test.ts'), 'prop');
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
  assertThrows(() => tierOf('src/gallery/flashTile.ts'), Error, 'not a test file');
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

test('Vitest gets one project per environment, worked out from the table', () => {
  // The same projects vite.config.ts spelled out by hand before the table.
  assertEquals(vitestProjects(), [
    {
      extends: true,
      test: {
        name: 'node',
        include: ['src/**/*_test.ts', 'script/**/*_test.ts'],
        exclude: [
          '**/*_dom_test.ts',
          '**/*_journey_test.ts',
          '**/*_browser_test.ts',
          '**/node_modules/**',
        ],
        environment: 'node',
      },
    },
    {
      extends: true,
      test: {
        name: 'dom',
        include: ['src/**/*_dom_test.ts', 'src/**/*_journey_test.ts'],
        exclude: ['**/node_modules/**'],
        environment: 'happy-dom',
        setupFiles: ['src/testing/domSetup.ts'],
      },
    },
    {
      extends: true,
      test: {
        name: 'browser',
        include: ['src/**/*_browser_test.ts'],
        exclude: ['**/node_modules/**'],
        environment: 'node',
        testTimeout: 30_000,
      },
    },
  ]);
});

test("the docs' table of tiers is a row per tier, in order", () => {
  const rows = tiersMarkdown();
  assertEquals(rows.length, TIER_ORDER.length);
  assertEquals(
    rows[0],
    '| `unit` | `x_test.ts` | Pure logic. Start here | `testing/fixtures.ts` |',
  );
  assertEquals(
    rows.at(-1),
    '| `browser` | `x_browser_test.ts` | What only a real browser shows: layout, touch, clipping, focus. On the built site | `testing/realBrowser.ts` (`openSite`) |',
  );
});
