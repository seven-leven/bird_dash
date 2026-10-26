// The docs site: docs/*.md as pages, in the site's own design, served beside the gallery
// at /bird_dash/docs/ (built into dist/docs after the site; see WORKFLOW.md). The
// Markdown stays the source of truth, written for GitHub first.
import { defineConfig } from 'vitepress';
import tailwindcss from '@tailwindcss/vite';
import { githubLinks, githubSlug, REPO_URL } from '../../script/docs/links.ts';
import { liveBlocks } from '../../script/docs/live_blocks.ts';

export default defineConfig({
  title: 'Wildlife Illustrated',
  titleTemplate: ':title · Wildlife Illustrated docs',
  description: 'How the Wildlife Illustrated archive is designed, built and tested.',
  lang: 'en',
  base: '/bird_dash/docs/',
  outDir: '../dist/docs',
  cacheDir: '../node_modules/.vitepress-cache',
  // The index is docs/README.md, so GitHub shows it on the folder too.
  rewrites: { 'README.md': 'index.md' },
  // A link to a page that does not exist fails the build (the default; said here on purpose).
  ignoreDeadLinks: false,
  lastUpdated: false,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/bird_dash/favicon.svg' }]],

  markdown: {
    anchor: { slugify: githubSlug },
    config: (md) => {
      md.use(githubLinks);
    },
  },

  vite: {
    plugins: [
      // For Tailwind's colour variables in the theme's CSS (theme/style.css), not its utilities.
      tailwindcss(),
      {
        name: 'live-blocks',
        enforce: 'pre',
        transform: (code, id) => (id.endsWith('.md') ? liveBlocks(code) : undefined),
      },
    ],
  },

  themeConfig: {
    siteTitle: 'Wildlife Illustrated',
    nav: [
      { text: 'The gallery', link: 'https://seven-leven.github.io/bird_dash/' },
      { text: 'Changelog', link: `${REPO_URL}/blob/main/CHANGELOG.md` },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Design manifesto', link: '/DESIGN' },
        ],
      },
      {
        text: 'How it works',
        items: [
          { text: 'Architecture', link: '/ARCHITECTURE' },
          { text: 'Data', link: '/DATA' },
          { text: 'Decisions', link: '/DECISIONS' },
        ],
      },
      {
        text: 'Working on it',
        items: [
          { text: 'Workflow', link: '/WORKFLOW' },
          { text: 'Testing', link: '/TESTING' },
          { text: 'Test procedures', link: '/TEST-PROCEDURES' },
          { text: 'What is next', link: '/plans/TODO' },
        ],
      },
    ],
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: REPO_URL, ariaLabel: 'The source on GitHub' }],
    editLink: {
      // Runs in the browser, so it names the repository itself (no imports there).
      pattern: ({ filePath }) =>
        `https://github.com/seven-leven/bird_dash/edit/main/docs/${
          filePath === 'index.md' ? 'README.md' : filePath
        }`,
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'The drawings carry the colour. Everything around them makes room.',
    },
  },
});
