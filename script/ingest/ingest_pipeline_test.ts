import { test } from 'vitest';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import sharp from 'sharp';
import { scanSources } from './scanSources.ts';
import { countBlockingIssues, planChanges } from './planChanges.ts';
import { applyChanges } from './applyChanges.ts';
import { transcodeFull } from './transcodeImages.ts';
import { realIo } from '../lib/io.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import type { Collection } from '../lib/collections.ts';
import { tempDir } from '../../src/testing/fakes/tempDir.ts';

// Ingesting end to end, on real (tiny) images in a temporary folder, with the real Io
// and sharp: scan → plan → apply → scan again. Nothing here touches public/ or raw_png/.
sharp.cache(false); // on Windows, sharp's cache would keep the folder locked

type Item = { id: string; name: string; drawn?: string };

/** A collection on disk; `sources` lists the ids that have source art. */
async function withCollection(
  items: Item[],
  sources: string[],
  fn: (collection: Collection) => Promise<void>,
): Promise<void> {
  await using folder = await tempDir('ingest');
  const dir = folder.path;
  const collection = {
    id: 'x',
    label: 'Test',
    emoji: '🧪',
    paths: {
      json: `${dir}/list.json`,
      sourceArt: `${dir}/raw/`,
      full: `${dir}/full/`,
      thumb: `${dir}/thumb/`,
    },
  } as Collection;
  await writeFile(collection.paths.json, JSON.stringify({ Group: items }));
  await mkdir(collection.paths.sourceArt);
  for (const id of sources) {
    await sharp({ create: { width: 40, height: 40, channels: 3, background: '#3366cc' } })
      .png().toFile(`${collection.paths.sourceArt}${id}.png`);
  }
  await fn(collection);
}

/** The real Io, with what it prints kept for the test. */
function quietIo() {
  const output = fakeIo();
  return { io: { ...realIo, out: output.out, err: output.err }, output };
}

test('new drawings are dated and given their images, and then there is nothing left to do', () =>
  withCollection(
    [
      { id: '001', name: 'Already drawn', drawn: '2025-01-01' },
      { id: '002', name: 'New drawing' }, // has source art but no date yet
      { id: '003', name: 'Not drawn' },
    ],
    ['001', '002'],
    async (collection) => {
      const plan = planChanges(await scanSources(collection));
      assertEquals([plan.toRegister, plan.toTranscode.sort()], [['002'], ['001', '002']]);

      const { io } = quietIo();
      const applied = await applyChanges(collection, plan, { date: '2025-06-01', io });
      assertEquals(applied, { registered: ['002'], failures: [] });

      const saved = JSON.parse(await readFile(collection.paths.json, 'utf8'));
      assertEquals(saved.Group.map((item: Item) => item.drawn), [
        '2025-01-01',
        '2025-06-01',
        undefined,
      ]);

      const after = planChanges(await scanSources(collection));
      assertEquals([countBlockingIssues(after), after.missingSource], [0, []]);
    },
  ));

test('a missing thumbnail alone is repaired from the full image', () =>
  withCollection([{ id: '001', name: 'A', drawn: '2025-01-01' }], ['001'], async (collection) => {
    await transcodeFull(collection, '001');
    await rm(`${collection.paths.thumb}001.webp`);

    const plan = planChanges(await scanSources(collection));
    assertEquals([plan.toTranscode, plan.toRepairThumb], [[], ['001']]);
    await applyChanges(collection, plan, { date: '2025-06-01', io: quietIo().io });
    assertEquals(countBlockingIssues(planChanges(await scanSources(collection))), 0);
  }));

test('a drawing with no source art, or a broken full image, fails that item and the rest go on', () =>
  withCollection(
    [{ id: '001', name: 'No source', drawn: '2025-01-01' }, {
      id: '002',
      name: 'Broken',
      drawn: '2025-01-01',
    }],
    ['002'],
    async (collection) => {
      await transcodeFull(collection, '002');
      await rm(`${collection.paths.thumb}002.webp`);
      await writeFile(`${collection.paths.full}002.webp`, 'not an image');

      const plan = planChanges(await scanSources(collection));
      const { io, output } = quietIo();
      const applied = await applyChanges(collection, plan, { date: '2025-06-01', io });
      assertEquals(applied.failures.map((failure) => failure.id), ['001', '002']);
      assertEquals(output.errLines.length, 2);
      assert(output.errLines[0].includes('could not make  001'));
    },
  ));
