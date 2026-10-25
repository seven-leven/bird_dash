import { test } from 'vitest';
import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  coverageAnnotations,
  formatGaps,
  formatMarkdown,
  formatTable,
  lineRanges,
  notFullyCovered,
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
  // What needs attention first, in the terminal's words; every file folded underneath.
  assertStringIncludes(md, '**Not fully covered (1):**');
  assertStringIncludes(md, '  src/a.ts\n    lines');
  assert(md.indexOf('Not fully covered') < md.indexOf('<details>'));
  assertStringIncludes(md, '<details><summary>Every file (2, least covered first)');
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
      missedLines: [],
      missedBranches: [],
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

test('parseLcov records the lines and branches no test reached', () => {
  const [f] = parseLcov(
    'SF:C:/proj/src/x.vue\nDA:3,1\nDA:4,0\nDA:5,0\nDA:9,0\nLF:4\nLH:1\n' +
      'BRDA:7,0,0,1\nBRDA:7,0,1,0\nBRDA:12,1,0,-\nBRF:3\nBRH:1\nend_of_record\n',
  );
  assertEquals(f.missedLines, [4, 5, 9]);
  assertEquals(f.missedBranches, [7, 12]);
});

test('lineRanges collapses runs of line numbers', () => {
  assertEquals(lineRanges([]), '');
  assertEquals(lineRanges([4]), '4');
  assertEquals(lineRanges([4, 5, 6, 9, 11, 12]), '4–6, 9, 11–12');
});

test('notFullyCovered finds every miss exactly, worst first, branches as well as lines', () => {
  const file = (name: string, lines: [number, number], branches: [number, number]) => ({
    file: name,
    lines: { found: lines[0], hit: lines[1] },
    branches: { found: branches[0], hit: branches[1] },
    functions: { found: 0, hit: 0 },
  });
  const nearly = file('nearly.ts', [2000, 1999], [0, 0]); // 99.95%: prints as 100.0%
  const vue = file('x.vue', [10, 10], [4, 2]); // every line run, two branches not
  const whole = file('whole.ts', [5, 5], [2, 2]);
  assertEquals(notFullyCovered([nearly, whole, vue]).map((f) => f.file), ['x.vue', 'nearly.ts']);
});

test('formatGaps names each file and the lines to look at', () => {
  const [f] = parseLcov(
    'SF:C:/proj/src/x.vue\nDA:4,0\nDA:5,0\nLF:6\nLH:4\nBRDA:7,0,1,0\nBRF:2\nBRH:1\nend_of_record\n',
  );
  assertEquals(
    formatGaps([f], 'C:/proj'),
    '  src/x.vue\n    lines 4/6, missed: 4–5\n    branches 1/2, missed on: 7',
  );
  const onlyBranches = { ...f, lines: { found: 6, hit: 6 }, missedLines: undefined };
  assertEquals(
    formatGaps([onlyBranches], 'C:/proj'),
    '  src/x.vue\n    branches 1/2, missed on: 7',
  );
  const onlyLines = { ...f, branches: { found: 2, hit: 2 }, missedBranches: undefined };
  assertEquals(formatGaps([onlyLines], 'C:/proj'), '  src/x.vue\n    lines 4/6, missed: 4–5');
  const noLists = { ...f, missedLines: undefined, missedBranches: undefined };
  assertEquals(formatGaps([noLists]).split('\n').length, 3);
});

test('coverageAnnotations marks each file on its first missed line, listing the rest', () => {
  const [f] = parseLcov(
    'SF:C:/proj/src/x.vue\nDA:9,0\nDA:10,0\nLF:6\nLH:4\nBRDA:7,0,1,0\nBRF:2\nBRH:1\nend_of_record\n',
  );
  assertEquals(coverageAnnotations([f], 'C:/proj', 'error'), [
    '::error file=src/x.vue,line=7,title=Not covered by any test::' +
    'lines 9–10 never run; a branch on 7 never taken',
  ]);
  const bare = { ...f, missedLines: undefined, missedBranches: undefined };
  assertEquals(coverageAnnotations([bare]), [
    '::warning file=C%3A/proj/src/x.vue,title=Not covered by any test::not fully covered',
  ]);
});

test('parseLcov lists a line once, however many of its branches were missed', () => {
  const [f] = parseLcov('SF:a.ts\nBRDA:7,0,0,0\nBRDA:7,0,1,-\nBRF:2\nBRH:0\nend_of_record\n');
  assertEquals(f.missedBranches, [7]);
});
