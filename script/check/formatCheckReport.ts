// The report `npm run check` prints, as lines: per collection, the drawn count, the
// source art found and every problem that fails the check; then each generated file.
import { plural } from '../../src/domain/countWords.ts';
import type { Collection } from '../lib/collections.ts';
import { type Line, MARK } from '../lib/cli.ts';
import { DIVIDER, ID_WIDTH } from '../lib/report.ts';
import type { SourceScan } from '../ingest/scanSources.ts';
import type { ChangePlan } from '../ingest/planChanges.ts';
import type { GeneratedFile } from './checkGenerated.ts';

/** One collection, as the check saw it. */
export interface AssetRow {
  collection: Collection;
  scan: SourceScan;
  plan: ChangePlan;
}

/** The problems a plan holds that fail the check, each as `kind  id`. */
export function assetProblems(plan: ChangePlan): string[] {
  return [
    ...plan.toRegister.map((id) => `unregistered PNG      ${id}`),
    ...[...plan.toTranscode, ...plan.toTranscodeExtra].map((id) => `missing full WebP     ${id}`),
    ...plan.toRepairThumb.map((id) => `missing thumb         ${id}`),
    ...plan.orphanedFull.map((id) => `orphaned full WebP    ${id}`),
    ...plan.orphanedThumb.map((id) => `orphaned thumb        ${id}`),
  ];
}

/** The assets part: a line per collection, its problems under it. */
export function formatAssetReport(rows: AssetRow[], versionLine: string): Line[] {
  const lines: Line[] = [
    { text: `\n  ${DIVIDER}` },
    { text: `  ${versionLine}` },
    { text: `  ${DIVIDER}` },
  ];
  for (const { collection, scan, plan } of rows) {
    const problems = assetProblems(plan);
    const status = problems.length === 0
      ? MARK.done
      : `${MARK.problem} ${plural(problems.length, 'issue')}`;
    lines.push({
      text: `  ${collection.emoji} ${collection.label.padEnd(ID_WIDTH + 2)}` +
        `  ${`${scan.drawnIds.size} drawn`.padEnd(10)}` +
        `  ${`${scan.sourceIds.size} raw`.padEnd(8)}` +
        `  ${status}`,
    });
    for (const problem of problems) lines.push({ text: `      ${problem}`, problem: true });
    // Missing source art is expected wherever raw_png/ is absent (CI): a note, not a problem.
    if (plan.missingSource.length > 0) {
      lines.push({
        text: `      note: ${plan.missingSource.length} drawn without a raw PNG ` +
          '(fine if raw_png/ is absent)',
      });
    }
  }
  lines.push({ text: `  ${DIVIDER}` });
  return lines;
}

/** The generated files part: each one current, or stale with the command that fixes it. */
export function formatGeneratedReport(files: GeneratedFile[]): Line[] {
  return files.map(({ path, isCurrent, fix }) =>
    isCurrent
      ? { text: `  ${MARK.done} ${path} is current` }
      : { text: `  ${MARK.problem} ${path} is stale: run \`${fix}\``, problem: true }
  );
}
