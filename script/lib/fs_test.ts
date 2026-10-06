/// <reference lib="deno.ns" />
import { assertEquals } from '@std/assert';
import { ensureDir, listFiles, readJson, writeJson } from './fs.ts';

/** Run `fn` with a fresh temporary directory, removed afterwards. */
async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'bird_dash_fs_' });
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test('listFiles returns matching file names, sorted, and ignores folders', () =>
  withTempDir(async (dir) => {
    for (const name of ['b.png', 'a.png', 'notes.txt']) {
      await Deno.writeTextFile(`${dir}/${name}`, '');
    }
    await Deno.mkdir(`${dir}/folder.png`); // a directory whose name matches the filter
    assertEquals(await listFiles(dir, (n) => n.endsWith('.png')), ['a.png', 'b.png']);
  }));

Deno.test('listFiles treats a missing directory as empty', () =>
  withTempDir(async (dir) => {
    assertEquals(await listFiles(`${dir}/does-not-exist`, () => true), []);
  }));

Deno.test('ensureDir creates nested folders and is safe to repeat', () =>
  withTempDir(async (dir) => {
    const nested = `${dir}/a/b/c`;
    await ensureDir(nested);
    await ensureDir(nested); // already there: no error
    assertEquals((await Deno.stat(nested)).isDirectory, true);
  }));

Deno.test('writeJson then readJson round-trips, 2-space indented with a trailing newline', () =>
  withTempDir(async (dir) => {
    const path = `${dir}/data.json`;
    const data = { Ducks: [{ id: '001', name: 'Mallard' }] };
    await writeJson(path, data);
    assertEquals(await readJson(path), data);

    const text = await Deno.readTextFile(path);
    assertEquals(text.endsWith('}\n'), true);
    assertEquals(text.split('\n')[1], '  "Ducks": [');
  }));
