import { test } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { assertEquals } from '@std/assert';

// The rules in docs/SCRIPTS.md that a machine can check, over every file in script/.
// The rest (a verb from the list, whole words, one job per command) is for review.

const files = (await readdir('./script', { recursive: true }))
  .map((path) => path.replaceAll('\\', '/'))
  .filter((path) => path.endsWith('.ts'))
  .sort();
const sources = files.filter((path) => !path.endsWith('_test.ts'));
const nameOf = (path: string) => path.split('/').at(-1)!;
const folderOf = (path: string) => path.split('/').at(-2);

const CAMEL = '[a-z][a-zA-Z0-9]*';
const SOURCE_NAME = new RegExp(`^${CAMEL}\\.ts$`);
// `planChanges_test.ts`, `ItemTile`-style names are src/'s; a split of a long file adds a
// behaviour: `ingest_pipeline_test.ts`.
const TEST_NAME = new RegExp(
  `^${CAMEL}(_${CAMEL})?_(dom_|prop_|contract_|journey_|browser_)?test\\.ts$`,
);

test('every file in script/ is named in camelCase, a test with its tier suffix', () => {
  const misnamed = files.filter((path) => {
    const name = nameOf(path);
    return !(path.endsWith('_test.ts') ? TEST_NAME : SOURCE_NAME).test(name);
  });
  assertEquals(misnamed, []);
});

test('no exported name starts with a word that says only that something happens', async () => {
  const BANNED = /^(get|load|do|handle|process|run|execute|cli)([A-Z]|$)/;
  const found: string[] = [];
  for (const path of sources) {
    const text = await readFile(`./script/${path}`, 'utf8');
    for (const [, name] of text.matchAll(/^export (?:async )?(?:function|const|class) (\w+)/gm)) {
      if (BANNED.test(name!)) found.push(`${path}: ${name}`);
    }
  }
  assertEquals(found, []);
});

test('every command is made with `command`, in a file named after its folder', async () => {
  const commands: string[] = [];
  const wrong: string[] = [];
  for (const path of sources) {
    const text = await readFile(`./script/${path}`, 'utf8');
    if (!/^export (?:const|(?:async )?function) main\b/m.test(text)) continue;
    commands.push(path);
    if (!/^export const main = command[<(]/m.test(text)) {
      wrong.push(`${path}: not made with command`);
    }
    if (nameOf(path) !== `${folderOf(path)}.ts`) wrong.push(`${path}: not named after its folder`);
  }
  assertEquals(wrong, []);
  // The commands there are; a new one is added here on purpose.
  assertEquals(commands, [
    'build/build.ts',
    'changelog/changelog.ts',
    'check/check.ts',
    'generate/generate.ts',
    'ingest/ingest.ts',
    'testRunner/testRunner.ts',
    'version/version.ts',
  ]);
});
