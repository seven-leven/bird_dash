import { test } from 'vitest';
import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  ACCENT_HEX,
  accentMenu,
  contrast,
  oklchToHex,
  SLATE,
  TEAL,
  whiteOnBlack,
} from './palette.ts';

test('contrast: black on white is 21:1 and the order of arguments does not matter', () => {
  assertEquals(Math.round(contrast('#000000', '#ffffff')), 21);
  assertEquals(contrast('#14b8a6', '#ffffff'), contrast('#ffffff', '#14b8a6'));
  assertEquals(contrast('#777777', '#777777'), 1);
});

test('whiteOnBlack turns an opacity into the grey it produces', () => {
  assertEquals(whiteOnBlack(1), '#ffffff');
  assertEquals(whiteOnBlack(0.5), '#808080');
  assertEquals(whiteOnBlack(0), '#000000');
});

// The rule in docs/DESIGN.md for a hue to be offered as a collection accent.
test('every accent on the menu in main.css passes the contrast rule', async () => {
  const menu = await accentMenu();
  assert(menu.includes('teal'), 'the default accent is missing from the menu');
  assertEquals(new Set(menu).size, menu.length);

  for (const hue of menu) {
    const hex = ACCENT_HEX[hue];
    assert(hex, `${hue}: no hex values in ACCENT_HEX, so the design guide cannot draw it`);
    const button = contrast('#ffffff', hex[700]);
    const marker = contrast(hex[500], '#ffffff');
    assert(button >= 4.5, `${hue}: white on 700 is ${button.toFixed(1)}:1, below 4.5:1`);
    assert(marker >= 2.4, `${hue}: 500 on white is ${marker.toFixed(1)}:1, paler than allowed`);
  }
});

test("oklchToHex turns Tailwind's oklch colours into the hex a screen shows", () => {
  assertEquals(oklchToHex('oklch(100% 0 0)'), '#ffffff');
  assertEquals(oklchToHex('oklch(0% 0 0)'), '#000000');
  assertEquals(oklchToHex('oklch(55.6% 0 none)'), '#737373'); // a grey has no hue
  // Tailwind's published hex for these shades.
  assertEquals([SLATE['500'], TEAL['500'], TEAL['700']], ['#62748e', '#00bba7', '#00786f']);
});

test('oklchToHex refuses anything that is not an oklch() colour', () => {
  assertThrows(() => oklchToHex('#ffffff'), Error, 'not an oklch() colour: #ffffff');
});
