import { GlobalRegistrator } from '@happy-dom/global-registrator';

/**
 * Run `fn` with a browser-like global environment (document, location,
 * localStorage, focus, events, …) and tear it down afterwards.
 *
 * Deno runs each test file in its own isolate, so the globals never leak into
 * other files — but within a file every test should go through this helper so
 * the fake DOM is always cleaned up.
 */
export async function withDom<T>(
  fn: () => T | Promise<T>,
  options: { url?: string } = {},
): Promise<T> {
  GlobalRegistrator.register({ url: options.url ?? 'http://localhost/', width: 1024, height: 768 });
  try {
    return await fn();
  } finally {
    await GlobalRegistrator.unregister();
  }
}
