import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { PRINCIPLES } from './principles.ts';
import { designGuide } from './draw_design_guide.ts';
import { ICON_GROUPS, ICONS } from '../../src/lib/icons.ts';

const page = () => readFile('./docs/DESIGN.md', 'utf8');

test('DESIGN.md has a heading for each principle, with the same titles in the same order', async () => {
  const headings = [...(await page()).matchAll(/^### P(\d)\. (.+)$/gm)].map((m) => [m[1], m[2]]);
  assertEquals(headings, PRINCIPLES.map((p, i) => [String(i + 1), p.title]));
});

test('every rule in DESIGN.md names the principle it comes from', async () => {
  const rules = (await page()).split('\n').filter((line) => /^\s*- \*\*/.test(line));
  assert(rules.length > 40, 'expected the guide to have its rules as bold-led bullets');
  const untagged = rules.filter((line) => !/\(P[1-5]\)/.test(line));
  assertEquals(untagged, [], 'each rule needs a (P1)–(P5) tag on its first line');
});

test('each principle has its own icon, in the Principles group of the registry', () => {
  const icons = PRINCIPLES.map((p) => p.icon);
  assertEquals(new Set(icons).size, PRINCIPLES.length);
  for (const name of icons) assert(Object.hasOwn(ICONS, name), name);
  assertEquals(ICON_GROUPS.find((g) => g.label === 'Principles')?.icons, icons);
});

test('the design guide image shows every principle, numbered P1 to P5', async () => {
  const { svg } = await designGuide();
  PRINCIPLES.forEach((p, i) => {
    assertStringIncludes(svg, `>P${i + 1} · ${p.title}</text>`);
    assertStringIncludes(svg, `>${p.summary}</text>`);
    assertStringIncludes(svg, ICONS[p.icon].body);
  });
});
