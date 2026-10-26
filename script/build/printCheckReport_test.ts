import { test } from 'vitest';
import { assert } from '@std/assert';
import { printCheckReport } from './printCheckReport.ts';
import { planChanges } from '../ingest/planChanges.ts';
import type { Collection } from '../lib/collections.ts';

const birds = { id: 'x', label: 'Test', emoji: '🧪' } as Collection;

/** Everything `fn` printed, without printing it. (The check moves onto Io in a later phase.) */
function captured(fn: () => void): string {
  const lines: string[] = [];
  const { log, error } = console;
  console.log = (...parts: unknown[]) => lines.push(parts.join(' '));
  console.error = (...parts: unknown[]) => lines.push(parts.join(' '));
  try {
    fn();
  } finally {
    console.log = log;
    console.error = error;
  }
  return lines.join('\n');
}

test('the check report lists each problem by kind and notes missing source art', () => {
  const state = {
    drawnIds: new Set(['001', '002']),
    sourceIds: new Set(['003']),
    fullIds: new Set(['001', '777']),
    thumbIds: new Set(['888']),
  };
  const output = captured(() =>
    printCheckReport([{ col: birds, state, plan: planChanges(state) }], 'v-test')
  );
  for (
    const expected of [
      'v-test',
      '2 drawn',
      '1 raw',
      'unregistered PNG      003',
      'missing full WebP     002',
      'missing thumb         001',
      'orphaned full WebP    777',
      'orphaned thumb        888',
      'drawn without a raw PNG',
    ]
  ) assert(output.includes(expected), `report is missing "${expected}"\n${output}`);
  assert(/✗ \d+ issues/.test(output));
});

test('a clean collection gets a tick in the check report', () => {
  const ids = new Set(['001']);
  const state = { drawnIds: ids, sourceIds: ids, fullIds: ids, thumbIds: ids };
  const output = captured(() =>
    printCheckReport([{ col: birds, state, plan: planChanges(state) }], 'v')
  );
  assert(output.includes('✓') && !output.includes('✗'));
});
