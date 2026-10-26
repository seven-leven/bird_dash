import { test } from 'vitest';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { main, pickStages, STAGES } from './build.ts';
import { UsageError } from '../lib/cli.ts';
import { fakeIo } from '../lib/fakeIo.ts';
import { PATHS } from '../lib/paths.ts';

// ── the stages ──

test('a full build runs the site, then the docs, each with this Node', async () => {
  const io = fakeIo();
  assertEquals(await main([], io), 0);
  assertEquals(io.ran, [
    `${PATHS.viteBin} build --config ${PATHS.viteConfig}`,
    `${PATHS.vitepressBin} build docs`,
  ]);
  assert(io.outLines.some((line) => /✓ site\s+\d+\.\d\ds/.test(line)), io.outLines.join('\n'));
  assert(io.outLines.some((line) => /✓ docs\s+\d+\.\d\ds/.test(line)));
});

test('naming stages builds only those, always in build order', async () => {
  const io = fakeIo();
  assertEquals(await main(['docs'], io), 0);
  assertEquals(io.ran, [`${PATHS.vitepressBin} build docs`]);
  assertEquals(pickStages(['docs', 'site']).map((stage) => stage.id), ['site', 'docs']);
  assertEquals(pickStages([]), STAGES);
});

test('an unknown stage is a usage error that lists the stages', async () => {
  assertThrows(
    () => pickStages(['assets']),
    UsageError,
    'no stage assets (the stages: site, docs)',
  );
  const io = fakeIo();
  assertEquals(await main(['assets'], io), 2);
  assertEquals(io.ran, []);
});

test('a stage that fails stops the build with exit 1, and the later stages do not run', async () => {
  const io = fakeIo({ exitCodes: { [PATHS.viteBin]: 3 } });
  assertEquals(await main([], io), 1);
  assertEquals(io.ran.length, 1);
  assertEquals(io.errLines, ['✗ build: site failed (exit code 3)']);
});
