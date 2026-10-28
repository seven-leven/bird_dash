// The whole app, for journeys (docs/TESTING.md, the journey tier): the real App.vue with its
// stores, router and every component, in happy-dom, with `fetch` answered from the fixture
// archive. A test names only the routes it changes, and the address it starts at.
//
//   using app = await renderApp();                               the first collection, loaded
//   using app = await renderApp({ at: 'birds/003' });            a deep link
//   using app = await renderApp({ routes: { '/collections.json': status(500) } });
//   using app = await renderApp({ width: 375 });                 on a phone
//
// Leaving the `using` block unmounts the app and puts `fetch` back.
import { h } from 'vue';
import App from '../app/App.vue';
import { mountInDocument } from './mount.ts';
import { type FakeFetch, fakeFetch, type Route } from './fakes/fakeFetch.ts';
import { archiveRoutes } from './scenarios/archive.ts';
import { settleUntil } from './settle.ts';
import { happyDom } from './happyDom.ts';

export interface RenderedApp extends Disposable {
  /** The element the app is mounted in. */
  host: HTMLElement;
  /** The fake network: `fetch.calls` lists every URL asked. */
  fetch: FakeFetch;
  /** Wait until `check` holds, letting promises, Vue and timers run; fails after 2s, saying `what`. */
  until(check: () => unknown, what: string): Promise<void>;
  /** The visible text of `el` (the app by default), with runs of white space as one space. */
  text(el?: Element): string;
  /** The one control (button, link, tile, option) named `name` (its label, or its text). */
  control(name: string | RegExp, within?: Element | undefined): HTMLElement;
  /** Every element matching `selector`. */
  all<E extends Element = HTMLElement>(selector: string): E[];
}

const CONTROLS = 'button, a, [role="button"], [role="option"]';

/** Mount App.vue at `#at` on the fixture archive (plus `routes`), and wait for it to load. */
export async function renderApp(
  { at = '', routes = {}, width }: {
    at?: string;
    routes?: Record<string, Route>;
    /** The window's width in px, for a phone (domSetup.ts puts it back after the test). */
    width?: number;
  } = {},
): Promise<RenderedApp> {
  const fetch = fakeFetch({ ...archiveRoutes(), ...routes });
  if (width) happyDom().setViewport({ width });
  if (at) history.replaceState(null, '', `#${at}`);
  const { host, unmount } = mountInDocument(() => h(App));

  const text = (el: Element = host) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const nameOf = (el: Element) => el.getAttribute('aria-label') ?? text(el);
  const all = <E extends Element = HTMLElement>(selector: string) => [
    ...host.ownerDocument.querySelectorAll<E>(selector),
  ];

  const app: RenderedApp = {
    host,
    fetch,
    until: settleUntil,
    text,
    control(name, within) {
      const found = [...(within ?? host.ownerDocument).querySelectorAll<HTMLElement>(CONTROLS)]
        .filter((el) => typeof name === 'string' ? nameOf(el) === name : name.test(nameOf(el)));
      if (found.length !== 1) {
        throw new Error(`expected one control named ${name}, found ${found.length}`);
      }
      return found[0]!; // exactly one, checked above
    },
    all,
    [Symbol.dispose]: () => {
      unmount();
      fetch[Symbol.dispose]();
    },
  };
  await app.until(() => !host.querySelector('[aria-busy="true"]'), 'the app to load');
  return app;
}
