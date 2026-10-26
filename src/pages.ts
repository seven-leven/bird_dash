import { type Component, defineAsyncComponent } from 'vue';

/** A page beside the gallery: shown at `#<id>`, named `label` in the top bar and the menu. */
export interface PageEntry {
  id: string;
  label: string;
  component: Component;
}

/**
 * Every page that is not a collection, in the order the top bar lists them after the
 * collections. The route, the tabs, the menu and the main area all read this list, so a
 * new page is one entry here. An id must not be a collection's id (the data contract
 * test checks `public/collections.json` against it).
 */
export const PAGES = [
  // A page few open: it loads when it is shown.
  {
    id: 'about',
    label: 'About',
    component: defineAsyncComponent(() => import('./components/about/AboutPage.vue')),
  },
] as const satisfies readonly PageEntry[];

export type PageId = (typeof PAGES)[number]['id'];

/** The page shown at `#<id>`, or undefined when the id is not a page (a collection's). */
export const findPage = (id: string): PageEntry | undefined => PAGES.find((p) => p.id === id);
