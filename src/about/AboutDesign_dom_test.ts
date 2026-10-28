import { test } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { h } from 'vue';
import AboutDesign from './AboutDesign.vue';
import { mountComponent } from '../testing/mount.ts';

test("the manifesto's first line, then a link to the rest in this tab (the docs are served beside the gallery)", () => {
  const host = mountComponent(() => h(AboutDesign));
  assertStringIncludes(
    host.querySelector('blockquote')!.textContent!,
    'The drawings carry the colour.',
  );
  const link = host.querySelector('a')!;
  assertEquals([link.getAttribute('href'), link.target], ['docs/DESIGN.html', '']);
  assertEquals(host.querySelector('section')!.getAttribute('aria-label'), 'Design');
});
