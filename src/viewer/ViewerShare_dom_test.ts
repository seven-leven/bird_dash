// Keeps: sharedLink (docs/TESTING.md, "Promises").
import { afterEach, test } from 'vitest';
import { assertEquals } from '@std/assert';
import { h } from 'vue';
import ViewerShare from './ViewerShare.vue';
import { settle } from '../testing/settle.ts';
import { mountComponent } from '../testing/mount.ts';

/** A clipboard that keeps what is copied, or refuses. */
function fakeClipboard(refuses = false) {
  const copied: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) =>
        refuses ? Promise.reject(new Error('denied')) : (copied.push(text), Promise.resolve()),
    },
  });
  return copied;
}

/** A phone's share sheet, which keeps what it was handed. */
function fakeShareSheet() {
  const shared: ShareData[] = [];
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: (data: ShareData) => (shared.push(data), Promise.resolve()),
  });
  return shared;
}
afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
});

function mount() {
  const host = mountComponent(() =>
    h(ViewerShare, { collectionId: 'birds', itemId: '002', title: 'Cotton Pygmy-Goose' })
  );
  const button = host.querySelector('button')!;
  return {
    button,
    label: () => button.textContent!.trim(),
    note: () => host.querySelector('[role="status"]')!.textContent,
  };
}

/** The drawing's link preview, beside the page the tests run on. */
const preview = () => new URL('birds/002/', location.href.split('#')[0]).href;

test("without a share sheet it copies the drawing's link preview, and says so", async () => {
  const copied = fakeClipboard();
  const { button, label, note } = mount();
  assertEquals([label(), note()], ['Share', '']);
  button.click();
  await settle();
  assertEquals(copied, [preview()]);
  // A short word on the button keeps it on the links' line; a screen reader hears it whole.
  assertEquals([label(), note()], ['Copied', 'Link copied']);
});

test('when the clipboard refuses, the button says it could not copy', async () => {
  fakeClipboard(true);
  const { button, label, note } = mount();
  button.click();
  await settle();
  assertEquals([label(), note()], ["Couldn't copy", "Couldn't copy the link"]);
});

test('on a phone the share sheet takes the title and the link, and the button stays as it was', async () => {
  const copied = fakeClipboard();
  const shared = fakeShareSheet();
  const { button, label, note } = mount();
  button.click();
  await settle();
  assertEquals(shared, [{ title: 'Cotton Pygmy-Goose', url: preview() }]);
  assertEquals(copied, []);
  assertEquals([label(), note()], ['Share', '']);
});
