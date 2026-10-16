import { test } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertEquals, assertRejects } from '@std/assert';
import { ensureDir, listFiles, readJson, writeJson } from './fs.ts';

/** Run `fn` with a fresh temporary directory, removed afterwards. */
async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_fs_'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
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

test('writeJson then readJson round-trips, 2-space indented with a trailing newline', () =>
  withTempDir(async (dir) => {
    const path = `${dir}/data.json`;
    const data = { Ducks: [{ id: '001', name: 'Mallard' }] };
    await writeJson(path, data);
    assertEquals(await readJson(path), data);

    const text = await readFile(path, 'utf8');
    assertEquals(text.endsWith('}\n'), true);
    assertEquals(text.split('\n')[1], '  "Ducks": [');
  }));

test('listFiles still throws for errors other than a missing directory', () =>
  withTempDir(async (dir) => {
    await writeFile(`${dir}/file.txt`, '');
    await assertRejects(() => listFiles(`${dir}/file.txt`, () => true)); // not a directory
  }));
