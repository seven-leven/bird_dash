// The integrity report `npm run check` prints: per collection, the drawn count, the
// source art found, and every problem that fails the check.
import { COLLECTIONS } from '../lib/collections.ts';
import type { Collection } from '../lib/collections.ts';
import type { SourceScan } from '../ingest/scanSources.ts';
import type { ChangePlan } from '../ingest/planChanges.ts';

const COL_W = Math.max(...COLLECTIONS.map((c) => c.id.length));

function pad(s: string, w: number) {
  return s.padEnd(w);
}

function plural(n: number, word: string): string {
  return n === 1 ? `1 ${word}` : `${n} ${word}s`;
}

export function printCheckReport(
  rows: Array<{ col: Collection; state: SourceScan; plan: ChangePlan }>,
  version: string,
): void {
  const divider = '─'.repeat(52);
  console.log(`\n  ${divider}`);
  console.log(`  ${version}`);
  console.log(`  ${divider}`);

  for (const { col, state, plan } of rows) {
    // Blocking issues only (see countBlockingIssues in ingest/planChanges.ts); missing source art is
    // expected wherever raw_png/ is absent, so they get a summary note below.
    const issues = [
      ...plan.toRegister.map((id) => `unregistered PNG      ${id}`),
      ...plan.toTranscode.map((id) => `missing full WebP     ${id}`),
      ...plan.toRepairThumb.map((id) => `missing thumb         ${id}`),
      ...plan.orphanedFull.map((id) => `orphaned full WebP    ${id}`),
      ...plan.orphanedThumb.map((id) => `orphaned thumb        ${id}`),
    ];

    const status = issues.length === 0 ? '✓' : `✗ ${plural(issues.length, 'issue')}`;

    console.log(
      `  ${col.emoji} ${pad(col.label, COL_W + 2)}` +
        `  ${pad(String(state.drawnIds.size) + ' drawn', 10)}` +
        `  ${pad(String(state.sourceIds.size) + ' raw', 8)}` +
        `  ${status}`,
    );

    for (const msg of issues) {
      console.log(`      ${msg}`);
    }
    if (plan.missingSource.length > 0) {
      console.log(
        `      note: ${plan.missingSource.length} drawn without a raw PNG (fine if raw_png/ is absent)`,
      );
    }
  }

  console.log(`  ${divider}\n`);
}
