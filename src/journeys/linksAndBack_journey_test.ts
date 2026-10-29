// J6 Links and back: a link to a collection, a drawing or a page opens it on load; the back
// button undoes what a click did; a link to something that is not there does no harm.
// Keeps: whereYouAre, links (docs/TESTING.md, "Promises").
import { test } from 'vitest';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderApp } from '../testing/renderApp.ts';
import { press } from '../testing/events.ts';

const dialog = () => document.querySelector<HTMLElement>('dialog');

/** Go back in history, as the browser's back button does. */
const back = () => history.back();

test('a link to a drawing opens the viewer on it, ready for the keyboard', async () => {
  using app = await renderApp({ at: 'birds/003' });
  await app.until(dialog, 'the viewer');
  assertEquals(dialog()!.getAttribute('aria-label'), 'Grey Heron, #003');
  await app.until(() => document.activeElement === dialog(), 'focus in the viewer');
  assertEquals(document.body.style.overflow, 'hidden'); // the page behind does not scroll
  press('ArrowLeft');
  await app.until(() => dialog()!.getAttribute('aria-label') === 'Mallard, #001', 'the previous');
});

test('a link to another collection opens it, and to an undrawn item rings its tile', async () => {
  using app = await renderApp({ at: 'sharks' });
  assertEquals(app.control('Sharks').getAttribute('aria-current'), 'page');

  location.hash = '#birds/002';
  await app.until(
    () => document.getElementById('item-002')?.classList.contains('ring-2'),
    'the ring',
  );
  assertEquals(dialog(), null);
});

test('back closes the viewer a click opened, and back again returns to the collection before', async () => {
  using app = await renderApp({ at: 'sharks' });
  app.control('Birds').click();
  await app.until(() => location.hash === '#birds', 'the birds');
  app.control('Mallard, #001').click();
  await app.until(() => location.hash === '#birds/001', 'the viewer in the address');

  back();
  await app.until(() => location.hash === '#birds', 'back to the collection');
  await app.until(() => !dialog(), 'the viewer to close');

  back();
  await app.until(() => location.hash === '#sharks', 'back to the sharks');
  await app.until(() => app.control('Sharks').getAttribute('aria-current') === 'page', 'Sharks');
});

test('a link to a page opens it, and the tabs say where you are', async () => {
  using app = await renderApp({ at: 'about' });
  const tabs = app.host.querySelector('nav[aria-label="Collections"]')!;
  assertEquals(app.control('About', tabs).getAttribute('aria-current'), 'page');
  assertEquals(app.control('Birds').getAttribute('aria-current'), null);
  assertEquals(app.all('[aria-label="View"]').length, 0); // no views outside the gallery

  app.control('Birds').click();
  await app.until(() => location.hash === '#birds', 'the gallery again');
  assertStringIncludes(app.text(), 'Mallard');
});

test('a link to something that is not there leaves the gallery as it is', async () => {
  for (const at of ['birds/999', 'nowhere', 'nowhere/001']) {
    using app = await renderApp({ at });
    assertEquals(dialog(), null, at);
    assertStringIncludes(app.text(), 'Mallard', at);
  }
});

test('a link to an item not drawn yet shows its tile, even where nothing is drawn', async () => {
  using _app = await renderApp({ at: 'sharks/001' });
  await _app.until(
    () => document.getElementById('item-001')?.classList.contains('ring-2'),
    'the shark, ringed',
  );
});
