// The generated half of `npm run check`: each generated text file against what its
// generator would write now. Images are compared by generatedFiles_contract_test.ts
// instead, as their bytes differ from one machine to another.
import type { Collection } from '../lib/collections.ts';
import { isErrno } from '../lib/fs.ts';
import type { Io } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { formatStatsFor } from '../generate/stats.ts';
import { faviconSvg, logoFiles } from '../generate/logo.ts';

/** One generated file, as the check found it. */
export interface GeneratedFile {
  path: string;
  isCurrent: boolean;
  /** The command that rewrites it. */
  fix: string;
}

/** The text on disk, or null when the file is missing; any other failure is thrown. */
async function readOrNull(io: Io, path: string): Promise<string | null> {
  try {
    return await io.readText(path);
  } catch (err) {
    if (isErrno(err, 'ENOENT')) return null;
    throw err;
  }
}

export async function checkGenerated(
  collections: Collection[],
  io: Io,
  statsPath: string = PATHS.stats,
): Promise<GeneratedFile[]> {
  const expected: { path: string; text: string; fix: string }[] = [
    // A list changed without ingesting would leave the published numbers wrong.
    { path: statsPath, text: await formatStatsFor(collections, io), fix: 'npm run ingest' },
    { path: PATHS.favicon, text: faviconSvg(), fix: 'npm run generate' },
    ...Object.entries(logoFiles()).map(([name, text]) => ({
      path: `${PATHS.docsAssets}/logo/${name}`,
      text,
      fix: 'npm run generate',
    })),
  ];
  const files: GeneratedFile[] = [];
  for (const { path, text, fix } of expected) {
    files.push({ path, isCurrent: (await readOrNull(io, path)) === text, fix });
  }
  return files;
}
