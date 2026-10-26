import { test } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assert, assertEquals } from '@std/assert';
import { readJson, realIo, writeJson } from './io.ts';

// The real Io, against a real (temporary) folder and the real console.

test('the real Io reads, writes and lists files on disk', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bird_dash_io_'));
  try {
    await realIo.makeDir(`${dir}/deep/er`);
    await writeJson(realIo, `${dir}/deep/a.json`, { drawn: 3 });
    assertEquals(await readJson(realIo, `${dir}/deep/a.json`), { drawn: 3 });
    assertEquals(await realIo.readText(`${dir}/deep/a.json`), '{\n  "drawn": 3\n}\n');
    assertEquals(await realIo.listFiles(`${dir}/deep`), ['a.json']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the real Io reaches the environment, the clock and the console', () => {
  assertEquals(realIo.env('PATH'), process.env.PATH);
  assert(Math.abs(realIo.now().getTime() - Date.now()) < 5000);
  const [log, error] = [console.log, console.error];
  const printed: string[] = [];
  console.log = (line: string) => void printed.push(`out ${line}`);
  console.error = (line: string) => void printed.push(`err ${line}`);
  try {
    realIo.out('a');
    realIo.err('b');
  } finally {
    [console.log, console.error] = [log, error];
  }
  assertEquals(printed, ['out a', 'err b']);
});
