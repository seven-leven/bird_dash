// Self-contained cast (not import.meta.env directly), so this file also loads where Vite has
// not defined import.meta.env; the base is then '/'. Vite and Vitest always define it, so the
// fallback never runs in a test.
/* c8 ignore next 2 */
export const getBase = (): string =>
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

/**
 * Fetch a JSON file and parse it. A failure throws an Error whose message a page can
 * show as it is: `HTTP 404 loading <what>`, or `<what> is not valid JSON` (an HTML
 * fallback page where the file should be, say).
 */
export async function fetchJson<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${what}`);
  return await res.json().catch(() => {
    throw new Error(`${what} is not valid JSON`);
  }) as T;
}
