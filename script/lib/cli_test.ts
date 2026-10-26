import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { EXIT, parseArgs, runCommand, UsageError } from './cli.ts';
import { fakeIo } from './fakeIo.ts';

test('arguments split into the flags the command takes and the words around them', () => {
  const { flags, words } = parseArgs(['birds', '--', '--dry-run', 'sharks'], ['--dry-run']);
  assertEquals([...flags], ['--dry-run']);
  assertEquals(words, ['birds', 'sharks']);
});

test('a flag the command does not take is a usage error that lists the ones it does', () => {
  assertThrows(
    () => parseArgs(['--fast'], ['--dry-run']),
    UsageError,
    'unknown option --fast (this command takes: --dry-run, --help)',
  );
});

test('a command that finishes exits 0, or with the code it returns', async () => {
  assertEquals(await runCommand(fakeIo(), [], 'usage', async () => {}), EXIT.done);
  assertEquals(await runCommand(fakeIo(), [], 'usage', () => Promise.resolve(EXIT.problem)), 1);
});

test('--help prints the usage and runs nothing', async () => {
  const io = fakeIo();
  let ran = false;
  assertEquals(await runCommand(io, ['--help'], 'npm run x', async () => void (ran = true)), 0);
  assertEquals([io.outLines, ran], [['npm run x'], false]);
});

test('wrong arguments exit 2 with the problem and the usage', async () => {
  const io = fakeIo();
  const code = await runCommand(io, ['--fast'], 'npm run x', async () => {
    parseArgs(['--fast'], []);
  });
  assertEquals(code, EXIT.usage);
  assertEquals(io.errLines, ['✗ unknown option --fast (this command takes: --help)', 'npm run x']);
});

test('a problem thrown by the work exits 1 and is reported by its first line', async () => {
  const io = fakeIo();
  const code = await runCommand(io, [], 'usage', () => Promise.reject(new Error('no list\nstack')));
  assertEquals([code, io.errLines], [EXIT.problem, ['✗ no list']]);
  const thrown = await runCommand(io, [], 'usage', () => Promise.reject('plain words'));
  assertEquals([thrown, io.errLines.at(-1)], [1, '✗ plain words']);
});
