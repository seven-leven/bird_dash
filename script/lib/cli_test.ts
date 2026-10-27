import { test } from 'vitest';
import { assertEquals, assertThrows } from '@std/assert';
import { command, EXIT, parseArgs, printLines, UsageError } from './cli.ts';
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

test('a command that finishes exits 0, or with the code its work returns', async () => {
  assertEquals(await command('usage', async () => {})([], fakeIo()), EXIT.done);
  assertEquals(await command('usage', () => Promise.resolve(EXIT.problem))([], fakeIo()), 1);
});

test('a command passes its work the arguments, the Io and the options it was given', async () => {
  const io = fakeIo();
  const main = command<{ name?: string }>('usage', async (args, given, options) => {
    given.out(`${args.join(' ')} ${options.name ?? 'none'}`);
  });
  await main(['a', 'b'], io, { name: 'birds' });
  await main([], io);
  assertEquals(io.outLines, ['a b birds', ' none']);
});

test('--help prints the usage and does no work', async () => {
  const io = fakeIo();
  let worked = false;
  assertEquals(await command('npm run x', async () => void (worked = true))(['--help'], io), 0);
  assertEquals([io.outLines, worked], [['npm run x'], false]);
});

test('wrong arguments exit 2 with the problem and the usage', async () => {
  const io = fakeIo();
  const main = command('npm run x', async (args) => {
    parseArgs(args, []);
  });
  assertEquals(await main(['--fast'], io), EXIT.usage);
  assertEquals(io.errLines, ['✗ unknown option --fast (this command takes: --help)', 'npm run x']);
});

test('a problem thrown by the work exits 1 and is reported by its first line', async () => {
  const io = fakeIo();
  const failing = command('usage', () => Promise.reject(new Error('no list\nstack')));
  assertEquals([await failing([], io), io.errLines], [EXIT.problem, ['✗ no list']]);
  const thrown = await command('usage', () => Promise.reject('plain words'))([], io);
  assertEquals([thrown, io.errLines.at(-1)], [1, '✗ plain words']);
});

test('an option with a value is read, and one with none is a usage error', () => {
  assertEquals(parseArgs(['--into', './out', 'x'], [], ['--into']).values.get('--into'), './out');
  assertThrows(() => parseArgs(['--into'], [], ['--into']), UsageError, '--into needs a value');
  assertThrows(() => parseArgs(['--into', '--x'], [], ['--into']), UsageError, 'needs a value');
});

test('an option can take its value after an equals sign, and a flag cannot take one', () => {
  assertEquals(parseArgs(['--into=./out'], [], ['--into']).values.get('--into'), './out');
  assertThrows(
    () => parseArgs(['--dry-run=yes'], ['--dry-run']),
    UsageError,
    '--dry-run takes no value',
  );
});

test('a report prints its problems on stderr and the rest on stdout', () => {
  const io = fakeIo();
  printLines(io, [{ text: 'fine' }, { text: 'broken', problem: true }]);
  assertEquals([io.outLines, io.errLines], [['fine'], ['broken']]);
});
