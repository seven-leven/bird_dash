/**
 * `npm run generate` — redraw every generated file from the code and the data that
 * define it (docs/SCRIPTS.md, principle 4). Each file has one generator here, and none
 * is edited by hand; a contract test regenerates them all and fails on a stale one.
 *
 *   npm run generate                     every generator
 *   npm run generate -- placeholders     the ones named
 *   npm run generate -- --into <dir>     write into <dir> instead, to look before committing
 *
 * It changes files git tracks (unless `--into`), so it runs on your machine.
 */
import { COLLECTIONS } from '../lib/collections.ts';
import { type Io, readJson } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import { command, EXIT, MARK, parseArgs, UsageError } from '../lib/cli.ts';
import type { RawCollectionConfig } from '../../src/types/data.ts';
import { writeStats } from './stats.ts';
import { writePlaceholders } from './placeholders.ts';
import { contrastReport, writeDesignGuide } from './designGuide.ts';
import { writeIconSheet } from './iconSheet.ts';
import { writeFavicons, writeLogoFiles } from './logo.ts';
import { writeDrawingsStrip } from './drawingsStrip.ts';

/** One generator: what it makes, and how to write it, into its place or into `into`. */
export interface Generator {
  id: string;
  makes: string;
  /** Write the files (into `into` when given) and return their paths. */
  write(io: Io, into: string | undefined): Promise<string[]>;
}

export const GENERATORS: Generator[] = [
  {
    id: 'stats',
    makes: 'public/stats.json, the archive’s numbers',
    write: async (io, into) => {
      const path = into ? `${into}/stats.json` : PATHS.stats;
      await writeStats(COLLECTIONS, io, path);
      return [path];
    },
  },
  {
    id: 'placeholders',
    makes: 'public/placeholders/, each collection’s light and dark placeholder',
    write: async (io, into) =>
      writePlaceholders(
        await readJson<RawCollectionConfig[]>(io, PATHS.collections),
        into ?? PATHS.placeholders,
        (id) => io.out(`  ${MARK.skipped} placeholders: ${id} has no icon in collections.json`),
      ),
  },
  {
    id: 'designGuide',
    makes: 'docs/assets/design-guide.png',
    write: async (io, into) => {
      const path = await writeDesignGuide(into);
      // The contrast figures docs/DESIGN.md quotes, worked out from the same colours.
      for (const line of contrastReport()) io.out(line);
      return [path];
    },
  },
  {
    id: 'iconSheet',
    makes: 'docs/assets/icons.png',
    write: async (_, into) => [await writeIconSheet(into)],
  },
  {
    id: 'logo',
    makes: 'docs/assets/logo.png and docs/assets/logo/',
    write: (_, into) => writeLogoFiles(into),
  },
  {
    id: 'favicons',
    makes: 'public/favicon.svg and favicon.png',
    write: (_, into) => writeFavicons(into),
  },
  {
    id: 'drawingsStrip',
    makes: 'docs/assets/drawings.webp, the README’s newest drawings',
    write: async (io, into) => {
      const path = `${into ?? PATHS.docsAssets}/drawings.webp`;
      return (await writeDrawingsStrip(path, io)) ? [path] : [];
    },
  },
];

/** The generators these words name, in order; all of them when none is named. */
export function pickGenerators(words: string[]): Generator[] {
  const unknown = words.filter((word) => !GENERATORS.some((generator) => generator.id === word));
  if (unknown.length > 0) {
    throw new UsageError(
      `no generator ${unknown.join(', ')} (the generators: ${
        GENERATORS.map((g) => g.id).join(', ')
      })`,
    );
  }
  return words.length === 0 ? GENERATORS : GENERATORS.filter((g) => words.includes(g.id));
}

const USAGE = `npm run generate [-- <generator>…] [-- --into <dir>]
  Redraws the generated files: ${GENERATORS.map((g) => g.id).join(', ')}.
  Changes files git tracks, unless --into writes them into <dir> instead.`;

export const main = command(USAGE, async (args, io) => {
  const { words, values } = parseArgs(args, [], ['--into']);
  const generators = pickGenerators(words);
  const into = values.get('--into');
  if (into) await io.makeDir(into);
  io.out(
    into
      ? `generate: into ${into}, so nothing git tracks is changed`
      : 'generate: redrawing the generated files (this changes files git tracks)',
  );
  for (const generator of generators) {
    const written = await generator.write(io, into);
    io.out(`  ${MARK.done} ${generator.id}  ${written.join(', ') || 'nothing to draw yet'}`);
  }
  return EXIT.done;
});

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
