// Runs before every `_dom_test` file (vite.config.ts, the `dom` project): the tier gives the file
// its browser, happy-dom, and this puts the browser back as it started before each test, so no
// test sees what the one before it left behind (docs/TESTING.md, rule 5).
import { beforeEach } from 'vitest';

const start = {
  url: location.href,
  matchMedia: globalThis.matchMedia,
  // A test may block storage by redefining it (private mode, say); the next one gets it back.
  storage: ['localStorage', 'sessionStorage'].map((name) => ({
    name,
    descriptor: Object.getOwnPropertyDescriptor(globalThis, name)!,
  })),
};

beforeEach(async () => {
  // The address goes back to where it started as a visitor would take it there, and the
  // hashchange that sets off (and any the last test left on its way) lands before this test
  // listens. Rewriting the address with history.replaceState alone leaves happy-dom's idea of
  // the old one behind, and the next hash change is reported twice.
  if (location.hash) location.hash = '';
  const { happyDOM } = globalThis as unknown as {
    happyDOM: { waitUntilComplete(): Promise<void> };
  };
  await happyDOM.waitUntilComplete();
  history.replaceState(null, '', start.url); // drops the bare `#` left behind
  for (const { name, descriptor } of start.storage) {
    Object.defineProperty(globalThis, name, descriptor);
  }
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  for (const { name } of [...document.documentElement.attributes]) {
    if (name !== 'lang') document.documentElement.removeAttribute(name);
  }
  localStorage.clear();
  sessionStorage.clear();
  globalThis.matchMedia = start.matchMedia;
});
