// Single source for the app's line icons, grouped by purpose (see ICON_GROUPS at
// the end of the file). Each entry is the inner SVG markup for
// a shared 24×24 stroke wrapper (see Icon.vue). strokeWidth defaults to 2.

export interface IconDef {
  /** Inner SVG markup, rendered inside the shared <svg> wrapper. */
  body: string;
  /** Override the default stroke-width of 2. */
  strokeWidth?: number;
  /** A solid shape instead of a stroke. Only for third-party brand marks. */
  filled?: boolean;
}

export const ICONS = {
  // ── Collections — named by `icon` in public/collections.json ──
  // The logo's bird (logo.ts), redrawn at the 24px grid so the tab, the
  // placeholders and the logo show the same animal.
  bird: {
    body:
      '<path d="M22.63 4.74 19.02 3.54A3.35 3.35 0 0 0 12.83 5.94C9.99 8.44 5.77 12.48 1.3 17.04L6.89 16.69C11.28 17.9 17.3 16.44 19.19 10.76 19.79 8.95 19.79 7.58 19.45 6.2Z"/><path d="M15.75 9.04c-.69 3.27-3.61 5.5-8.6 6.02"/><path d="m11.97 17.21-.52 3.35"/><path d="m14.89 16.78.34 3.78"/><path d="M16.95 5.17h.01"/>',
  },
  shark: {
    body:
      '<path d="M22.5 12.5c-2.5-2.3-5.5-3.5-9-3.700L10 3.5l-.5 5.700c-1.7.3-3.2 1-4.5 2L1.5 6 3 12.5 2 17.5l3-3.500c1.7 1.3 3.7 2.1 6 2.400L10 20l4.5-3.500c3.2-.4 5.8-1.6 8-4Z"/><path d="M18.5 12h.01"/>',
  },
  shell: {
    body:
      '<path d="M14 11a2 2 0 1 1-4 0 4 4 0 0 1 8 0 6 6 0 0 1-12 0 8 8 0 0 1 16 0 10 10 0 1 1-20 0 11.93 11.93 0 0 1 2.42-7.22 2 2 0 1 1 3.160 2.44"/>',
  },

  // ── Views — the group / date switch ──
  taxonomy: {
    body:
      '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  },
  calendar: {
    body:
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  },

  // ── Search ──
  search: {
    body: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  },
  noResults: {
    body:
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8.5" y1="8.5" x2="13.5" y2="13.5"/><line x1="13.5" y1="8.5" x2="8.5" y2="13.5"/>',
  },

  // ── Navigation ──
  menu: {
    body:
      '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  },
  chevronLeft: { body: '<polyline points="15,18 9,12 15,6"/>' },
  chevronRight: { body: '<polyline points="9,18 15,12 9,6"/>' },
  close: {
    body: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  },
  externalLink: {
    body:
      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  },

  // ── Viewer — lightbox zoom controls ──
  zoomIn: {
    body:
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>',
  },
  zoomOut: {
    body:
      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>',
  },
  reset: {
    body:
      '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  },

  // ── Theme ──
  sun: {
    body:
      '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  },
  moon: { body: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' },

  // ── Labels — a small icon before a label or a figure ──
  tag: {
    body:
      '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><path d="M7.5 7.5h.01"/>',
  },
  image: {
    body:
      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  },
  commit: {
    body:
      '<circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>',
  },
  layers: {
    body:
      '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  },
  pencil: {
    body:
      '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  },
  languages: {
    body:
      '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  },
  book: {
    body:
      '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  },

  // ── Keyboard — key hints under the search results ──
  arrowsUpDown: {
    body:
      '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  },
  enter: {
    body: '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
  },

  command: {
    body: '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
  },

  // ── Brand — third-party marks, shown exactly as their owners publish them ──
  // The one exception to "stroke only, no fills": a brand's logo is not ours to
  // redraw. The path is GitHub's own mark (16px grid, scaled to the 24px wrapper).
  github: {
    filled: true,
    body:
      '<path transform="scale(1.5)" d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>',
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/** Narrow a string from data (e.g. collections.json) to a known icon name. */
export const isIconName = (name: string | undefined): name is IconName =>
  name !== undefined && Object.hasOwn(ICONS, name);

/**
 * The icons in the order they are documented (docs/icons.png, the design guide):
 * grouped by what they are for. Every icon belongs to exactly one group — a
 * test checks that, so a new icon cannot be left out of the sheet.
 */
export const ICON_GROUPS: { label: string; icons: IconName[] }[] = [
  { label: 'Collections', icons: ['bird', 'shark', 'shell'] },
  { label: 'Views', icons: ['taxonomy', 'calendar'] },
  { label: 'Search', icons: ['search', 'noResults'] },
  { label: 'Navigation', icons: ['menu', 'chevronLeft', 'chevronRight', 'close', 'externalLink'] },
  { label: 'Viewer', icons: ['zoomIn', 'zoomOut', 'reset'] },
  { label: 'Theme', icons: ['sun', 'moon'] },
  { label: 'Labels', icons: ['tag', 'image', 'commit', 'layers', 'pencil', 'languages', 'book'] },
  { label: 'Keyboard', icons: ['arrowsUpDown', 'enter', 'command'] },
  { label: 'Brand', icons: ['github'] },
];
