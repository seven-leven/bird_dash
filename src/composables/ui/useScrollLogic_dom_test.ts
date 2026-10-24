import { test } from 'vitest';
import { assert, assertEquals } from '@std/assert';
import { ref } from 'vue';
import { useScrollLogic } from './useScrollLogic.ts';
import { runInScope } from '../../testing/fixtures.ts';
import { withDom } from '../../testing/withDom.ts';

// The scroll-spy reads positions from the layout, which a fake DOM does not
// have. So each element is given the position the test wants it to report.

/** An element that reports `top` as its position on screen. */
function at(top: number, extra: Partial<HTMLElement> = {}): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ top }) as DOMRect;
  return Object.assign(el, extra);
}

/** Stand-in for IntersectionObserver that records what it was asked to do. */
function fakeObserver() {
  const log = {
    created: 0,
    observed: [] as Element[],
    disconnected: 0,
    options: {} as IntersectionObserverInit,
  };
  const callbacks: Array<() => void> = [];
  globalThis.IntersectionObserver = class {
    constructor(cb: () => void, options: IntersectionObserverInit) {
      log.created++;
      log.options = options;
      callbacks.push(cb);
    }
    observe(el: Element) {
      log.observed.push(el);
    }
    disconnect() {
      log.disconnected++;
    }
  } as unknown as typeof IntersectionObserver;
  return { log, fire: () => callbacks[callbacks.length - 1]() };
}

/** A scroll-spy over a container at the top of the screen and the given headers. */
function setup(headers: Record<string, number>, mobile = false) {
  const observer = fakeObserver();
  const scrolls: ScrollToOptions[] = [];
  const container = at(0, {
    scrollTo: ((o: ScrollToOptions) => scrolls.push(o)) as HTMLElement['scrollTo'],
  });
  Object.defineProperty(container, 'clientHeight', { value: 800 });
  const tops = { ...headers };
  const els: Record<string, HTMLElement> = {};
  for (const name of Object.keys(tops)) {
    els[name] = document.createElement('div');
    els[name].getBoundingClientRect = () => ({ top: tops[name] }) as DOMRect;
  }
  let closed = 0;
  const { value: spy, stop } = runInScope(() =>
    useScrollLogic(ref(container), ref(els), {
      isMobile: ref(mobile),
      closeSidebar: () => closed++,
    })
  );
  return { spy, stop, observer, container, tops, els, scrolls, closed: () => closed };
}

test('the active section is the last header that has passed the line near the top', () =>
  withDom(() => {
    // The line is 100px below the top of the container.
    const t = setup({ Ducks: -400, Herons: 40, Terns: 600 });
    t.spy.updateActiveSection();
    assertEquals(t.spy.activeSection.value, 'Herons');

    t.tops.Terns = 90; // scrolled further: Terns crosses the line
    t.observer.fire();
    assertEquals(t.spy.activeSection.value, 'Terns');
    t.stop();
  }));

test('with every header still below the line, the first section is the current one', () =>
  withDom(() => {
    const t = setup({ Ducks: 300, Herons: 700 });
    t.spy.updateActiveSection();
    assertEquals(t.spy.activeSection.value, 'Ducks', 'nothing has reached the top yet');
    t.stop();
  }));

test('a remembered section that is still in the view is kept while none has reached the line', () =>
  withDom(() => {
    const t = setup({ Ducks: 0, Herons: 500 });
    t.spy.updateActiveSection(); // starts watching
    t.spy.goToSection('Herons');
    t.tops.Ducks = 300; // scrolled back up: nothing at the line now
    t.tops.Herons = 700;
    t.observer.fire();
    assertEquals(t.spy.activeSection.value, 'Herons');
    t.stop();
  }));

test('a section from the other view is replaced, not shown (the stale-label bug)', () =>
  withDom(() => {
    const t = setup({ Ducks: 0, Herons: 500 });
    t.spy.goToSection('Herons');
    // the view changes: the headers are now months, none at the line yet
    for (const name of Object.keys(t.els)) delete t.els[name];
    t.els['March 2025'] = at(300);
    t.els['January 2025'] = at(700);
    t.spy.updateActiveSection();
    assertEquals(t.spy.activeSection.value, 'March 2025');
    t.stop();
  }));

