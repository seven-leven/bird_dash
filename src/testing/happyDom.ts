// happy-dom's own controls, which it puts on the window of a `_dom_test` or `_journey_test` file.

interface HappyDom {
  /** Resolves once every timer, fetch and event happy-dom has queued has run. */
  waitUntilComplete(): Promise<void>;
  /** Resize the window, as a phone or a narrow browser window would be. */
  setViewport(size: { width?: number; height?: number }): void;
}

export const happyDom = (): HappyDom => (globalThis as unknown as { happyDOM: HappyDom }).happyDOM;
