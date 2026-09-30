/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { describeVersion, formatVersion } from './compute.ts';
import type { VersionData } from './compute.ts';

const v = (over: Partial<VersionData> = {}): VersionData => ({
  major: 0,
  minor: 8,
  patch: 154,
  drawn: 18,
  commit: 'a1b2c3d',
  ...over,
});

Deno.test('formatVersion is plain major.minor.patch, with no padding', () => {
  assertEquals(formatVersion(v()), '0.8.154');
  assertEquals(formatVersion(v({ patch: 5 })), '0.8.5'); // was 0.8.005, which is not valid semver
  assertEquals(formatVersion(v({ major: 1, minor: 2, patch: 1234 })), '1.2.1234');
});

Deno.test('describeVersion adds the drawing count and the commit', () => {
  assertEquals(describeVersion(v()), '0.8.154 · 18 drawings · a1b2c3d');
});

Deno.test('describeVersion pluralises the drawing count', () => {
  assertEquals(describeVersion(v({ drawn: 1 })), '0.8.154 · 1 drawing · a1b2c3d');
  assertEquals(describeVersion(v({ drawn: 0 })), '0.8.154 · 0 drawings · a1b2c3d');
});

Deno.test('an unknown commit is shown as such rather than left blank', () => {
  assertEquals(describeVersion(v({ commit: 'unknown' })), '0.8.154 · 18 drawings · unknown');
});
