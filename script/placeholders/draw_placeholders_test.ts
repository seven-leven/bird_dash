import { test } from 'vitest';
import { assert, assertStringIncludes } from '@std/assert';
import { placeholderSvg, THEMES } from './draw_placeholders.ts';

const BODY = '<path d="M1 1h2"/>';

test('placeholderSvg draws the icon on a 512px square in the theme colours', () => {
  for (const theme of ['light', 'dark'] as const) {
    const svg = placeholderSvg(BODY, theme);
    assertStringIncludes(svg, 'width="512" height="512"');
    assertStringIncludes(svg, `fill="${THEMES[theme].background}"`);
    assertStringIncludes(svg, `stroke="${THEMES[theme].ink}"`);
    assertStringIncludes(svg, BODY);
  }
});

test('placeholderSvg defaults to the light theme', () => {
  assertStringIncludes(placeholderSvg(BODY), `fill="${THEMES.light.background}"`);
});

test('the light and dark files differ only by the "-dark" suffix', () => {
  assert(THEMES.light.suffix === '' && THEMES.dark.suffix === '-dark');
});
