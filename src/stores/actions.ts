import { defineInjection } from '../composables/core/injection.ts';

/**
 * The few genuinely cross-store orchestrations, assembled in App.vue.
 * Everything single-domain lives on its own store; this holds only the
 * actions that must touch more than one.
 */
export interface AppActions {
  /** Switch collection, clearing the search and resetting the scroll/spy. */
  switchCollection: (id: string) => Promise<void>;
  /** From a global-search result: switch collection if needed, then flash the tile. */
  selectGlobalResult: (collectionId: string, itemId: string) => Promise<void>;
}

export const [provideActions, useActions] = defineInjection<AppActions>('actions');
