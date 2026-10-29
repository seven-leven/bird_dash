// Keeps: sharedLink (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { access } from 'node:fs/promises';
import { assertEquals } from '@std/assert';
import { readJson, realIo } from '../lib/io.ts';
import { PATHS } from '../lib/paths.ts';
import type { Stats } from '../../src/data/files.ts';
import { linkPreviews } from './linkPreviews.ts';

// The build's preview pages, from the real lists: one per drawing, each pointing at an image
// that is there.

test('the build writes a preview for every drawing, and each shows an image the site has', async () => {
  const emitted: { fileName: string; source: string }[] = [];
  const context = { emitFile: (file: { fileName: string; source: string }) => emitted.push(file) };
  const generateBundle = linkPreviews().generateBundle as unknown as (
    this: typeof context,
  ) => Promise<void>;
  await generateBundle.call(context);

  const stats = await readJson<Stats>(realIo, PATHS.stats);
  assertEquals(emitted.length, stats.drawn);
  for (const { source } of emitted) {
    const image = /og:image" content="[^"]*\/(full\/[^"]+)"/.exec(source)![1];
    await access(`./public/${image}`); // throws if the drawing is missing
  }
});
