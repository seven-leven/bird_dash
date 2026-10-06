/// <reference lib="deno.ns" />
import { assert, assertEquals } from '@std/assert';
import { ICON_GROUPS, ICONS, isIconName } from './icons.ts';

Deno.test('every icon belongs to exactly one group', () => {
  const grouped = ICON_GROUPS.flatMap((g) => g.icons);
  assertEquals(new Set(grouped).size, grouped.length, 'an icon is listed in two groups');
  assertEquals(
    [...grouped].sort(),
    Object.keys(ICONS).sort(),
    'an icon is missing from the groups',
  );
});

Deno.test('the registry is written in the same order as the groups', () => {
  assertEquals(Object.keys(ICONS), ICON_GROUPS.flatMap((g) => g.icons));
});

Deno.test('every icon is stroke-only markup for the shared 24px wrapper', () => {
  for (const [name, def] of Object.entries(ICONS)) {
    assert(def.body.startsWith('<'), `${name}: body is not SVG markup`);
    assert(!/fill=|stroke=|<svg/.test(def.body), `${name}: colour and wrapper come from Icon.vue`);
  }
});

Deno.test('isIconName accepts registry names only', () => {
  assert(isIconName('bird'));
  assert(!isIconName('toString')); // inherited property, not an icon
  assert(!isIconName('nope'));
  assert(!isIconName(undefined));
});
