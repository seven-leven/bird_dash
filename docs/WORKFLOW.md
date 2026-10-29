# Workflow

How a change gets from your machine to the live site, and how to keep the toolchain up to date. For
running and fixing tests, see [TEST-PROCEDURES.md](TEST-PROCEDURES.md); for why things are set up
this way, see [DECISIONS.md](DECISIONS.md).

```
branch from main → commits → pull request → CI (4 required checks) → merge → deploy → live
```

Every merge to `main` deploys. There are no releases or tags, so `main` is always what visitors see.

## 1. Start a branch

```bash
git switch main
```

```bash
git pull --ff-only
```

```bash
git switch -c test/lightbox-keys
```

Name it `<type>/<topic>`, with the type of the commits it will hold (below) and a few words of
topic: `feat/logo`, `test/pipeline-coverage`, `docs/icon-grid`, `chore/node-migration`. One branch,
one topic.

## 2. Commit

Write the subject as `<type>: <what changed>`, or `<type>(<scope>): …` for a part of the project:

| Type       | For                                                           |
| ---------- | ------------------------------------------------------------- |
| `feat`     | Something a visitor can see or use                            |
| `fix`      | A bug fix                                                     |
| `test`     | Tests and the test runner                                     |
| `docs`     | Documentation and generated doc images                        |
| `refactor` | Code that changes shape but not behaviour                     |
| `build`    | Toolchain, dependencies, CI                                   |
| `chore`    | Anything else that does not touch behaviour (data tidy, etc.) |

The body says **why**, and anything a reviewer should know. Keep one concern per commit. When you
move or rename files, commit the moves on their own first and fix the imports in the next commit, so
`git log --follow` keeps each file's history.

