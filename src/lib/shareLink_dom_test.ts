import { afterEach, test } from 'vitest';
import { assertEquals } from '@std/assert';
import { previewUrl, shareLink } from './shareLink.ts';

const URL_ = 'https://example.org/bird_dash/birds/001/';

/** Give the browser a share sheet and a clipboard that behave as told; returns what they got. */
function fakeDevice(
  options: { share?: (data: ShareData) => Promise<void>; copy?: 'ok' | 'denied' },
) {
  const shared: ShareData[] = [];
  const copied: string[] = [];
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: options.share && ((data: ShareData) => (shared.push(data), options.share!(data))),
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) =>
        options.copy === 'denied'
          ? Promise.reject(new DOMException('denied', 'NotAllowedError'))
          : (copied.push(text), Promise.resolve()),
    },
  });
  return { shared, copied };
}

afterEach(() => {
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
});

test("a drawing's preview sits beside the gallery page, whatever the gallery shows", () => {
  const page = 'https://example.org/bird_dash/#birds/001';
  assertEquals(previewUrl(page, 'birds', '001'), URL_);
  assertEquals(
    previewUrl('https://example.org/bird_dash/index.html', 'shells', '029'),
    'https://example.org/bird_dash/shells/029/',
  );
});

test('where the device has a share sheet, the link goes to it', async () => {
  const device = fakeDevice({ share: () => Promise.resolve() });
  assertEquals(await shareLink(URL_, 'Lesser Whistling-Duck'), 'sheet');
  assertEquals(device.shared, [{ title: 'Lesser Whistling-Duck', url: URL_ }]);
  assertEquals(device.copied, []);
});

test('closing the share sheet is not a failure, and copies nothing', async () => {
  const device = fakeDevice({
    share: () => Promise.reject(new DOMException('closed', 'AbortError')),
  });
  assertEquals(await shareLink(URL_, 'x'), 'sheet');
  assertEquals(device.copied, []);
});

test('a share sheet that fails, or none at all, copies the link instead', async () => {
  const failing = fakeDevice({
    share: () => Promise.reject(new DOMException('no', 'NotAllowedError')),
  });
  assertEquals(await shareLink(URL_, 'x'), 'copied');
  assertEquals(failing.copied, [URL_]);
  const desktop = fakeDevice({});
  assertEquals(await shareLink(URL_, 'x'), 'copied');
  assertEquals(desktop.copied, [URL_]);
});

test('when the clipboard is refused too, the share failed', async () => {
  fakeDevice({ copy: 'denied' });
  assertEquals(await shareLink(URL_, 'x'), 'failed');
});
