import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import {
  formatDryRun,
  formatIngestSummary,
  formatStep,
  formatWarnings,
} from './formatIngestReport.ts';
import { planChanges } from './planChanges.ts';
import type { Collection } from '../lib/collections.ts';

const birds = { id: 'birds', label: 'Birds', emoji: '🐦' } as Collection;
const set = (...ids: string[]) => new Set(ids);
const text = (lines: { text: string }[]) => lines.map((line) => line.text).join('\n');

test('a step lines up its collection, its verb and what it is about', () => {
  assertEquals(formatStep('birds', 'registered', 'Watercock (029)').trim().split(/\s{2,}/), [
    'birds',
    'registered',
    'Watercock (029)',
  ]);
});

test('missing source art is a warning only for an item that still needs its images', () => {
  const plan = planChanges({
    drawnIds: set('001', '002'),
    sourceIds: set(),
    fullIds: set('001', '777'), // 002 has no images; 777 has no item
    thumbIds: set('001', '888'),
  });
  const warnings = text(formatWarnings(birds, plan));
  assert(warnings.includes('its source art is missing; cannot make  002'));
  assert(!warnings.includes('cannot make  001'), 'an item with its images needs no source art');
  assert(warnings.includes('a full WebP with no item in the list  777'));
  assert(warnings.includes('a thumbnail with no item in the list  888'));
});

test('a dry run lists what it would register, make and repair, or that there is nothing to do', () => {
  const busy = planChanges({
    drawnIds: set('001', '002'),
    sourceIds: set('001', '002', '003'),
    fullIds: set('001'),
    thumbIds: set(),
  });
  const lines = text(formatDryRun(birds, busy));
  assert(/would register\s+003/.test(lines) && /would make\s+002/.test(lines), lines);
  assert(/would repair\s+001/.test(lines), lines);

  const idle = planChanges({ drawnIds: set(), sourceIds: set(), fullIds: set(), thumbIds: set() });
  assert(/·\s+nothing to do/.test(text(formatDryRun(birds, idle))));
});

test('the summary shows each collection’s drawings, what is new, every failure, the version and the time', () => {
  const lines = formatIngestSummary(
    [
      { collection: birds, applied: { registered: ['002'], failures: [] }, drawnCount: 3 },
      {
        collection: birds,
        applied: { registered: [], failures: [{ id: '009', reason: 'boom' }] },
        drawnCount: 1,
      },
    ],
    '0.9.1 · 4 drawings · abc1234',
    1234,
  );
  const all = text(lines);
  assert(all.includes('3 drawn') && all.includes('+1 new') && all.includes('✓'), all);
  assert(all.includes('✗ 1 error'), all);
  assert(all.includes('0.9.1 · 4 drawings · abc1234') && all.includes('1.23s'), all);
  // The failure itself is a problem line, so it goes to stderr.
  assertEquals(lines.filter((line) => line.problem).map((line) => line.text.trim()), [
    '✗ 009  boom',
  ]);
});

test('two failures in a collection are counted as errors', () => {
  const failures = [{ id: '009', reason: 'boom' }, { id: '010', reason: 'boom' }];
  const lines = formatIngestSummary(
    [{ collection: birds, applied: { registered: [], failures }, drawnCount: 0 }],
    'v',
    0,
  );
  assert(text(lines).includes('✗ 2 errors'));
});
