import { test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { discoverTests } from './tiers.ts';

// docs/TESTING.md, "Promises": what the site promises, and the tests that keep each. A test says
// which it keeps on a line of its own, `// Keeps: place, counts`; a journey names itself in its
// first comment, `// J1 First visit: …`. These hold the list and the tests to each other, both
// ways: a promise no test keeps is a gap, and a test that names a promise not on the list is a
// typo or a promise someone forgot to write down.

interface ListedPromise {
  id: string;
  /** The journeys its "Kept by" names: J1, J3. */
  journeys: string[];
}

/** The promise table's rows: `| \`place\` | … | … | journey J1; unit (…) |`. */
async function promiseList(): Promise<ListedPromise[]> {
  const doc = await readFile('docs/TESTING.md', 'utf8');
  const start = doc.indexOf('## Promises');
  const section = doc.slice(start, doc.indexOf('\n## ', start + 1));
  return [...section.matchAll(/^\| `(\w+)` +\|[^|]+\|[^|]+\|([^|]+)\|$/gm)].map((m) => ({
    id: m[1]!,
    journeys: [...m[2]!.matchAll(/\bJ(\d+)\b/g)].map((j) => `J${j[1]}`),
  }));
}

/** Every test file that keeps a promise, with the ids it names and its journey number, if any. */
async function keepers() {
  const files = await discoverTests();
  const found: { file: string; keeps: string[]; journey?: string }[] = [];
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const keeps = /^\/\/ Keeps: ([\w, ]+?)(?: \(|$)/m.exec(code)?.[1];
    const journey = /^\/\/ (J\d+) /.exec(code)?.[1];
    if (keeps || journey) {
      found.push({
        file,
        keeps: keeps ? keeps.split(',').map((id) => id.trim()) : [],
        ...(journey ? { journey } : {}),
      });
    }
  }
  return found;
}

test('the promise list has ids, each once', async () => {
  const ids = (await promiseList()).map((p) => p.id);
  assert(ids.length >= 10, `found only ${ids.length} promises in docs/TESTING.md`);
  assertEquals(ids.length, new Set(ids).size, 'a promise id is used twice');
});

test('every promise is kept by at least one test', async () => {
  const kept = new Set((await keepers()).flatMap((k) => k.keeps));
  assertEquals(
    (await promiseList()).map((p) => p.id).filter((id) => !kept.has(id)),
    [],
    'no test says `// Keeps:` for these: a gap, or a test that forgot to say',
  );
});

test('every promise a test names is on the list', async () => {
  const ids = new Set((await promiseList()).map((p) => p.id));
  const unknown = (await keepers()).flatMap((k) =>
    k.keeps.filter((id) => !ids.has(id)).map((id) => `${k.file}: ${id}`)
  );
  assertEquals(unknown, [], 'add the promise to docs/TESTING.md, or fix the id');
});

test('every journey keeps a promise, and the list names it where it does', async () => {
  const list = await promiseList();
  const journeys = (await keepers()).filter((k) => k.journey);
  assert(journeys.length >= 9, `found only ${journeys.length} journeys`);
  const wrong: string[] = [];
  for (const j of journeys) {
    if (j.keeps.length === 0) wrong.push(`${j.file} (${j.journey}) keeps no promise`);
    for (const p of list) {
      const claims = j.keeps.includes(p.id);
      const listed = p.journeys.includes(j.journey!);
      if (claims && !listed) wrong.push(`${p.id}: "Kept by" should name ${j.journey}`);
      if (listed && !claims) wrong.push(`${j.file} should say it keeps ${p.id}`);
    }
  }
  assertEquals(wrong, []);
});

test('every journey a promise names exists', async () => {
  const journeys = new Set((await keepers()).map((k) => k.journey).filter(Boolean));
  const missing = (await promiseList()).flatMap((p) =>
    p.journeys.filter((j) => !journeys.has(j)).map((j) => `${p.id}: ${j}`)
  );
  assertEquals(missing, [], 'no file in src/journeys/ starts with these');
});
