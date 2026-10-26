import { test } from 'vitest';
import { assert, assertEquals, assertRejects } from '@std/assert';
import { main } from './check.ts';
import { checkGenerated } from './checkGenerated.ts';
import { fakeIo, type FakeIoOptions } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';
import type { Collection } from '../lib/collections.ts';
import { formatStatsFor } from '../generate/stats.ts';
import { faviconSvg, logoFiles } from '../generate/logo.ts';

const birds = {
  id: 'x',
  label: 'Test',
  emoji: '',
  paths: { json: './x.json', sourceArt: './raw/', full: './full/', thumb: './thumb/' },
} as Collection;
const options = { collections: [birds], statsPath: './stats.json' };

/** A repository where everything is as it should be, changed by `files`. */
async function makeRepository(files: FakeIoOptions['files'] = {}) {
  const io = fakeIo({
    files: {
      [PATHS.baseVersion]: '{ "major": 0, "minor": 9 }',
      './x.json': JSON.stringify({ Group: [{ id: '001', name: 'A', drawn: '2025-01-01' }] }),
      './full/001.webp': '',
      './thumb/001.webp': '',
      [PATHS.favicon]: faviconSvg(),
      ...Object.fromEntries(
        Object.entries(logoFiles()).map(([name, svg]) => [`${PATHS.docsAssets}/logo/${name}`, svg]),
      ),
    },
    git: { 'rev-list --count HEAD': '1', 'rev-parse --short=7 HEAD': 'abc1234' },
  });
  await io.writeText('./stats.json', await formatStatsFor([birds], io));
  for (const [path, text] of Object.entries(files ?? {})) await io.writeText(path, text);
  return io;
}

test('a repository as it should be passes, and every generated file is said to be current', async () => {
  const io = await makeRepository();
  assertEquals(await main([], io, options), 0);
  assertEquals(io.errLines, []);
  const out = io.outLines.join('\n');
  assert(
    out.includes('0.9.1 · 0 drawings · abc1234') /* the real collections, unlisted here */ &&
      out.includes('✓'),
    out,
  );
  assert(
    out.includes('✓ ./stats.json is current') && out.includes(`✓ ${PATHS.favicon} is current`),
  );
});

test('a missing image and stale stats fail the check, each named with its fix', async () => {
  const io = await makeRepository({ './stats.json': '{}' });
  io.files.delete('./thumb/001.webp');
  assertEquals(await main([], io, options), 1);
  assert(io.errLines.some((line) => line.includes('missing thumb         001')));
  assert(io.errLines.includes('  ✗ ./stats.json is stale: run `npm run ingest`'));
  assertEquals(io.errLines.at(-1), '✗ check failed: 2 problem(s)');
});

test('a generated file that is missing is stale; one that cannot be read is an error', async () => {
  const io = await makeRepository();
  io.files.delete(PATHS.favicon);
  const files = await checkGenerated([birds], io, './stats.json');
  assertEquals(files.find((file) => file.path === PATHS.favicon)?.isCurrent, false);

  const locked = {
    ...io,
    readText: (path: string) =>
      path === PATHS.favicon
        ? Promise.reject(new Error('EACCES: permission denied'))
        : io.readText(path),
  };
  await assertRejects(() => checkGenerated([birds], locked, './stats.json'), Error, 'EACCES');
});

test('the check takes no options, and exits 2 on one', async () => {
  assertEquals(await main(['--fix'], await makeRepository(), options), 2);
});
