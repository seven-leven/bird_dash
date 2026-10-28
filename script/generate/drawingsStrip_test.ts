import { test } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { assertEquals } from '@std/assert';
import sharp from 'sharp';
import { STRIP, writeDrawingsStrip } from './drawingsStrip.ts';
import { realIo } from '../lib/io.ts';
import { type TempDir, tempDir } from '../../src/testing/fakes/tempDir.ts';

// sharp caches open files; on Windows that would keep the temporary folder locked.
sharp.cache(false);

/** A public/ folder holding stats.json with these drawings, each a small thumbnail. */
async function fakePublic(ids: string[]): Promise<TempDir> {
  const folder = await tempDir('strip');
  const dir = folder.path;
  await mkdir(`${dir}/thumb/birds`, { recursive: true });
  for (const id of ids) {
    await sharp({ create: { width: 40, height: 30, channels: 3, background: '#336699' } })
      .webp()
      .toFile(`${dir}/thumb/birds/${id}.webp`);
  }
  const newest = ids.map((id) => ({ collection: 'birds', id, name: id, drawn: '2026-01-01' }));
  await writeFile(`${dir}/stats.json`, JSON.stringify({ newest }));
  return folder;
}

test('the strip shows the newest drawings, at most five, each in its own card', async () => {
  for (const [count, shown] of [[7, STRIP.count], [2, 2]] as const) {
    await using folder = await fakePublic(Array.from({ length: count }, (_, i) => `00${i}`));
    const dir = folder.path;
    assertEquals(
      await writeDrawingsStrip(`${dir}/strip.webp`, realIo, `${dir}/stats.json`, dir),
      true,
    );
    const { width, height } = await sharp(await readFile(`${dir}/strip.webp`)).metadata();
    assertEquals([width, height], [
      shown! * STRIP.tile + (shown! + 1) * STRIP.gap,
      STRIP.tile + 2 * STRIP.gap,
    ]);
  }
});

test('with nothing drawn there is no strip to write', async () => {
  await using folder = await fakePublic([]);
  const dir = folder.path;
  assertEquals(
    await writeDrawingsStrip(`${dir}/strip.webp`, realIo, `${dir}/stats.json`, dir),
    false,
  );
});
