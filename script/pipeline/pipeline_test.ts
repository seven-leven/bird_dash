/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import sharp from 'sharp';
import { scanCollection } from './scan.ts';
import { blockingIssues, planWork } from './plan.ts';
import { executeWork } from './execute.ts';
import { printCheckReport, printSummary, reportWarnings } from './report.ts';
import { transcode, transcodeThumb } from '../image/transcode.ts';
import type { Collection } from '../collection/registry.ts';

// The asset pipeline end to end, on real (tiny) images in a temporary folder:
// scan → plan → execute → scan again. Nothing here touches public/ or raw_png/.

// sharp caches open files by default; on Windows that keeps them locked, so the
// temporary folder could not be removed afterwards.
sharp.cache(false);

type Item = { id: string; name: string; drawn?: string };

/** A throwaway collection on disk. `raw` lists the ids that get a source PNG. */
async function withCollection(
  items: Item[],
  raw: string[],
  fn: (col: Collection, dir: string) => Promise<void>,
): Promise<void> {
  const dir = await Deno.makeTempDir({ prefix: 'bird_dash_pipeline_' });
  const col: Collection = {
    id: 'x',
    label: 'Test',
    emoji: '🧪',
    paths: {
      json: `${dir}/list.json`,
      raw: `${dir}/raw/`,
      full: `${dir}/full/`,
      thumb: `${dir}/thumb/`,
      placeholder: '',
      placeholderDark: '',
    },
  };
  try {
    await Deno.writeTextFile(col.paths.json, JSON.stringify({ Group: items }));
    await Deno.mkdir(col.paths.raw);
    for (const id of raw) {
      // A wide, non-square source, so squaring it is actually exercised.
      await sharp({
        create: { width: 60, height: 30, channels: 3, background: '#cc3333' },
      }).png().toFile(`${col.paths.raw}${id}.png`);
    }
    await fn(col, dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** Run `fn` and return everything it printed, without printing it. */
async function captured(fn: () => unknown): Promise<string> {
  const lines: string[] = [];
  const { log, error } = console;
  console.log = (...a: unknown[]) => lines.push(a.join(' '));
  console.error = (...a: unknown[]) => lines.push(a.join(' '));
  try {
    await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
  return lines.join('\n');
}

const size = async (path: string) => {
  const { width, height, format } = await sharp(await Deno.readFile(path)).metadata();
  return { width, height, format };
};

// ── transcode ──

Deno.test('transcode writes a square 2048px full image and a 400px thumbnail, both WebP', () =>
  withCollection([], ['001'], async (col) => {
    assertEquals(await transcode(col, '001'), { ok: true });
    assertEquals(await size(`${col.paths.full}001.webp`), {
      width: 2048,
      height: 2048,
      format: 'webp',
    });
    assertEquals(await size(`${col.paths.thumb}001.webp`), {
      width: 400,
      height: 400,
      format: 'webp',
    });
  }));

Deno.test('transcode pads a non-square source with white instead of cropping it', () =>
  withCollection([], ['001'], async (col) => {
    await transcode(col, '001');
    const file = await Deno.readFile(`${col.paths.full}001.webp`);
    const { data, info } = await sharp(file).raw().toBuffer({
      resolveWithObject: true,
    });
    const pixel = (x: number, y: number) => {
      const i = (y * info.width + x) * info.channels;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const [r, g, b] = pixel(1024, 20); // top band: outside the 2:1 picture
    assert(r > 240 && g > 240 && b > 240, `expected white padding, got ${[r, g, b]}`);
    const [cr, cg] = pixel(1024, 1024); // centre: the red source
    assert(cr > 150 && cg < 100, `expected the picture in the middle, got ${[cr, cg]}`);
  }));

Deno.test('transcode reports a missing source as a failure, not an exception', () =>
  withCollection([], [], async (col) => {
    const result = await transcode(col, '404');
    assertEquals(result.ok, false);
    assert(!result.ok && result.error.length > 0);
  }));

Deno.test('transcodeThumb rebuilds a thumbnail from the full image; fails without one', () =>
  withCollection([], ['001'], async (col) => {
    await transcode(col, '001');
    await Deno.remove(`${col.paths.thumb}001.webp`);
    assertEquals(await transcodeThumb(col, '001'), { ok: true });
    assertEquals((await size(`${col.paths.thumb}001.webp`)).width, 400);

    assertEquals((await transcodeThumb(col, '404')).ok, false);
  }));

// ── the whole run ──

Deno.test('a build registers new drawings, makes their images, and leaves nothing to do', () =>
  withCollection(
    [
      { id: '001', name: 'Already drawn', drawn: '2025-01-01' },
      { id: '002', name: 'New drawing' }, // has a PNG but no date yet
      { id: '003', name: 'Not drawn' },
    ],
    ['001', '002'],
    async (col) => {
      const plan = planWork(await scanCollection(col));
      assertEquals(plan.toRegister, ['002']);
      assertEquals(plan.toTranscode.sort(), ['001', '002']);
      assert(blockingIssues(plan) > 0);

      let result!: Awaited<ReturnType<typeof executeWork>>;
      const output = await captured(async () => {
        result = await executeWork(col, plan, '2025-06-01');
      });
      assertEquals(result, { registered: ['002'], failed: [] });
      assert(output.includes('registered') && output.includes('New drawing (002)'));

      // The list file now dates the new drawing and leaves the others alone.
      const saved = JSON.parse(await Deno.readTextFile(col.paths.json));
      assertEquals(saved.Group.map((i: Item) => i.drawn), ['2025-01-01', '2025-06-01', undefined]);

      // A second scan finds nothing left to do.
      const after = planWork(await scanCollection(col));
      assertEquals(blockingIssues(after), 0);
      assertEquals(after.missingRaw, []);
    },
  ));

Deno.test('a drawing with no source image fails that item and is reported, not thrown', () =>
  withCollection([{ id: '001', name: 'No PNG', drawn: '2025-01-01' }], [], async (col) => {
    const plan = planWork(await scanCollection(col));
    assertEquals(plan.missingRaw, ['001']);

    let result!: Awaited<ReturnType<typeof executeWork>>;
    const output = await captured(async () => {
      reportWarnings(col, plan);
      result = await executeWork(col, plan, '2025-06-01');
    });
    assertEquals(result.registered, []);
    assertEquals(result.failed.map((f) => f.id), ['001']);
    assert(output.includes('raw PNG missing'), 'the pre-run warning is missing');
    assert(output.includes('transcode failed'), 'the failure was not logged');
  }));

Deno.test('a missing thumbnail alone is repaired from the full image', () =>
  withCollection([{ id: '001', name: 'A', drawn: '2025-01-01' }], ['001'], async (col) => {
    await transcode(col, '001');
    await Deno.remove(`${col.paths.thumb}001.webp`);

    const plan = planWork(await scanCollection(col));
    assertEquals([plan.toTranscode, plan.toTranscodeThumb], [[], ['001']]);
    await captured(() => executeWork(col, plan, '2025-06-01'));
    assertEquals(blockingIssues(planWork(await scanCollection(col))), 0);
  }));

Deno.test('a source PNG whose id is not in the list is skipped with a warning', () =>
  withCollection([{ id: '001', name: 'A' }], ['999'], async (col) => {
    const plan = planWork(await scanCollection(col));
    assertEquals(plan.toRegister, ['999']);
    let result!: Awaited<ReturnType<typeof executeWork>>;
    const output = await captured(async () => {
      result = await executeWork(col, plan, '2025-06-01');
    });
    assertEquals(result.registered, []);
    assert(output.includes('id 999 not found in JSON'));
  }));

// ── reports ──

Deno.test('the build summary shows new drawings, failures, the version and the time', () =>
  withCollection([], [], async (col) => {
    const plan = planWork({
      drawnIds: new Set(),
      rawIds: new Set(),
      fullIds: new Set(),
      thumbIds: new Set(),
    });
    const output = await captured(() =>
      printSummary(
        [
          { col, plan, result: { registered: ['002'], failed: [] }, drawnCount: 3 },
          {
            col,
            plan,
            result: { registered: [], failed: [{ id: '009', reason: 'boom' }] },
            drawnCount: 1,
          },
        ],
        '0.9.1 · 4 drawings · abc1234',
        1234,
      )
    );
    assert(output.includes('3 drawn') && output.includes('+1 new') && output.includes('✓'));
    assert(output.includes('✗ 1 error') && output.includes('009  boom'));
    assert(output.includes('0.9.1 · 4 drawings · abc1234') && output.includes('1.23s'));
  }));

Deno.test('the check report lists each problem by kind and notes missing sources', () =>
  withCollection([], [], async (col) => {
    const state = {
      drawnIds: new Set(['001', '002']),
      rawIds: new Set(['003']),
      fullIds: new Set(['001', '777']),
      thumbIds: new Set(['888']),
    };
    const plan = planWork(state);
    const output = await captured(() => {
      printCheckReport([{ col, state, plan }], 'v-test');
      reportWarnings(col, plan);
    });
    for (
      const expected of [
        'v-test',
        '2 drawn',
        '1 raw',
        'unregistered PNG      003',
        'missing full WebP     002',
        'missing thumb         001',
        'orphaned full WebP    777',
        'orphaned thumb        888',
        'drawn without a raw PNG',
        'orphaned full WebP (not in JSON)  777',
        'orphaned thumb (not in JSON)  888',
      ]
    ) assert(output.includes(expected), `report is missing "${expected}"\n${output}`);
    assert(/✗ \d+ issues/.test(output));
  }));

Deno.test('a clean collection gets a tick in the check report', () =>
  withCollection([], [], async (col) => {
    const state = {
      drawnIds: new Set(['001']),
      rawIds: new Set(['001']),
      fullIds: new Set(['001']),
      thumbIds: new Set(['001']),
    };
    const output = await captured(() =>
      printCheckReport([{ col, state, plan: planWork(state) }], 'v')
    );
    assert(output.includes('✓') && !output.includes('✗'));
  }));
