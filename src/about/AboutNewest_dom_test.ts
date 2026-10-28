import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import AboutNewest from './AboutNewest.vue';
import { makeCollection } from '../testing/fixtures.ts';
import { mountComponent } from '../testing/mount.ts';
import type { NewestDrawing } from '../data/files.ts';

const birds = makeCollection('birds', { imageBase: '/thumb/birds/' });
const drawing = (id: string, over: Partial<NewestDrawing> = {}): NewestDrawing => ({
  collection: 'birds',
  id,
  name: `Bird ${id}`,
  drawn: '2026-01-04',
  ...over,
});

const mount = (newest: NewestDrawing[]) =>
  mountComponent(() => h(AboutNewest, { collections: [birds], newest }));

test('the five newest drawings, each a link to its page in the viewer, with its thumbnail', () => {
  const host = mount(['001', '002', '003', '004', '005', '006'].map((id) => drawing(id)));
  const links = [...host.querySelectorAll('a')];
  assertEquals(links.map((a) => a.getAttribute('href')), [
    '#birds/001',
    '#birds/002',
    '#birds/003',
    '#birds/004',
    '#birds/005',
  ]);
  assertEquals(links[0]!.querySelector('img')!.getAttribute('src'), '/thumb/birds/001.webp');
  assertEquals(links[0]!.querySelector('img')!.getAttribute('alt'), 'Bird 001');
});

test('a Dhivehi line is captioned by the first name; without one the line keeps its height, hidden', () => {
  const host = mount([
    drawing('001', { dhivehi: 'ވަލު ކުކުޅު / ކުލީ ކުކުޅު' }),
    drawing('002'),
  ]);
  const lines = [...host.querySelectorAll('[lang="dv"]')];
  assertEquals(lines.map((s) => s.textContent!.trim()), ['ވަލު ކުކުޅު', '']);
  assertEquals(lines.map((s) => s.getAttribute('aria-hidden')), ['false', 'true']);
});

test('with nothing drawn, there is no section', () => {
  assertEquals(mount([]).querySelector('section'), null);
});
