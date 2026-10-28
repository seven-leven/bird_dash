import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { PRINCIPLES } from './principles.ts';
import { designGuide } from './designGuide.ts';
import { ICON_GROUPS, ICONS } from '../../src/ui/icons.ts';

const page = () => readFile('./docs/DESIGN.md', 'utf8');

test('DESIGN.md states each principle under its heading, in the same order', async () => {
  const md = await page();
  const headings = [...md.matchAll(/^### P(\d) — (.+)\n\n\*\*(.+)\*\*$/gm)];
  assertEquals(
    headings.map((m) => [m[1], m[2], m[3]]),
    PRINCIPLES.map((p, i) => [String(i + 1), p.title, p.summary]),
  );
});

test('every numbered section of DESIGN.md names the principles it serves', async () => {
  const sections = (await page()).split(/^## (?=\d\d\. )/m).slice(1);
  assert(sections.length >= 10, 'expected the numbered sections 01 to 11');
  for (const section of sections) {
    const [heading, , ...rest] = section.split('\n');
    // The italic line under the heading, which dprint may wrap.
    const line = rest.join('\n').split('\n\n')[0]!.replace(/\n/g, ' ');
    assert(/^_.+_$/.test(line), `${heading}: no line naming its principles`);
    const named = line.slice(1, -1).split(' · ');
    assert(named.length > 0);
    for (const name of named) {
      const m = /^P(\d) (.+)$/.exec(name);
      assert(m, `${heading}: "${name}" is not "P<n> <title>"`);
      assertEquals(m[2], PRINCIPLES[Number(m[1]) - 1]?.title, `${heading}: ${name}`);
    }
  }
});

test('each principle has its own icon, in the Principles group of the registry', () => {
  const icons = PRINCIPLES.map((p) => p.icon);
  assertEquals(new Set(icons).size, PRINCIPLES.length);
  for (const name of icons) assert(Object.hasOwn(ICONS, name), name);
  assertEquals(ICON_GROUPS.find((g) => g.label === 'Principles')?.icons, icons);
});

test('the design guide image shows every principle, numbered P1 to P5', async () => {
  // Titles and summaries wrap onto several <tspan> lines; join them back up.
  const svg = (await designGuide()).svg.replace(/<\/tspan><tspan[^>]*>/g, ' ');
  PRINCIPLES.forEach((p, i) => {
    assertStringIncludes(svg, `>P${i + 1}</text>`);
    assertStringIncludes(svg, `>${p.title}</tspan>`);
    assertStringIncludes(svg, `>${p.summary}</tspan>`);
    assertStringIncludes(svg, ICONS[p.icon].body);
  });
});
