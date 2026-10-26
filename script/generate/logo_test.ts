import { test } from 'vitest';
import { assert, assertStringIncludes } from '@std/assert';
import { logoSheetSvg, logoSvg } from './logo.ts';

test('logoSvg is a standalone file in one colour, at the size asked for', () => {
  const mark = logoSvg('mark', '#123456');
  assert(mark.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"'));
  assertStringIncludes(mark, 'stroke="#123456"');
  assert(!mark.includes('currentColor'), 'a standalone file has no page to take a colour from');

  const tile = logoSvg('tile', '#123456', 512);
  assertStringIncludes(tile, 'width="512" height="512" viewBox="0 0 32 32"');
  assertStringIncludes(tile, 'fill="#123456"');
});

test('the logo sheet shows each version and the rules', () => {
  const sheet = logoSheetSvg();
  for (const label of ['MARK', 'TILE', 'HORIZONTAL LOCKUP', 'STACKED', 'SIZES', 'CLEAR SPACE']) {
    assertStringIncludes(sheet, `>${label}</text>`);
  }
  assertStringIncludes(sheet, 'recolour it with a collection accent');
  assertStringIncludes(sheet, '>Wildlife</tspan>');
});
