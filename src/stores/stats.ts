import { useStats } from '../composables/collection/useStats.ts';
import { defineInjection } from '../composables/core/injection.ts';

/** The archive's numbers (stats.json), for any page that shows them. */
export const createStatsStore = useStats;

export type StatsStore = ReturnType<typeof createStatsStore>;
export const [provideStats, useStatsStore] = defineInjection<StatsStore>('stats');
