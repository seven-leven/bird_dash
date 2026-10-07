/// <reference lib="deno.ns" />
import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  formatMarkdown,
  formatTable,
  parseLcov,
  parseMinLines,
  percent,
  totals,
} from './coverage.ts';

const LCOV = `TN:
SF:C:\\proj\\src\\a.ts
FNF:4
FNH:3
LF:10
LH:5
BRF:2
BRH:1
end_of_record
SF:C:\\proj\\src\\b.ts
FNF:0
FNH:0
LF:10
LH:10
BRF:0
BRH:0
end_of_record
`;

Deno.test('parseLcov reads every record with line, branch and function counters', () => {
  const files = parseLcov(LCOV);
  assertEquals(files.length, 2);
  assertEquals(files[0].file, 'C:\\proj\\src\\a.ts');
  assertEquals(files[0].lines, { found: 10, hit: 5 });
  assertEquals(files[0].branches, { found: 2, hit: 1 });
  assertEquals(files[0].functions, { found: 4, hit: 3 });
});

Deno.test('percent: nothing to cover counts as fully covered', () => {
  assertEquals(percent({ found: 0, hit: 0 }), 100);
  assertEquals(percent({ found: 4, hit: 1 }), 25);
});

Deno.test('totals add up across files (not an average of percentages)', () => {
  const t = totals(parseLcov(LCOV));
  assertEquals(t.lines, { found: 20, hit: 15 });
  assertEquals(percent(t.lines), 75);
});

Deno.test('formatTable lists the worst-covered file first and shows relative paths', () => {
  const table = formatTable(parseLcov(LCOV), 'C:\\proj');
  const lines = table.split('\n');
  assertStringIncludes(lines[2], 'src/a.ts'); // 50% comes before 100%
  assertStringIncludes(lines[3], 'src/b.ts');
  assertStringIncludes(lines[lines.length - 1], ' 75.0%');
});

Deno.test('parseMinLines reads the floor and rejects nonsense', () => {
  assertEquals(parseMinLines([]), 0);
  assertEquals(parseMinLines(['--min-lines=62.5']), 62.5);
  assertThrows(() => parseMinLines(['--min-lines=abc']));
  assertThrows(() => parseMinLines(['--min-lines=140']));
});

Deno.test('formatMarkdown leads with the total and folds the per-file table away', () => {
  const md = formatMarkdown(parseLcov(LCOV), 70, 'C:\\proj');
  assertStringIncludes(md, '**75.0% of lines**');
  assertStringIncludes(md, 'floor: 70%');
  assertStringIncludes(md, '<details><summary>Per-file coverage (2 files');
  const rows = md.split('\n').filter((l) => l.startsWith('| `'));
  assertStringIncludes(rows[0], 'src/a.ts'); // least covered first, relative path
  assertStringIncludes(rows[1], 'src/b.ts');
});

Deno.test('formatTable with a limit shows only the worst files but totals them all', () => {
  const lines = formatTable(parseLcov(LCOV), 'C:\\proj', 1).split('\n');
  assertEquals(lines.filter((l) => l.includes('src/')).length, 1);
  assertStringIncludes(lines[lines.length - 1], ' 75.0%');
});
