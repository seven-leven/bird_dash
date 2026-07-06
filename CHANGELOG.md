# Changelog

All versions follow `x.y.z+w` where:

- `x.y` = major/minor, set by hand in `version.json`
- `z` = patch — the commit count, computed from git at build time
- `w` = total drawn illustrations, counted from `public/lists/*.json` at build time

`z` and `w` are **derived, never stored**: the deployed site always shows the true numbers and
nothing can drift. Print the current version with `deno task version`. To log new work here, run
`deno task changelog` — it inserts every commit made since this file was last touched under
_Unreleased_, ready to edit and commit.

---

## v0.8.0 (Redesign, Performance & Tooling)

- 2026-07-05 | scroll-spy fix (content-visibility regression), Dhivehi name + Thaana script search,
  CSS de-duplication (`.text-muted`, `.tile-grid`, `.icon-btn-overlay`)
- 2026-07-05 | Lighthouse Accessibility + SEO to 100 — contrast pass, meta description, favicon path
  fix, eager above-the-fold images
- 2026-07-05 | performance: precomputed item fields (isDrawn / sortKey / searchText), native lazy
  images, debounced search, shallowReactive immutable data, code-split lightbox, Vue prod flags and
  a vendor chunk
- 2026-07-05 | derived versioning (patch = commit count, +count = illustrations) and
  `deno task changelog`; feature-based component structure with `useAppContext` provide/inject
- 2026-07-05 | docs: README rewritten for the new architecture
- 2026-07-05 | repo hygiene: PR CI (lint/format/build), LF line-ending policy, Pages moved to
  workflow builds, dead gh-pages branch removed
- 2026-07-05 | UI cohesion pass: accent design token, shared icon/UI components, matching skeletons,
  Ctrl/⌘K search, dismissible filter chip, unified component naming
- 2026-06-30 | global search: cross-collection results with counters and keyboard navigation
- 2026-05-15 | added new component; bumped deploy script
- 2026-05-12 | refactored search, segmented the build pipeline, overhauled the GitHub deploy
  workflow, re-transcoded all images

## v0.7.0 (Multi-collection Architecture)

- **0.7.072+018** | 2026-03-12 | barrel import types, updated modules |
- **0.7.071+018** | 2026-03-10 | renamed components v2, cleaned up theme usage in ui |
- **0.7.070+018** | 2026-03-10 | isolated and moved all types to its own folder |
- **0.7.069+018** | 2026-03-09 | debloated app.vue |
- **0.7.068+018** | 2026-03-09 | 🐚 Shell 029: Sand Dollar |
- **0.7.067+017** | 2026-03-09 | added shell collections |
- **0.7.066+017** | 2026-03-09 | added different thumb to different collections |
- **0.7.065+017** | 2026-03-09 | made provision to add new collections; 🦈 added shark collections |
- **0.7.064+017** | 2026-03-09 | restructured scripts folder
- **0.7.063+017** | 2026-03-06 | MVP for multi-collection architecture
- **0.7.062+017** | 2026-03-06 | created subfolders for bird pics and updated version manager
- **0.7.061+017** | 2026-03-06 | updated TODO with new multi-collection plans

## v0.6.0 (QoL, Search, and Data)

- **0.6.060+017** | 2026-02-15 | added Dhivehi names
- **0.6.059+017** | 2026-02-07 | added illustrator notes
- **0.6.058+017** | 2026-02-07 | added sort by date
- **0.6.057+017** | 2026-02-07 | added info panel to expanded image
- **0.6.056+017** | 2026-02-06 | adjusted search bar
- **0.6.055+017** | 2026-02-06 | added search bar
- **0.6.054+017** | 2026-02-06 | rewrote build process
- **0.6.053+017** | 2026-02-06 | 🐦 Bird 029: Eurasian Moorhen
- **0.6.052+016** | 2026-01-16 | added known issues documentation
- **0.6.051+016** | 2026-01-16 | ship script now skips existing images
- **0.6.050+016** | 2026-01-15 | fixed versioning system
- **0.6.049+016** | 2026-01-15 | added triple check for bird count validation
- **0.6.048+016** | 2026-01-15 | added expanded image view
- **0.6.047+016** | 2026-01-15 | 🐦 Bird 030: Eurasian Coot

