import { test } from 'vitest';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { assertEquals, assertRejects } from '@std/assert';
import { ensureDir, listFiles } from './fs.ts';
import { tempDir } from '../../src/testing/fakes/tempDir.ts';

/** Run `fn` with a fresh temporary directory, removed afterwards. */
async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  await using dir = await tempDir('fs');
  await fn(dir.path);
}

test('listFiles returns matching file names, sorted, and ignores folders', () =>
  withTempDir(async (dir) => {
    for (const name of ['b.png', 'a.png', 'notes.txt']) {
      await writeFile(`${dir}/${name}`, '');
    }
    await mkdir(`${dir}/folder.png`); // a directory whose name matches the filter
    assertEquals(await listFiles(dir, (n) => n.endsWith('.png')), ['a.png', 'b.png']);
  }));

test('listFiles treats a missing directory as empty', () =>
  withTempDir(async (dir) => {
    assertEquals(await listFiles(`${dir}/does-not-exist`, () => true), []);
  }));

test('ensureDir creates nested folders and is safe to repeat', () =>
  withTempDir(async (dir) => {
    const nested = `${dir}/a/b/c`;
    await ensureDir(nested);
    await ensureDir(nested); // already there: no error
    assertEquals((await stat(nested)).isDirectory(), true);
  }));

test('listFiles still throws for errors other than a missing directory', () =>
  withTempDir(async (dir) => {
    await writeFile(`${dir}/file.txt`, '');
    await assertRejects(() => listFiles(`${dir}/file.txt`, () => true)); // not a directory
  }));
