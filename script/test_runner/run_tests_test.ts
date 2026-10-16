import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { parseArgs, withoutDots } from './run_tests.ts';

test('no arguments means every tier, in order', () => {
  const o = parseArgs([]);
  assertEquals(o.tiers, ['unit', 'dom', 'prop', 'contract']);
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
  assertThrows(() => parseArgs(['e2e']), Error, 'available: unit, dom, prop, contract');
  assertThrows(() => parseArgs(['--nope']), Error, 'unknown option --nope');
});

test('a coverage floor without --coverage is an error, not silently ignored', () => {
  assertThrows(() => parseArgs(['--min-lines=50']), Error, '--min-lines needs --coverage');
});

test("withoutDots drops the dot reporter's progress lines and keeps the rest", () => {
  const raw = ' RUN  v5\n·····x··*·-·\n\n FAIL  a_test.ts > boom\nAssertionError: bad\n··\n';
  assertEquals(withoutDots(raw), ' RUN  v5\n FAIL  a_test.ts > boom\nAssertionError: bad');
});

test('--report asks for the saved report; it is off by default', () => {
  assertEquals(parseArgs([]).report, false);
  assertEquals(parseArgs(['--coverage', '--report']).report, true);
});

test('a bare "--" separator is ignored, so both ways of passing flags work', () => {
  assertEquals(parseArgs(['--', '--verbose']).verbose, true);
  assertEquals(parseArgs(['unit', '--', '--fail-fast']).tiers, ['unit']);
});

test('--html asks for the HTML coverage report and needs --coverage', () => {
  assertEquals(parseArgs([]).html, false);
  assertEquals(parseArgs(['--coverage', '--html']).html, true);
  assertThrows(() => parseArgs(['--html']), Error, '--html needs --coverage');
});
