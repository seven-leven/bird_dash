import { test } from 'vitest';
import { glob, readFile } from 'node:fs/promises';
import { assert, assertEquals } from '@std/assert';
import { contrast, STONE, TEAL, UNDRAWN, whiteOnBlack } from './palette.ts';

// The numbers DESIGN.md quotes are typed by hand; these check them against the
// code that draws and measures them, so the page cannot drift from the tokens.

const page = () => readFile('./docs/DESIGN.md', 'utf8');

/** The body rows of the table that starts with `header`, as trimmed cells without backticks. */
async function table(header: string): Promise<string[][]> {
  const md = await page();
  const start = md.indexOf(header);
  assert(start >= 0, `DESIGN.md has no table starting "${header}"`);
  const rows = md.slice(start).split('\n');
  const end = rows.findIndex((r) => !r.startsWith('|'));
  return rows.slice(2, end).map((r) =>
    r.split('|').slice(1, -1).map((c) => c.trim().replace(/`/g, ''))
  );
}

/** A colour as the page names it: `stone-500`, `accent-700`, white, black, "white at 70%". */
function colour(name: string): string {
  const alpha = /^white at (\d+)%$/.exec(name);
  if (alpha) return whiteOnBlack(Number(alpha[1]) / 100);
  if (name === 'white') return '#ffffff';
  if (name === 'black') return '#000000';
  const [ramp, step] = name.split('-');
  const hex = (ramp === 'stone' ? STONE : ramp === 'accent' ? TEAL : {})[step];
  assert(hex, `DESIGN.md names a colour the palette does not have: ${name}`);
  return hex;
}

test('the ramps in DESIGN.md are the palette, step for step', async () => {
  const rows = await table('| Step ');
  assertEquals(rows.map((r) => r[0]), Object.keys(STONE));
  for (const [step, stone, accent] of rows) {
    assertEquals([stone, accent], [STONE[step], TEAL[step]], `step ${step}`);
  }
});

test('every contrast ratio in DESIGN.md is what the palette measures', async () => {
  const rows = await table('| Pair ');
  assert(rows.length >= 6);
  for (const [pair, ratio] of rows) {
    const [fg, bg] = pair.split(' on ');
    assertEquals(ratio, `${contrast(colour(fg), colour(bg)).toFixed(1)}:1`, pair);
  }
});

test("the undrawn tile's colours in DESIGN.md are the ones the site and the guide draw in", async () => {
  const rows = await table('| Theme | Tile ');
  const hexes = (cell: string) => cell.match(/#[0-9a-f]{6}/g);
  assertEquals(rows.map((r) => [hexes(r[1])?.at(-1), hexes(r[2])?.at(-1)]), [
    [STONE[UNDRAWN.light.background], STONE[UNDRAWN.light.ink]],
    [STONE[UNDRAWN.dark.background], STONE[UNDRAWN.dark.ink]],
  ]);
  // The tile itself (src/gallery/ItemTile.vue) draws in the same steps.
  const tile = await readFile('./src/gallery/ItemTile.vue', 'utf8');
  const { light, dark } = UNDRAWN;
  assert(tile.includes(`text-stone-${light.ink} dark:text-stone-${dark.ink}`), 'the icon');
  assert(
    tile.includes(`bg-stone-${light.background} dark:bg-stone-${dark.background}`),
    'the grey',
  );
});

test('a colour the palette lacks is reported, not guessed', () => {
  let message = '';
  try {
    colour('amber-500');
  } catch (e) {
    message = (e as Error).message;
  }
  assertEquals(message, 'DESIGN.md names a colour the palette does not have: amber-500');
});

test('the site sets text in the five sizes DESIGN.md lists, and no other', async () => {
  const listed = (await table('| Token ')).map((row) => row[0]);
  assertEquals(listed.length, 5);
  const used = new Set<string>();
  for await (const path of glob('src/**/*.{vue,css}')) {
    const source = await readFile(path, 'utf8');
    for (
      const [size] of source.matchAll(
        /\btext-(?:xs|sm|base|lg|[0-9]?xl|micro|\[[^\]]+\])(?=[\s"'`;]|$)/g,
      )
    ) {
      used.add(size);
    }
  }
  assertEquals([...used].filter((size) => !listed.includes(size)), []);
});