Data-only changes (a new drawing, a corrected name) follow the same steps;
[DATA.md](DATA.md#recipes) has the recipes.

## 3. Before you open the pull request

1. Run the checks CI will run: the list is in
   [TEST-PROCEDURES.md, section 3](TEST-PROCEDURES.md#3-before-you-open-a-pull-request). Coverage
   must stay at 100%: new code needs a test.
2. If you changed a design token, an icon or the logo, run `npm run generate` and commit the images.
3. Update the changelog:

   ```bash
   npm run changelog
   ```

   It inserts every commit since `CHANGELOG.md` was last changed at the top of the newest section.
   Edit those lines into one entry per piece of work, written for someone who did not see the
   commits, and commit the result.
4. If the work finishes a plan in `docs/plans/`, delete the plan in the same pull request.

## 4. Open the pull request

```bash
git push -u origin test/lightbox-keys
```

```bash
gh pr create --base main
```

Title: what the change does, in plain words. Description: what changed, why, what a reviewer should
look at, and what you checked (and what you could not). Keep it to the branch's one topic.

## 5. CI

[`ci.yml`](../.github/workflows/ci.yml) runs [`verify.yml`](../.github/workflows/verify.yml) on
every pull request; a new push cancels the run in progress for the same pull request. `main` will
not accept the merge until these four checks pass:

| Check                                    | What it runs                                                                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify / Lint, types, tests, and build` | `npm ci`, lint, format check, type check, every test tier with coverage (in Los Angeles time), the asset check, the build of the site and of the docs |
| `verify / Tests (UTC)`                   | Every test tier in UTC                                                                                                                                |
| `verify / Tests (Asia/Kolkata)`          | The same, UTC+5:30                                                                                                                                    |
| `verify / Tests (Pacific/Kiritimati)`    | The same, UTC+14                                                                                                                                      |

The run page has the summary tables, and the `test-results` artifact holds the full report. When a
check fails, see
[TEST-PROCEDURES.md, section 6](TEST-PROCEDURES.md#6-when-ci-fails-but-your-machine-passes). The
weekly deep run of the property tests ([`nightly.yml`](../.github/workflows/nightly.yml)) is
separate and does not block merges.

## 6. Merge

- Merge with **"Create a merge commit"**, the repository's default. The commit counter in the
  version includes merge commits.
- **Auto-merge is turned off** in the repository settings, so someone merges by hand once the checks
  are green. No review is required.
- **The branch must be up to date with `main`.** If `main` moved on after the checks ran (another
  pull request merged), GitHub blocks the merge until you press **Update branch**; that merges
  `main` into the branch and runs the checks again. Two pull requests that pass on their own can
  still break each other; this is what catches it.
- **Do not bypass the checks.** Admins can merge past them; a red merge deploys a broken site.
- **Finish pushing before you merge.** Commits pushed to a branch after its pull request was merged
  are not in `main`. If that happens, open a new pull request for them from a new branch.
- The branch is deleted on GitHub when the pull request merges. Pushing to it again re-creates it.

## 7. Deploy

Merging pushes to `main`, which starts [`deploy.yml`](../.github/workflows/deploy.yml):

1. The same `verify.yml` runs again on the merged code.
2. If it passes, the built `dist/` is published to GitHub Pages: the gallery at `/bird_dash/` and
   the docs site (built into `dist/docs/`) at
   [`/bird_dash/docs/`](https://seven-leven.github.io/bird_dash/docs/). If not, nothing is published
   and the site stays as it was.

A newer merge cancels a deploy still in progress, so only the latest `main` goes out. To check what
is live, compare the commit hash in the site's footer (`Valu Kukulhu · v0.9.230 · 0f5de0a`) with
`main`.

## 8. Afterwards

```bash
git switch main
```

```bash
git pull --ff-only
```

```bash
git branch -d test/lightbox-keys
```

## Commands

Grouped by job, as [SCRIPTS.md](SCRIPTS.md) names them. Every command takes `-- --help`.

**Look at the site** (changes nothing)

| Command                | Does                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Serve the site with live reload                               |
| `npm run docs:dev`     | Serve the docs site (`docs/*.md`, VitePress) with live reload |
| `npm run preview`      | Serve the built site from `dist/`                             |
| `npm run docs:preview` | Serve the built docs site from `dist/docs/`                   |

**Change the repository** (on your machine, on purpose; each says so in its first line)

| Command             | Does                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run ingest`    | Take in new drawings: date them, make their WebPs, rewrite `stats.json` (`-- --dry-run` first)              |
| `npm run generate`  | Redraw the generated files (`-- placeholders` for some; `-- --into <dir>` to look first, changing nothing)  |
| `npm run changelog` | Insert the commits since the last changelog edit at the top of the newest section (`-- --dry-run` previews) |

**Build** (writes only `dist/`)

| Command                             | Does                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `npm run build`                     | Build the site, then the docs site into `dist/docs/`; what CI and deploy run |
| `npm run build:site` / `build:docs` | One stage only (`npm run build -- docs` is the same)                         |

**Check** (reads only; exits 1 on a problem)

| Command                | Does                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run check`        | Missing or orphaned images, and stale generated files                     |
| `npm run typecheck`    | Type-check the `.ts` sources and the `.vue` components (vue-tsc)          |
| `npm run lint`         | Lint (ESLint)                                                             |
| `npm run format:check` | Check the formatting (dprint); `npm run format` fixes it                  |
| `npm run version`      | Print the version (`-- --long` adds the line's name, drawings and commit) |

**Test** ([TESTING.md](TESTING.md))

| Command                                         | Does                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm test`                                      | Every tier, one summary row per tier (`npm test -- dom interface`, `npm test -- src/lib`) |
| `npm run test:unit` (`dom`, `prop`, `contract`) | Just that tier                                                                            |
| `npm run test:watch`                            | Re-run the tests on every save                                                            |
| `npm run test:coverage`                         | Every tier and the coverage table; fails below the line or branch floor                   |
| `npm run test:report`                           | The same, saving the full report to `test-results/report.md`                              |
| `npm run test:html`                             | The same, plus an HTML coverage report in `test-results/coverage/`                        |

## Versioning

The footer of the site says how far the archive has come (`18 of 276 drawn, by hand`) and, in its
small print, which build this is (`Valu Kukulhu · v0.9.161 · 4f0f400`); `npm run version -- --long`
prints `0.9.161 Valu Kukulhu · 18 drawings · 4f0f400`. Nothing here is stored except `major.minor`;
the rest is worked out from the repo when the site is built, so it cannot drift.

| Part           | Where it comes from                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `0.9`          | `script/version/base_version.json` — edit by hand when a new line of work starts (e.g. `0.9` → `0.10`) |
| `.157` patch   | number of commits in the history (`git rev-list --count HEAD`) — see the note below                    |
| `Valu Kukulhu` | the line's name: the Dhivehi names of the drawings, in the order they were drawn — see below           |
| `18 of 276`    | illustrations with a `drawn` date, of all the items in `public/lists/*.json`                           |
| `4f0f400`      | the commit the build was made from                                                                     |

- **Each line is named after a drawing.** Line `0.n` takes the n-th Dhivehi name the archive gives,
  oldest drawing first (on the same day, in collection order, then by id), each name once, a drawing
  with two names giving its first: v0.1 is "Reyru", v0.9 "Valu Kukulhu", and v0.10 will be the next
  name drawn after it (today "Kaalu", the House Crow). The footer shows the romanised name, with the
  Thaana and the bird on hover; `CHANGELOG.md` headings carry it, and a test fails if one disagrees
  with the lists (a back-dated drawing would shift the names after it).
  [`script/version/line_names.ts`](../script/version/line_names.ts) has the rule.
- **The patch is a build counter, not a count of fixes.** On `main` it includes merge commits, so it
  rises by a few with every merged PR, and a local branch shows a different number from the deployed
  site (which is why the commit is shown too).
- **One implementation.** [`script/version/version.ts`](../script/version/version.ts) computes all
  of it. `npm run version` prints it (`--long` for the whole line), the build and check summaries
  print it, and `vite.config.ts` calls the same function to inject it into the footer.
- **Without git** (e.g. a zip download) a local build warns and shows patch `0` / commit `unknown`;
  `npm run version` and any build with `CI` set fail instead of inventing a number.

There are no git hooks, tags or releases: CI and the deploy are the only gates. Changelog entries
are curated with `npm run changelog`, which lists every commit made since `CHANGELOG.md` was last
touched and inserts them at the top of the newest section to edit and commit. Every merge to `main`
deploys, so there is no "unreleased" section.

## When something goes wrong

| Situation                         | What to do                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| A check fails on the pull request | Fix it on the branch and push; the run restarts                                                                 |
| The deploy job failed             | Open the run under **Actions → Deploy to GitHub Pages** and read the failing step; re-run it if it was a hiccup |
| A merged change broke the site    | Use **Revert** on the merged pull request; GitHub opens a pull request that undoes it. Merge it like any other  |
| The footer shows an old commit    | The deploy is still running, was cancelled by a newer one, or failed: check **Actions**                         |

## Upgrading dependencies

Every version is pinned exactly ([why](DECISIONS.md#every-version-pinned-exactly)), so an upgrade is
a small pull request of its own (`build:` type).

**Dependabot proposes most of them.** Every Monday it opens one pull request with that week's minor
and patch updates to the npm packages, one with the GitHub Actions updates, and one per major
version ([`.github/dependabot.yml`](../.github/dependabot.yml)). Review and merge them like any
other pull request once CI is green. It leaves alone: Node itself, `@std/assert` (from JSR's
registry), `@types/node` majors (they follow `.nvmrc`) and TypeScript majors (until
typescript-eslint supports them). Those, and anything you want sooner, are done by hand as below.

**npm packages**

```bash
npm outdated
```

```bash
npm install --save-exact <name>@<version>
```

```bash
npm dedupe
```

`npm dedupe` matters: without it a tool can bring a second copy of a library into the bundle (it
happened with `@vue/shared`). If npm reports a package whose install script is not allowed (sharp
and dprint need theirs), run `npm approve-scripts <name>`; it updates `allowScripts` in
`package.json`. Then run the full check list, and look at the build output: the `vue-*.js` chunk
should still be there and about the same size.

**Node.** Change `.nvmrc` and `engines` in `package.json`. Stay on the LTS line
([why](DECISIONS.md#node-on-the-lts-line)) and run the check list on the new version.

**GitHub Actions.** Each one is pinned to a commit with the version beside it:

```yaml
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

To update one, find the commit of the new release tag (the `^{}` line is the commit for an annotated
tag):

```bash
git ls-remote https://github.com/actions/checkout refs/tags/v7.0.2 "refs/tags/v7.0.2^{}"
```

Replace both the hash and the comment, and read the release notes for breaking changes before
merging.

**dprint plugins** are pinned by URL in `dprint.json`. After changing one, run `npm run format` and
commit the reformatting on its own.
