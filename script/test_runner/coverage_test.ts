import { test } from 'vitest';
import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  formatMarkdown,
  formatTable,
  parseLcov,
  parseMinBranches,
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

test('parseLcov reads every record with line, branch and function counters', () => {
  const files = parseLcov(LCOV);
  assertEquals(files.length, 2);
  assertEquals(files[0].file, 'C:\\proj\\src\\a.ts');
  assertEquals(files[0].lines, { found: 10, hit: 5 });
  assertEquals(files[0].branches, { found: 2, hit: 1 });
  assertEquals(files[0].functions, { found: 4, hit: 3 });
});

test('percent: nothing to cover counts as fully covered', () => {
  assertEquals(percent({ found: 0, hit: 0 }), 100);
  assertEquals(percent({ found: 4, hit: 1 }), 25);
});

test('totals add up across files (not an average of percentages)', () => {
  const t = totals(parseLcov(LCOV));
  assertEquals(t.lines, { found: 20, hit: 15 });
  assertEquals(percent(t.lines), 75);
});

test('formatTable lists the worst-covered file first and shows relative paths', () => {
  const table = formatTable(parseLcov(LCOV), 'C:\\proj');
  const lines = table.split('\n');
  assertStringIncludes(lines[2], 'src/a.ts'); // 50% comes before 100%
  assertStringIncludes(lines[3], 'src/b.ts');
  assertStringIncludes(lines[lines.length - 1], ' 75.0%');
});

test('parseMinLines reads the floor and rejects nonsense', () => {
  assertEquals(parseMinLines([]), 0);
  assertEquals(parseMinLines(['--min-lines=62.5']), 62.5);
  assertThrows(() => parseMinLines(['--min-lines=abc']));
  assertThrows(() => parseMinLines(['--min-lines=140']));
});

test('formatMarkdown leads with the total and folds the per-file table away', () => {
  const md = formatMarkdown(parseLcov(LCOV), 70, 'C:\\proj');
  assertStringIncludes(md, '**75.0% of lines**');
  assertStringIncludes(md, 'floor: 70%');
  assertStringIncludes(md, 'of branches** (floor: 0%)');
  assertStringIncludes(md, '<details><summary>Per-file coverage (2 files');
  const rows = md.split('\n').filter((l) => l.startsWith('| `'));
  assertStringIncludes(rows[0], 'src/a.ts'); // least covered first, relative path
  assertStringIncludes(rows[1], 'src/b.ts');
});

test('formatTable with a limit shows only the worst files but totals them all', () => {
  const lines = formatTable(parseLcov(LCOV), 'C:\\proj', 1).split('\n');
  assertEquals(lines.filter((l) => l.includes('src/')).length, 1);
  assertStringIncludes(lines[lines.length - 1], ' 75.0%');
});

test('parseLcov ignores counters that come before any SF line', () => {
  const stray = 'LF:9\nLH:9\nBRF:9\nBRH:9\nFNF:9\nFNH:9\nend_of_record\n';
  assertEquals(parseLcov(stray + 'SF:a.ts\nLF:2\nLH:1\nend_of_record\n'), [
    {
      file: 'a.ts',
      lines: { found: 2, hit: 1 },
      branches: { found: 0, hit: 0 },
      functions: { found: 0, hit: 0 },
    },
  ]);
});

test('parseMinBranches reads its own flag, independent of --min-lines', () => {
  assertEquals(parseMinBranches(['--min-lines=90']), 0);
  assertEquals(parseMinBranches(['--min-branches=95']), 95);
  assertThrows(() => parseMinBranches(['--min-branches=-1']));
});

test('formatMarkdown shows the branch total and its floor', () => {
  assertStringIncludes(formatMarkdown(parseLcov(LCOV), 70, '', 80), 'of branches** (floor: 80%)');
});
