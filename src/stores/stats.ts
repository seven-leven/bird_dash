import { useStatsLoader } from '../data/useStatsLoader.ts';
import { defineInjection } from '../browser/defineInjection.ts';

/** The archive's numbers (stats.json), for any page that shows them. */
export const createStatsStore = useStatsLoader;

export type StatsStore = ReturnType<typeof createStatsStore>;
export const [provideStats, useStatsStore] = defineInjection<StatsStore>('stats');