## v0.5.0 (Tailwind & Dark Mode)

- **0.5.046+015** | 2026-01-15 | updated script permissions
- **0.5.045+015** | 2026-01-15 | footer implementation
- **0.5.044+015** | 2026-01-15 | updated Vite dependency
- **0.5.043+015** | 2026-01-15 | added git hooks
- **0.5.042+015** | 2026-01-12 | updated dependencies
- **0.5.041+015** | 2026-01-12 | updated README documentation
- **0.5.040+015** | 2026-01-12 | modified build.yml workflow
- **0.5.039+015** | 2026-01-12 | code cleanup
- **0.5.038+015** | 2026-01-12 | added theme toggle
- **0.5.037+015** | 2026-01-12 | migrated to Tailwind CSS and added dark mode
- **0.5.036+015** | 2025-12-19 | 🐦 Bird 004: Northern Shoveler

## v0.4.0 (Vue Rewrite)

- **0.4.035+014** | 2025-12-17 | added bird 031 to data
- **0.4.034+014** | 2025-12-05 | refactored main file
- **0.4.033+014** | 2025-12-05 | migrated from txt to json format
- **0.4.032+014** | 2025-11-21 | fixed mobile bottom scrolling
- **0.4.031+014** | 2025-11-21 | CSS cleanup + renamed variables + added progress tracker
- **0.4.030+014** | 2025-11-09 | 🐦 Bird 032: White-breasted Waterhen
- **0.4.029+013** | 2025-10-24 | code refactor
- **0.4.028+013** | 2025-10-24 | 🐦 Bird 177: House Crow
- **0.4.027+012** | 2025-10-15 | 🐦 Bird 031: Watercock
- **0.4.026+011** | 2025-11-10 | fixed scroll behavior
- **0.4.025+011** | 2025-10-11 | added thumbnail support
- **0.4.024+011** | 2025-10-07 | 🐦 Bird 011, 039, 099, 130, 133, 139 (6 birds)
- **0.4.023+005** | 2025-07-09 | 🐚 Shell 020: Clam Shell
- **0.4.022+004** | 2025-07-06 | 🐚 Shell 019: Scallop
- **0.4.021+003** | 2025-06-24 | UI revamp
- **0.4.020+003** | 2025-06-24 | converted PNG to WebP format
- **0.4.019+003** | 2025-05-30 | rewrote from scratch using Vue.js

## v0.3.0 (Deno & Build Tools)

- **0.3.018+003** | 2025-02-25 | project housekeeping
- **0.3.017+003** | 2025-02-24 | added bundler tests
- **0.3.016+003** | 2025-02-19 | added tests to handler
- **0.3.015+003** | 2025-02-15 | code formatting improvements
- **0.3.014+003** | 2025-02-14 | added license
- **0.2.013+003** | 2025-02-14 | fixed expanded images
- **0.2.012+003** | 2025-02-14 | migrated to Deno and esbuild

## v0.2.0 (Deployment Setup)

- **0.2.011+003** | 2025-02-07 | updated dependencies
- **0.2.010+003** | 2025-02-02 | major code refactor
- **0.2.009+003** | 2025-02-01 | added title card
- **0.2.008+003** | 2025-01-28 | fixed animation
- **0.2.007+003** | 2025-01-27 | added favicon
- **0.2.006+003** | 2025-01-27 | fixed local build process
- **0.2.005+003** | 2025-01-26 | configured GitHub Actions workflow for deployment
- **0.2.004+003** | 2025-01-26 | removed node_modules from tracking
- **0.2.003+003** | 2025-01-11 | 🐦 Bird 003: Garganey

## v0.1.0 (Initial Development)

- **0.1.002+002** | 2024-10-15 | 🐦 Bird 002: Cotton Pygmy-Goose
- **0.1.001+001** | 2024-10-10 | 🐦 Bird 001: Lesser Whistling-Duck
