import { nextTick } from 'vue';

/**
 * The one way a test waits (docs/TESTING.md, rule 7): every promise already settled has run
 * its callbacks, and Vue has drawn what they changed.
 */
export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}
