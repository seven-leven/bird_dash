import { nextTick } from 'vue';

/**
 * The one way a test waits (docs/TESTING.md, rule 7): every promise already settled has run
 * its callbacks, and Vue has drawn what they changed.
 */
export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}

/**
 * Settle until `check` holds, for what takes real time (code split into its own chunk, a
 * timer); fails after 2s, saying `what`. Never a fixed count of settles: a slower machine
 * would need more.
 */
export async function settleUntil(check: () => unknown, what: string): Promise<void> {
  for (const start = Date.now(); Date.now() - start < 2000;) {
    await settle();
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`gave up waiting for ${what}`);
}
