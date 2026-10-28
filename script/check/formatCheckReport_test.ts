import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { formatAssetReport, formatGeneratedReport } from './formatCheckReport.ts';
import { planChanges } from '../ingest/planChanges.ts';
import { makeScriptCollection } from '../../src/testing/scriptFixtures.ts';

const birds = makeScriptCollection('x', { label: 'Test', emoji: '🧪' });
const text = (lines: { text: string }[]) => lines.map((line) => line.text).join('\n');

test('the asset report lists each problem by kind, as a problem, and notes missing source art', () => {
  const scan = {
    drawnIds: new Set(['001', '002']),
    extraIds: new Set<string>(),
    sourceIds: new Set(['003']),
    fullIds: new Set(['001', '777']),
    thumbIds: new Set(['888']),
    smallIds: new Set(['888']),
  };
  const lines = formatAssetReport([{ collection: birds, scan, plan: planChanges(scan) }], 'v-test');
  const all = text(lines);
  for (
    const expected of ['v-test', '2 drawn', '1 raw', '✗ 6 issues', 'drawn without a raw PNG']
  ) assert(all.includes(expected), `report is missing "${expected}"\n${all}`);
  assertEquals(lines.filter((line) => line.problem).map((line) => line.text.trim()), [
    'unregistered PNG      003',
    'missing full WebP     002',
    'missing full WebP     003', // 003 is registered, so it needs its images too
    'missing thumb         001',
    'orphaned full WebP    777',
    'orphaned thumb        888',
  ]);
});

test('a clean collection gets a tick, and one problem is "1 issue"', () => {
  const ids = new Set(['001']);
  const clean = {
    drawnIds: ids,
    extraIds: new Set<string>(),
    sourceIds: ids,
    fullIds: ids,
    thumbIds: ids,
    smallIds: ids,
  };
  const lines = formatAssetReport(
    [{ collection: birds, scan: clean, plan: planChanges(clean) }],
    'v',
  );
  assert(text(lines).includes('✓') && !lines.some((line) => line.problem));

  const one = { ...clean, thumbIds: new Set<string>(), smallIds: new Set<string>() };
  assert(
    text(formatAssetReport([{ collection: birds, scan: one, plan: planChanges(one) }], 'v'))
      .includes('✗ 1 issue'),
  );
});

test('each generated file is current, or stale with the command that fixes it', () => {
  const lines = formatGeneratedReport([
    { path: './a.svg', isCurrent: true, fix: 'npm run generate' },
    { path: './stats.json', isCurrent: false, fix: 'npm run ingest' },
  ]);
  assertEquals(lines, [
    { text: '  ✓ ./a.svg is current' },
    { text: '  ✗ ./stats.json is stale: run `npm run ingest`', problem: true },
  ]);
});