test('updating watches every header and a band at the top of the container', () =>
  withDom(() => {
    const t = setup({ Ducks: 0, Herons: 500 });
    t.spy.updateActiveSection();
    assertEquals(t.observer.log.observed.length, 2);
    assertEquals(t.observer.log.options.root, t.container);
    assertEquals(t.observer.log.options.rootMargin, '0px 0px -700px 0px'); // 800 tall, 100 band

    // Updating again (a new collection, a new view) starts over cleanly.
    t.spy.updateActiveSection();
    assertEquals([t.observer.log.created, t.observer.log.disconnected], [2, 1]);
    t.stop();
  }));

test('fast scrolling is caught by the scroll listener, at most once per 100ms', () =>
  withDom(() => {
    const t = setup({ Ducks: -50, Herons: 900 });
    let now = 1000;
    const realNow = performance.now;
    performance.now = () => now;
    try {
      t.spy.updateActiveSection();
      assertEquals(t.spy.activeSection.value, 'Ducks');

      t.tops.Herons = 20;
      t.container.dispatchEvent(new Event('scroll')); // first scroll event: handled
      assertEquals(t.spy.activeSection.value, 'Herons');

      t.tops.Ducks = 60;
      t.tops.Herons = 900;
      now += 50; // too soon after the last one: skipped
      t.container.dispatchEvent(new Event('scroll'));
      assertEquals(t.spy.activeSection.value, 'Herons');

      now += 100;
      t.container.dispatchEvent(new Event('scroll'));
      assertEquals(t.spy.activeSection.value, 'Ducks');
    } finally {
      performance.now = realNow;
    }
    t.stop();
  }));

test('jumping to a section scrolls to it and marks it active at once', () =>
  withDom(() => {
    const t = setup({ Ducks: 0, Herons: 500 });
    Object.defineProperty(t.els.Herons, 'offsetTop', { value: 1280 });
    t.spy.goToSection('Herons');
    assertEquals(t.scrolls, [{ top: 1280, behavior: 'smooth' }]); // container at offset 0
    assertEquals(t.spy.activeSection.value, 'Herons');
    assertEquals(t.closed(), 0, 'on a wide screen the sidebar stays open');
    t.stop();
  }));

test('on a phone, jumping to a section also closes the sidebar', () =>
  withDom(() => {
    const t = setup({ Ducks: 0 }, true);
    t.spy.goToSection('Ducks');
    assertEquals(t.closed(), 1);
    t.stop();
  }));

test('jumping to a section that is not on the page does nothing', () =>
  withDom(() => {
    const t = setup({ Ducks: 0 });
    t.spy.goToSection('Nope');
    assertEquals(t.scrolls, []);
    assertEquals(t.spy.activeSection.value, '');
    assertEquals(t.closed(), 0);
    t.stop();
  }));

test('before the scroll container exists, updating is a safe no-op', () =>
  withDom(() => {
    const observer = fakeObserver();
    const { value: spy, stop } = runInScope(() =>
      useScrollLogic(ref(null), ref({}), { isMobile: ref(false), closeSidebar: () => {} })
    );
    spy.updateActiveSection();
    assertEquals(observer.log.created, 0);
    stop();
  }));

test('stopping the spy disconnects the observer and the scroll listener', () =>
  withDom(() => {
    const t = setup({ Ducks: -10, Herons: 900 });
    t.spy.updateActiveSection();
    t.stop();
    assert(t.observer.log.disconnected >= 1);

    t.tops.Herons = 10;
    t.container.dispatchEvent(new Event('scroll'));
    assertEquals(t.spy.activeSection.value, 'Ducks', 'still reacting to scroll after stop');
  }));

test('headers that have gone (null refs) and a container that has gone are skipped', () =>
  withDom(() => {
    const observer = fakeObserver();
    const container = at(0);
    Object.defineProperty(container, 'clientHeight', { value: 800 });
    const scroller = ref<HTMLElement | null>(container);
    const headers = ref<Record<string, HTMLElement | null>>({ Gone: null, Herons: at(40) });
    const { value: spy, stop } = runInScope(() =>
      useScrollLogic(scroller, headers as never, { isMobile: ref(false), closeSidebar: () => {} })
    );
    spy.updateActiveSection();
    assertEquals(observer.log.observed.length, 1); // the null header is not observed
    assertEquals(spy.activeSection.value, 'Herons');

    scroller.value = null; // unmounted
    observer.fire(); // a late observer callback must not throw
    assertEquals(spy.activeSection.value, 'Herons');
    stop();
  }));
