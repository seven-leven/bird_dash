/// <reference lib="deno.ns" />
import { assertEquals, assertThrows } from '@std/assert';
import { parseArgs, withoutDots } from './test.ts';

Deno.test('no arguments means every tier, in order', () => {
  const o = parseArgs([]);
  assertEquals(o.tiers, ['unit', 'dom', 'prop', 'contract']);
  assertEquals([o.verbose, o.failFast, o.coverage, o.minLines], [false, false, false, 0]);
});

Deno.test('tier names select tiers (in canonical order, whatever order they were typed)', () => {
  assertEquals(parseArgs(['prop', 'unit']).tiers, ['unit', 'prop']);
});

Deno.test('flags are parsed', () => {
  const o = parseArgs(['dom', '-v', '--fail-fast', '--coverage', '--min-lines=70']);
  assertEquals([o.verbose, o.failFast, o.coverage, o.minLines], [true, true, true, 70]);
});

Deno.test('unknown tiers and options are rejected with a helpful message', () => {
  assertThrows(() => parseArgs(['e2e']), Error, 'available: unit, dom, prop, contract');
  assertThrows(() => parseArgs(['--nope']), Error, 'unknown option --nope');
});

Deno.test('a coverage floor without --coverage is an error, not silently ignored', () => {
  assertThrows(() => parseArgs(['--min-lines=50']), Error, '--min-lines needs --coverage');
});

Deno.test("withoutDots drops the dot reporter's progress lines and keeps the rest", () => {
  const raw = '.\n.\n!\n\nERRORS\nsome test => file.ts:1:1\nerror: boom\n.\n';
  assertEquals(withoutDots(raw), 'ERRORS\nsome test => file.ts:1:1\nerror: boom');
});

Deno.test('--report asks for the saved report; it is off by default', () => {
  assertEquals(parseArgs([]).report, false);
  assertEquals(parseArgs(['--coverage', '--report']).report, true);
});

Deno.test('a bare "--" separator is ignored, so both ways of passing flags work', () => {
  assertEquals(parseArgs(['--', '--verbose']).verbose, true);
  assertEquals(parseArgs(['unit', '--', '--fail-fast']).tiers, ['unit']);
});
