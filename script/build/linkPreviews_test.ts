import { test } from 'vitest';
import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { fakeIo } from '../lib/fakeIo.ts';
import { previewDescription, previewPage, previewPages } from './linkPreviews.ts';
import { makeScriptCollection } from '../../src/testing/scriptFixtures.ts';

const birds = makeScriptCollection('birds', { paths: { json: './lists/birds.json' } });
const duck = {
  id: '001',
  name: 'Lesser Whistling-Duck',
  sci: 'Dendrocygna javanica',
  dhiv: 'Reyru',
  drawn: '2024-10-10',
};
const SITE = 'https://example.org/site/';

test('the description says what the drawing is, when it was drawn and where it sits', () => {
  assertEquals(
    previewDescription(birds, duck),
    'Lesser Whistling-Duck (Dendrocygna javanica), Reyru in Dhivehi. Drawn 10 October 2024; Birds, no. 001.',
  );
  assertEquals(
    previewDescription(birds, { id: '002', name: 'Sand Dollar', drawn: '2026-03-09' }),
    'Sand Dollar. Drawn 9 March 2026; Birds, no. 002.',
  );
});

test("a preview carries the drawing's own title and image, and sends the visitor on to it", () => {
  const { fileName, html } = previewPage(birds, duck, SITE);
  assertEquals(fileName, 'birds/001/index.html');
  assertStringIncludes(html, '<title>Lesser Whistling-Duck · Wildlife Illustrated</title>');
  assertStringIncludes(
    html,
    '<meta property="og:image" content="https://example.org/site/full/birds/001.webp" />',
  );
  assertStringIncludes(
    html,
    '<meta property="og:url" content="https://example.org/site/birds/001/" />',
  );
  assertStringIncludes(html, '<meta http-equiv="refresh" content="0; url=../../#birds/001" />');
  assertStringIncludes(html, '<a href="../../#birds/001">Lesser Whistling-Duck</a>');
  // No script runs on it at all.
  assertStringIncludes(html, `content="default-src 'none'"`);
});

test("a name is escaped, so it cannot break out of the page's markup", () => {
  const { html } = previewPage(birds, { ...duck, name: 'A "quoted" <b> & co' }, SITE);
  assertStringIncludes(
    html,
    '<meta property="og:title" content="A &quot;quoted&quot; &lt;b&gt; &amp; co" />',
  );
});

test('only drawn items get a preview, in list order', async () => {
  const list = {
    Ducks: [duck, { id: '002', name: 'Garganey' }, { ...duck, id: '003', drawn: '2025-01-01' }],
  };
  const io = fakeIo({ files: { './lists/birds.json': JSON.stringify(list) } });
  const pages = await previewPages([birds], io);
  assertEquals(pages.map((page) => page.fileName), [
    'birds/001/index.html',
    'birds/003/index.html',
  ]);
});

test("a collection named like one of the site's folders is refused", async () => {
  const docs = { ...birds, id: 'docs' };
  await assertRejects(
    () => previewPages([docs], fakeIo()),
    Error,
    'a folder the site already has: docs',
  );
});
