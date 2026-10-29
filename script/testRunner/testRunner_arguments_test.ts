// How `npm test`'s arguments are read: tiers, areas, paths and flags (testRunner.ts, parseArgs).
import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { parseArgs } from './testRunner.ts';

test('no arguments means every tier, in order', () => {
  const o = parseArgs([]);
  assertEquals(o.tiers, ['unit', 'dom', 'journey', 'prop', 'contract']);
  assertEquals([o.verbose, o.failFast, o.coverage, o.minLines], [false, false, false, 0]);
});

test('tier names select tiers (in canonical order, whatever order they were typed)', () => {
  assertEquals(parseArgs(['prop', 'unit']).tiers, ['unit', 'prop']);
});

test('flags are parsed', () => {
  const o = parseArgs(['dom', '-v', '--fail-fast', '--coverage', '--min-lines=70']);
  assertEquals([o.verbose, o.failFast, o.coverage, o.minLines], [true, true, true, 70]);
});

test('unknown tiers and options are rejected with a helpful message', () => {
  assertThrows(
    () => parseArgs(['e2e']),
    Error,
    'tiers: unit, dom, journey, prop, contract, browser; areas: data,',
  );
  assertThrows(() => parseArgs(['--nope']), Error, 'unknown option --nope');
});

test('a coverage floor without --coverage is an error, not silently ignored', () => {
  assertThrows(() => parseArgs(['--min-lines=50']), Error, '--min-lines needs --coverage');
  assertThrows(() => parseArgs(['--min-branches=50']), Error, '--min-branches needs --coverage');
});

test('--report asks for the saved report; it is off by default', () => {
  assertEquals(parseArgs([]).report, false);
  assertEquals(parseArgs(['--coverage', '--report']).report, true);
});

test('--html asks for the HTML coverage report and needs --coverage', () => {
  assertEquals(parseArgs([]).html, false);
  assertEquals(parseArgs(['--coverage', '--html']).html, true);
  assertThrows(() => parseArgs(['--html']), Error, '--html needs --coverage');
});

test('--min-branches sets the branch floor', () => {
  assertEquals(parseArgs(['--coverage']).minBranches, 0);
  assertEquals(parseArgs(['--coverage', '--min-branches=95']).minBranches, 95);
});

/** LCOV with branch counters, for the branch-floor tests. */
test('positional arguments can name areas and paths as well as tiers', () => {
  const o = parseArgs(['dom', 'interface', 'src\\ui\\', './script/lib/x_test.ts']);
  assertEquals(o.tiers, ['dom']);
  assertEquals(o.areas, ['interface']);
  assertEquals(o.paths, ['src/ui/', 'script/lib/x_test.ts']);
  assertEquals([parseArgs([]).areas, parseArgs([]).paths], [[], []]);
});

test('a coverage floor on part of the suite is an error', () => {
  assertThrows(
    () => parseArgs(['interface', '--coverage', '--min-lines=100']),
    Error,
    'apply to the whole suite',
  );
  assertThrows(
    () => parseArgs(['src/lib', '--coverage', '--min-branches=1']),
    Error,
    'whole suite',
  );
  assertEquals(parseArgs(['interface', '--coverage']).coverage, true); // a report alone is fine
});

test('a bare "--" separator is ignored, so both ways of passing flags work', () => {
  assertEquals(parseArgs(['--', '--verbose']).verbose, true);
  assertEquals(parseArgs(['unit', '--', '--fail-fast']).tiers, ['unit']);
});
