import { ref, shallowRef } from 'vue';
import { fetchJson, getBase } from '../../lib/fetchJson.ts';
import type { Stats } from '../../types/index.ts';

/**
 * The archive's numbers (`public/stats.json`, worked out by the asset build), loaded
 * the first time a page asks and kept: the About page shows them from here, and never
 * fetches. While loading, both `stats` and `error` are empty.
 */
export function useStats(url = `${getBase()}stats.json`) {
  const stats = shallowRef<Stats | null>(null);
  const error = ref('');
  let loading = false;

  /** Load the numbers, unless they are loaded or loading; after an error, load again. */
  const load = async (): Promise<void> => {
    if (stats.value || loading) return;
    loading = true;
    error.value = '';
    try {
      stats.value = await fetchJson<Stats>(url, 'stats.json');
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  };

  return { stats, error, load };
}
