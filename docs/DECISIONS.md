# Decisions

Why the project is set up the way it is. Each entry says what was chosen, why, what it costs, and
when to look at it again. Read the entry before undoing one of these: most of them look like
something to "fix" until you know the reason.

The [CHANGELOG](../CHANGELOG.md) records _what_ changed and when; this page records _why_. Add an
entry when you make a choice someone could reasonably make the other way, and update an entry,
rather than deleting it, when the answer changes.

## Toolchain

### Node and npm, not Deno

**Chosen** (October 2026): Node 24 and npm for everything outside the browser: scripts, tests, type
check, lint and format. Deno was used before.

**Why.** Deno could not type-check `.vue` files (vue-tsc does not run under it) or load them in a
test, so the components were outside both the type check and coverage. Under Node, `vue-tsc` checks
the components, and Vitest compiles them exactly as the build does. Node also runs `.ts` files
directly (it strips the types), so the scripts need no build step.

**Cost.** Several tools (Vitest, vue-tsc, ESLint, dprint) instead of one binary.

**Revisit** only if Deno gains `.vue` support and there is a reason to move again.

### Vitest, keeping `@std/assert`

**Chosen:** Vitest runs the tests; the assertions are still `assertEquals`, `assertRejects` and the
rest from `@std/assert` (installed from JSR's npm registry, see `.npmrc`).

**Why.** Vitest reads `vite.config.ts`, so tests resolve imports and compile Vue as the build does.
Keeping the assertions meant the move to Node changed one line per test file, not every test body.

**Revisit** if someone wants Vitest's `expect`; there is no hurry, both work.

### dprint, not Prettier or Biome

**Chosen:** dprint, with the Deno presets (`dprint.json`): single quotes, width 100, Markdown
wrapped at 100.

**Why.** `deno fmt` is dprint inside, so this kept the exact formatting the code already had; the
switch from Deno reformatted nothing. Prettier or Biome would have rewrapped most files in one large
diff. `.vue` files are not formatted, as before.

**Revisit** if `.vue` formatting becomes wanted; that would be the moment to compare tools.

### ESLint with the recommended rules only

**Chosen:** ESLint's, typescript-eslint's and `eslint-plugin-vue`'s `flat/essential` recommended
sets; `no-undef` off (TypeScript reports it) and `vue/multi-word-component-names` off (`Icon` and
`Chrome` read fine).

**Why.** The aim is catching mistakes, not enforcing style; dprint owns style.

### Every version pinned exactly

**Chosen:** npm packages are recorded without `^` or `~` (`.npmrc` sets `save-exact`); Node is
pinned in `.nvmrc` (CI reads the same file); each GitHub Action is pinned to a commit hash, with its
version in a comment.

**Why.** A build should be reproducible: the same commit builds the same site, today or in a year.
Version tags on actions can be moved by their owner; a commit hash cannot.

**Cost.** Upgrades are deliberate work. Dependabot proposes them weekly, grouped, so they are
reviewed rather than forgotten (see [WORKFLOW.md](WORKFLOW.md#upgrading-dependencies)).

### Node on the LTS line

**Chosen:** Node 24 (24.22.1 in `.nvmrc`), the latest long-term-support line, not Node 26.

**Why.** Node 26 was still "Current" (not LTS) when this was set. A deploy toolchain should be on a
line that gets security fixes for years.

**Revisit** when Node 26 becomes LTS (late October 2026).

### TypeScript 6.0, not 7.0

**Chosen:** TypeScript 6.0.3.

**Why.** typescript-eslint supports TypeScript below 6.1 only. TypeScript 7.0 is out, but lint would
not run on it.

**Revisit** when typescript-eslint supports 7.0; check that `vue-tsc` does too.

## Tests

### Coverage floors at 100%

**Chosen:** CI fails if line or branch coverage of the `.ts` code is below 100% (`--min-lines=100`,
`--min-branches=100` in `package.json`).

**Why.** At 100% the rule is simple: new code comes with a test. A lower floor leaves room for code
to slip in untested, and the room never shrinks on its own.

**Cost.** Every branch needs a test, including the dull ones (a missing field, a failed request).

### `c8 ignore` only for code that cannot run in a test

**Chosen:** `/* c8 ignore next */` (or `start` / `stop`) is allowed for two kinds of code, always
with a comment giving the reason:

- code that starts a real program: each command's `if (import.meta.main)` line, `spawnVite` (the
  real `vite build`) and the test runner's `vitest()`;
- guards for cases that cannot happen, such as a key handler that only exists while the viewer is
  open checking that the viewer is open.

**Never** for logic a test could reach. **Dead code is deleted, not ignored:** if a branch can never
run, remove it (as was done in `useHashRoute` and `switchCollection`). `grep -rn "c8 ignore" src
script` lists every marker; each should still be true when you read it.

### Components outside the totals until they have tests

**Chosen:** `.vue` files are not on the untested-files list (`discoverSources` in
`script/testRunner/areas.ts`). A component counts toward coverage once a test loads it, and must
then be at 100% like everything else; one that no test loads yet does not count.

**Why.** Adding all 17 at once would drop coverage far below the 100% floor and block CI until every
component had tests. They join one by one, each with its tests (see [plans/TODO.md](plans/TODO.md)).
`ItemTile`, `EmptyState`, `IdBadge` and `Icon` have.

### Tiers by file name, and a runner on top of Vitest

**Chosen:** a test's tier comes from its name (`_test`, `_dom_test`, `_prop_test`,
`_contract_test`). `npm test` runs `script/testRunner/runTests.ts`, which runs Vitest once and
prints one row per tier and per area.

**Why.** The name tells you at a glance what a test needs (nothing, a fake DOM, many generated
inputs, the real repo files), and running one tier needs no configuration. Vitest's own output is
long for a green run; the runner shows what matters and replays Vitest's full output only on
failure. It also adds a check that coverage cannot do: **every source file must be imported by some
test**, because coverage only counts files a test loads.

### Timezones in CI

**Chosen:** the main CI run uses `America/Los_Angeles`; the tests run again in UTC, India and
`Pacific/Kiritimati` (UTC+14).

**Why.** A date bug (a month bucketed wrongly for viewers west of UTC) once reached the site. Dates
must be built in UTC; running in zones on both sides of the date line catches local-time slips.
Windows ignores `TZ`, so this can only be reproduced on macOS, Linux or in CI.

## The site

### Hash URLs

**Chosen:** addresses are `#<collection>` and `#<collection>/<item>`, owned by `useHashRoute`.

**Why.** The site is static files on GitHub Pages, which cannot send every path to `index.html`. A
path such as `/birds/001` would be a 404 when reloaded or shared; a hash never reaches the server.

### Names beside a drawing, never on it

**Chosen** (October 2026): a tile's names sit in a caption under the image; only the small id badge
is on it. Drawn and undrawn tiles look different at a glance (paper versus the interface's grey).
See [DESIGN.md](DESIGN.md), P1 and §09.

**Why.** The names used to sit on a dark gradient across the bottom of the image. On phones, where
they are always shown, it covered about a third of each drawing, and on desktop the English name
appeared only on hover. In the light theme a placeholder (a grey icon on white, with the same
gradient) looked like a sketch. A caption leaves the drawing whole, works the same with touch and a
mouse, and lets the two kinds of tile differ.

**Cost.** A tile is taller than its image by the caption's height, so fewer fit on a screen.

### Colours are measured as Tailwind renders them

**Chosen** (October 2026): `script/generate/palette.ts` reads every colour from Tailwind's own
palette (`tailwindcss/colors`, in oklch) and converts it to hex. The guide's swatches, every
contrast figure in DESIGN.md, the accent menu's rule and the placeholders all use those values; a
test checks the page's tables against them.

**Why.** The file used to hold Tailwind 3's hex values, typed by hand, while the site renders
Tailwind 4's oklch colours, which differ slightly. The figures described colours nobody saw, and the
placeholders' grey was not quite the tile's. Measured properly, cyan's marker shade (2.37:1 on
white) is paler than teal's (2.42:1), so cyan left the accent menu, as the rule requires. No
collection used it.

### Composition API only

**Chosen:** `<script setup>` and composables throughout; `__VUE_OPTIONS_API__` is `false` in
`vite.config.ts`.

**Why.** One way of writing components, and Vue drops the Options-API code from the bundle.

### Vue in its own chunk

**Chosen:** `manualChunks` in `vite.config.ts` puts `vue` and `@vue/*` in a separate file.

**Why.** Vue changes far less often than the app, so returning visitors keep it cached across
deploys. The rule matches npm's `node_modules/vue/` layout; if it ever stops matching, the chunk
quietly merges into the main bundle, so check the build output for a `vue-*.js` file after a
toolchain change. Run `npm dedupe` after upgrades: two copies of `@vue/shared` once ended up in it.

### Derived version, no releases

**Chosen:** the version is computed at build time (see the README, "Versioning"); there are no tags
or releases, and every merge to `main` deploys.

**Why.** A stored version drifts and needs bump commits; a derived one cannot drift. A hobby site
with one maintainer gains nothing from release batches, so the changelog has no "unreleased"
section.

## Repository layout

### One folder per command in `script/`

**Chosen:** a folder per command (`script/ingest/`, `build/`, `generate/`, `check/`, `version/`,
`changelog/`, `testRunner/`), with shared code in `script/lib/`; each command's entry file is named
after it. The helpers that tests share live in `src/testing/`, because nearly all of their users are
`src/` tests. Until the [scripts overhaul](plans/SCRIPTS-OVERHAUL.md) is done, some commands are
still in their old folders (`script/build/` also takes in drawings; `design/` and `placeholders/`
hold generators).

**Why.** An entry point is easy to find, and a file name alone (in an editor tab, a stack trace)
says what the file does. The rules for scripts are in [SCRIPTS.md](SCRIPTS.md).

### One naming style for the whole repository

**Chosen (2026-10-26):** camelCase file names everywhere (`useHashRoute.ts`, `planChanges.ts`), and
PascalCase for components (`LightBox.vue`). A file that exports one main thing is named after it
exactly: `useLightbox.ts` exports `useLightbox`. Test files keep their module's name plus the tier
suffix (`useLightbox_dom_test.ts`). Until then `script/` used snake_case (`plan_changes.ts`); its
files are renamed as the overhaul reaches them.

**Why.** One rule is easier to keep than two, and a file named after its export can be found by
searching for either. snake_case in `script/` was only how the scripts happened to start; once the
scripts are rewritten to [SCRIPTS.md](SCRIPTS.md), keeping a second style buys nothing.

**Cost.** Every script file is renamed once, with `git mv` so its history follows.

### `src/` is what the code imports, `public/` is what it fetches

**Chosen:** anything the code imports goes in `src/`, so Vite processes it: the styles and font are
in `src/styles/` (`main.css`, `fonts/`). Anything fetched by URL at run time, or that needs a fixed
address, goes in `public/`: `collections.json`, the lists, the drawings, the placeholders, the
favicon.

**Why.** `main.css` is Tailwind source (`@import 'tailwindcss'`, `@variant`, theme tokens); served
from `public/` it would arrive unprocessed and the site would have no styles. Through Vite, the font
also gets a content hash in its name (`Faruma-<hash>.woff`), so browsers can cache it for good and
still notice a change. The folder is called `styles/`, not `assets/`, because `public/` and
`docs/assets/` hold the content and images.

### Tailwind does not read `docs/` or `.github/`

**Chosen:** `main.css` tells Tailwind to skip those folders (`@source not`).

**Why.** Tailwind builds CSS for every word in the repository that looks like a class name. Text in
the docs and the GitHub config once added `.isolate`, `.uppercase` and
`[version-update:semver-major]` (from `dependabot.yml`) to the site's stylesheet. Classes the site
uses are all in `src/` and `index.html`.

### The icon and logo drawings live in `src/lib/`

**Chosen:** `src/lib/icons.ts` and `src/lib/logo.ts` hold the SVG drawings; `Icon.vue`,
`CollectionIcon.vue` and `LogoMark.vue` in `src/components/icons/` render them.

**Why.** The drawings are plain data with no Vue in them, and two commands read them (the design
guide and the placeholder generator). Scripts importing from `src/lib/` is expected; scripts
reaching into `src/components/` blurred the layers. For the test report they still count under
"viewer and interface": an area's longest matching path wins (`script/testRunner/areas.ts`).

### Generated images are committed

**Chosen:** `public/full/`, `public/thumb/` and `public/placeholders/` are in git, although `npm run
ingest` and `npm run generate` make them. The source PNGs (`raw_png/`, tens of MB) are not.

**Why.** CI and the deploy run only the Vite build: they never see `raw_png/`, so the generated
images must already be in the repository. Committing the small WebPs (a few MB) instead of the large
sources keeps the repository light, and the integrity check (`npm run check`) fails if an image is
missing or orphaned. Do not add these folders to `.gitignore`.

### Docs: reference pages, a backlog, generated images

**Chosen:** `docs/` holds pages that describe how things work now; `docs/plans/` holds only work not
done yet (the backlog, [TODO.md](plans/TODO.md)); `docs/assets/` holds images drawn by `npm run
design`. A plan is deleted when its work is done.

**Why.** A page about the past goes stale while looking current. The CHANGELOG records what changed,
this page records why, and git keeps the old plans.

## Scripts

### `ingest` changes the repository, `build` does not

**Chosen (2026-10-26):** taking in new drawings (transcoding images, dating new entries in the
lists, rewriting `stats.json`) is its own command, `npm run ingest`, run on your machine. `npm run
build` only makes `dist/` from what is committed, and is what CI runs.

**Why.** `build:assets` used to do both, so "build" could quietly change files git tracks. With the
two apart, a build can run anywhere without surprises, and every change to tracked files is one you
asked for by name ([SCRIPTS.md](SCRIPTS.md), principle 2).

### A local build includes the docs

**Chosen (2026-10-26):** `npm run build` builds the site and then the docs site, as CI does;
`build:site` and `build:docs` build one.

**Why.** A local `dist/` that matches the deployed one catches a broken docs page before CI does. It
costs about three seconds.

**Revisit if** the docs build grows slow enough to get in the way.

### Old command names are not kept as aliases

**Chosen (2026-10-26):** when a command is renamed (`build:assets` to `ingest`, `build:vite` to
`build:site`, `placeholders` and `design` to `generate`), the old name goes in the same pull
request, together with WORKFLOW.md and the workflows.

**Why.** One person runs these commands, and two names for one thing is what SCRIPTS.md exists to
prevent.
