import { test } from 'vitest';
import { assertEquals } from '@std/assert';
import { balanceTwoLines } from './guideDrawing.ts';

test('a heading breaks into two lines at its most even space', () => {
  assertEquals(balanceTwoLines('Drawings first'), ['Drawings', 'first']);
  assertEquals(balanceTwoLines('Always say where you are'), ['Always say', 'where you are']);
  assertEquals(balanceTwoLines('One way to do each thing'), ['One way to', 'do each thing']);
});

test('a single word stays one line', () => {
  assertEquals(balanceTwoLines('Drawings'), ['Drawings']);
});
