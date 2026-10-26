// Where things are in the repository, relative to its root (npm runs every command
// there). The one place a path is written out (docs/SCRIPTS.md, principle 5).

/** A placeholder's theme: the light file is `<id>.webp`, the dark one `<id>-dark.webp`. */
export type Theme = 'light' | 'dark';

export const PATHS = {
  /** The collections, in order: `public/collections.json`. */
  collections: './public/collections.json',
  /** The archive's numbers, written by the asset build. */
  stats: './public/stats.json',
  /** The stored part of the version, `major.minor`. */
  baseVersion: './script/version/base_version.json',
  changelog: './CHANGELOG.md',
  /** The site's CSS, and the parts the docs site shares. */
  mainCss: './src/styles/main.css',
  accentsCss: './src/styles/accents.css',
  faruma: './src/styles/fonts/Faruma.woff',
  favicon: './public/favicon.svg',
  placeholders: './public/placeholders',
  /** The docs' generated images. */
  docsAssets: './docs/assets',

  /** A collection's list file. */
  list: (collectionId: string): string => `./public/lists/${collectionId}.json`,
  /** The illustrator's PNGs for a collection; on your machine only, never in git. */
  sourceArt: (collectionId: string): string => `./raw_png/${collectionId}/`,
  /** The viewer's WebPs and the tiles' WebPs. */
  full: (collectionId: string): string => `./public/full/${collectionId}/`,
  thumb: (collectionId: string): string => `./public/thumb/${collectionId}/`,
  placeholder: (collectionId: string, theme: Theme): string =>
    `./public/placeholders/${collectionId}${theme === 'dark' ? '-dark' : ''}.webp`,
} as const;
