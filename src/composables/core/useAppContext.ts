import { type ComputedRef, inject, type InjectionKey, provide, type Ref } from 'vue';
import type {
  ActiveData,
  CollectionConfig,
  CollectionItem,
  DataState,
  ExpandedImageState,
  GlobalSearchCollectionGroup,
  GlobalSearchState,
  GlobalStats,
  SearchState,
  ThemeState,
  UIState,
} from '../../types/index.ts';

/**
 * App-wide state and actions, assembled once in App.vue and injected by the
 * chrome components (TopBar, SideNav, GalleryContent, GlobalSearch, …).
 * Leaf components that are meant to be reusable (ItemTile, IdBadge,
 * EmptyState, the Search* sub-components) stay props-based.
 */
export interface AppContext {
  // Collections & data
  collections: Ref<CollectionConfig[]>;
  activeCollection: ComputedRef<CollectionConfig | undefined>;
  globalStats: ComputedRef<GlobalStats>;
  data: DataState;
  activeData: ComputedRef<ActiveData<CollectionItem>>;

  // UI state
  ui: UIState;
  theme: ThemeState;
  activeSection: Ref<string>;
  search: SearchState;

  // Global search
  globalSearch: Ref<GlobalSearchState>;
  globalResults: ComputedRef<GlobalSearchCollectionGroup[]>;
  globalResultCount: ComputedRef<number>;

  // Lightbox overlay
  expandedImage: ExpandedImageState<CollectionItem>;
  drawnItems: ComputedRef<CollectionItem[]>;

  // Actions
  switchCollection: (id: string) => Promise<void>;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleTheme: () => void;
  toggleViewMode: () => void;
  goToSection: (id: string) => void;
  openItem: (item: CollectionItem) => void;
  closeOverlay: () => void;
  updateOverlayItem: (item: CollectionItem) => void;
  updateSearch: (query: string) => void;
  updateGlobalSearch: (query: string) => void;
  openGlobalSearchDropdown: () => void;
  closeGlobalSearchDropdown: () => void;
  selectGlobalResult: (collectionId: string, itemId: string) => Promise<void>;
}

const APP_CONTEXT_KEY: InjectionKey<AppContext> = Symbol('app-context');

export function provideAppContext(ctx: AppContext): void {
  provide(APP_CONTEXT_KEY, ctx);
}

export function useAppContext(): AppContext {
  const ctx = inject(APP_CONTEXT_KEY);
  if (!ctx) {
    throw new Error('useAppContext() called outside a provideAppContext() tree');
  }
  return ctx;
}
