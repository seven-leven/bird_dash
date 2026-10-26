// The assets half of `npm run check`: for each collection, what ingesting would still
// have to do (a drawing not dated, an image missing or orphaned). Reads only.
import type { Collection } from '../lib/collections.ts';
import type { Io } from '../lib/io.ts';
import { scanSources } from '../ingest/scanSources.ts';
import { countBlockingIssues, planChanges } from '../ingest/planChanges.ts';
import type { AssetRow } from './formatCheckReport.ts';

export async function checkAssets(
  collections: Collection[],
  io: Io,
): Promise<{ rows: AssetRow[]; problemCount: number }> {
  const rows: AssetRow[] = [];
  for (const collection of collections) {
    const scan = await scanSources(collection, io);
    rows.push({ collection, scan, plan: planChanges(scan) });
  }
  const problemCount = rows.reduce((count, row) => count + countBlockingIssues(row.plan), 0);
  return { rows, problemCount };
}
