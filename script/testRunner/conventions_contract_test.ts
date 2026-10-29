import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { discoverTests, TIERS } from './tiers.ts';

// docs/TESTING.md, "Conventions": the ones marked ✓, which a machine can check over every test
// file. Lower case is not among them: a title may begin with a name (Escape, Share, Vitest).

const SUFFIXES = Object.values(TIERS).map((t) => t.suffix.slice(1).replace('.', '\\.'));
/** `<subject>_<tier suffix>`, or a split of a long file: `<subject>_<behaviour>_<tier suffix>`. */
const TEST_NAME = new RegExp(`^[A-Za-z][A-Za-z0-9]*(_[a-z][A-Za-z0-9]*)?_(${SUFFIXES.join('|')})$`);

/** Every test file with its titles, as written: `test('…', …)`. */
async function titlesByFile() {
  const files = await discoverTests();
  assert(files.length > 50, `found only ${files.length} test files`);
  return Promise.all(files.map(async (file) => {
    const code = await readFile(file, 'utf8');
    const titles = [...code.matchAll(/^test\((['"`])(.*?)\1,/gm)].map((m) => m[2]!);
    return { file, code, titles };
  }));
}

test('a test file is named <subject>_<tier suffix>, or with a behaviour between', async () => {
  const misnamed = (await titlesByFile()).map((f) => f.file).filter((f) =>
    !TEST_NAME.test(f.split('/').at(-1)!)
  );
  assertEquals(misnamed, []);
});

test('a title says the behaviour: no "name:" prefix, no "should", no full stop', async () => {
  const wrong = (await titlesByFile()).flatMap(({ file, titles }) =>
    titles.filter((t) =>
      // A contract's subject may be a file: "collections.json: …".
      (/^\w+: /.test(t) && !file.endsWith('_contract_test.ts')) ||
      /^should\b/i.test(t) || t.endsWith('.')
    ).map((t) => `${file}: ${t}`)
  );
  assertEquals(wrong, []);
});

test('a title is unique in its file and under about 120 characters', async () => {
  const wrong = (await titlesByFile()).flatMap(({ file, titles }) => [
    ...titles.filter((t, i) => titles.indexOf(t) !== i).map((t) => `${file}: twice: ${t}`),
    ...titles.filter((t) => t.length > 120).map((t) => `${file}: long: ${t}`),
  ]);
  assertEquals(wrong, []);
});

test('no .only, .skip or .todo is committed', async () => {
  const left = (await titlesByFile()).filter(({ code }) =>
    /\b(test|it|describe)\.(only|skip|todo)\(/.test(code)
  ).map((f) => f.file);
  assertEquals(left, []);
});
