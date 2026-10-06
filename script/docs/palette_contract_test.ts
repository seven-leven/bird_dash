/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { ACCENT_HEX, accentMenu, contrast, whiteOnBlack } from './palette.ts';

Deno.test('contrast: black on white is 21:1 and the order of arguments does not matter', () => {
  assertEquals(Math.round(contrast('#000000', '#ffffff')), 21);
  assertEquals(contrast('#14b8a6', '#ffffff'), contrast('#ffffff', '#14b8a6'));
  assertEquals(contrast('#777777', '#777777'), 1);
});

Deno.test('whiteOnBlack turns an opacity into the grey it produces', () => {
  assertEquals(whiteOnBlack(1), '#ffffff');
  assertEquals(whiteOnBlack(0.5), '#808080');
  assertEquals(whiteOnBlack(0), '#000000');
});

// The rule in docs/DESIGN.md for a hue to be offered as a collection accent.
Deno.test('every accent on the menu in main.css passes the contrast rule', async () => {
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
