# Scripts

The rules for everything in `script/`: the commands behind `npm run …` that take in drawings, build
the site, generate images, check the repo, run the tests and keep the version and changelog. The
site's own code (`src/`) follows [ARCHITECTURE.md](ARCHITECTURE.md); this page is the same idea for
the tooling. The words (ingest, build, generate, check, …) mean what [GLOSSARY.md](GLOSSARY.md)
says.

Every script follows these rules today, and a contract test
([`script/lib/scriptNaming_contract_test.ts`](../script/lib/scriptNaming_contract_test.ts)) checks
the ones a machine can. There are no exceptions: the test runner, the last one, moved onto `Io` in
the [test overhaul](plans/TEST-OVERHAUL.md)'s phase 1d.

## Principles

### 1. A command is a verb, and does one job

`ingest`, `build`, `generate`, `check`, `test`, `version`, `changelog`. If a command needs a flag to
change _what kind of work_ it does (`--assets-only`, `--vite-only`), it is two commands. Flags tune
how a job runs (`--dry-run`, `--verbose`, which stage or which file), never which job it is.

### 2. Changing the repository is never a side effect

Commands split by what they write:

| Kind      | Writes                                       | Runs                        | Commands                   |
| --------- | -------------------------------------------- | --------------------------- | -------------------------- |
| Changes   | Files git tracks (lists, images, `stats`)    | On your machine, on purpose | `ingest`, `generate`       |
| Builds    | Only `dist/` (ignored by git)                | Anywhere, CI included       | `build`, `docs:dev`        |
| Reads     | Nothing (reports, exit code)                 | Anywhere, CI included       | `check`, `test`, `version` |
| Edits one | One named file, shown first with `--dry-run` | On your machine             | `changelog`                |

CI runs only builds and reads. A command that changes tracked files says so in its name and in its
first line of output.

The site's build ends with its **size budget** (`script/build/sizeBudget.ts`, a Vite plugin): it
prints what a visitor downloads (the JavaScript and the CSS gzipped, the largest full drawing and
thumbnail) against the limits written there, and fails the build when one is over. Raise a limit
only on purpose, in the pull request that made the site grow.

The build also writes the page's **Content-Security-Policy**
(`script/build/contentSecurityPolicy.ts`, a Vite plugin): a `<meta>` tag first in `<head>`, as
GitHub Pages cannot send headers. Scripts, styles, images, fonts and data come from the site only;
the inline theme script in `index.html` is allowed by its hash, which the build works out from the
page it writes, so editing the script needs nothing else. Anything that loads from another address,
or a new inline script, is blocked, so a change like that has to change the policy too.

And it writes a **link preview** per drawing (`script/build/linkPreviews.ts`):
`dist/<collection>/<id>/` is a small page with the drawing's own title, description and image, which
sends a visitor on to `#<collection>/<id>` in the gallery. A link preview never sees what follows
`#`, so this is the address the viewer's Share button hands out. A collection cannot be named like a
folder the site already has (`assets`, `docs`, `full`, …).

### 3. Decide, then do, then say

Each command is three parts, in three kinds of function:

- **Plan**: pure. From what was read, decide what should happen (`planChanges`). No files, no clock,
  no console. This is where the tests go deep, with property tests where the input space is large.
- **Apply**: does what the plan says (`applyChanges`), and nothing the plan did not say.
- **Report**: turns what happened into text (`formatIngestReport`); only the command prints it.

The command's entry file only parses the arguments and wires the three together. With `--dry-run`, a
command plans and reports and does not apply.

### 4. Every generated file has one generator and one check

`stats.json`, the placeholders, the design guide, the icon sheet, the logo files and the README's
row of drawings are all generated. Each has exactly one generator under `script/generate/`, and
`check` regenerates it in memory and compares, so a stale file fails CI instead of going live. A
generated file is never edited by hand.

### 5. One home for anything shared

| What                                                  | Where                   |
| ----------------------------------------------------- | ----------------------- |
| Paths in the repository (`public/lists/`, `dist/`, …) | `script/lib/paths.ts`   |
| Project links (repository, site, docs, write-up)      | `src/domain/links.ts`   |
| Files, git, child processes, the clock                | `script/lib/io.ts`      |
| Running a command, printing, exit codes               | `script/lib/cli.ts`     |
| The collections and their lists                       | `script/lib/`, as today |

A path or a URL written out in a second place is a bug waiting for a rename.

### 6. Input and output come in from the edge

Every command's `main` takes an `io` object (files, git, processes, clock, console) and uses nothing
else to reach the outside world. Tests pass a fake `io`; nothing in a test touches the real
repository except a contract test, on purpose. There is one `Io` type for all commands.

### 7. Every command has the same shape

```ts
const USAGE = `npm run thing [-- --dry-run]
  What the command does, in a line or two.`;

/** `npm run thing`: what it does, in one line. */
export const main = command(USAGE, async (args, io) => {
  // parse args → read → plan → (apply) → report
});

// The command's entry point: it only runs as a program, never inside a test.
/* c8 ignore next */
if (import.meta.main) process.exit(await main(process.argv.slice(2)));
```

`command` (`script/lib/cli.ts`) gives every `main` the same `(args, io = realIo, options?)` and
turns what the work does into an exit code: `--help` prints the usage, wrong arguments exit 2,
anything thrown is one `✗` line and exit 1. Arguments are read by `parseArgs` in the same file, on
Node's own `util.parseArgs`: an option takes its value as `--into <dir>` or `--into=<dir>`, and the
test runner reads its flags with it too.

Exit codes mean the same everywhere: `0` done, `1` the work found a problem (a failed check, a
failed image), `2` the command was used wrongly (an unknown flag). Shared flags mean the same
everywhere: `--dry-run` (plan and report, change nothing), `--verbose` (say more), `--help`.

### 8. One voice

All output goes through the reporter in `script/lib/cli.ts`: the same marks (`✓` done, `✗` problem,
`·` skipped or nothing to do), the same two-space indent, a timing at the end, problems on stderr.
On a terminal the real `Io` colours `✓` green and `✗` red with Node's `styleText`; piped, in CI logs
or under `NO_COLOR` they stay plain. Only `print*` functions write to the console, and only the
command calls them. A message names the file and says what to run to fix it: `✗ public/stats.json is
stale: run npm run ingest`.

## Naming

### Files and folders

- **A folder is the command it serves**, in one word: `ingest/`, `build/`, `generate/`, `check/`.
  Shared code is in `lib/`.
- **A file is named after its main export**, in camelCase, as in `src/`: `planChanges.ts` exports
  `planChanges`. A file of several related functions is named for their subject: `palette.ts`,
  `logo.ts`, `cli.ts`. A command's entry file is named after the command: `ingest/ingest.ts`.
- **Tests sit beside their file** with the tier suffix: `planChanges_test.ts`,
  `planChanges_prop_test.ts` ([TESTING.md](TESTING.md)).

### Functions: a verb from this list

| Verb             | Means                                                     | Example                  |
| ---------------- | --------------------------------------------------------- | ------------------------ |
| `read` / `write` | A file in or out                                          | `readList`, `writeStats` |
| `scan`           | List what is in a folder                                  | `scanSources`            |
| `parse`          | Text to data                                              | `parseLcov`              |
| `to…`            | One form of the same thing to another                     | `toIds`                  |
| `compute`        | Work something out, purely                                | `computeVersion`         |
| `plan` / `apply` | Decide what to change / change it (principle 3)           | `planChanges`            |
| `format`         | Data to text, returned                                    | `formatCheckReport`      |
| `print`          | Text to the console                                       | `printReport`            |
| `check`          | Compare against what should be; return the problems found | `checkGenerated`         |
| `count`          | A number                                                  | `countCommits`           |
| `draw`           | An image (SVG markup or pixels), returned                 | `drawPlaceholder`        |

Two more kinds of name:

- **A command's own verb** names the function that does its work: `ingestDrawings`, `buildStages`,
  `generate…`, `checkRepository`, `writeChangelog`.
- **A function that makes something is named for what it makes**, as a noun: `command(usage, work)`
  makes a command's `main`, `fakeIo()` makes an `Io`.

Never `get`, `do`, `handle`, `process`, `run` or `execute`: they say that something happens, not
what. `main` is the one exception, the entry of a command, made with `command`:

```ts
export const main = command(USAGE, async (args, io) => {
  const { flags } = parseArgs(args, ['--dry-run']);
  // read → plan → (apply) → report
});
```

### Values and types

| Thing                | Rule                                                             | Example                               |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| Variables            | Whole words. Only `i`, `e` and the like inside a one-line lambda | `collection`, not `col`               |
| Booleans             | `is`, `has` or `should`                                          | `isStatsCurrent`, `hasDate`           |
| Lists                | Plural                                                           | `drawnIds`, `failures`                |
| Maps                 | `…By…`                                                           | `itemsById`                           |
| Units                | In the name                                                      | `durationMs`, `widthPx`, `sizeBytes`  |
| Types and interfaces | The noun it is; no `Data`, `Info`, `Result` or `Object` suffix   | `ChangePlan`, `Transcoded`, `Version` |
| Constants            | `SCREAMING_CASE` only for settings at the top of a module        | `NEWEST_COUNT`                        |
| Flags                | kebab-case, whole words                                          | `--dry-run`                           |

### npm scripts

A word for the job, then a colon and which part of it: `build:site`, `generate:placeholders`,
`test:dom`. The bare word does the whole job (`build` is the site and the docs). No two scripts do
the same thing.

## Comments

Say why, not what; name the rule or the file a choice comes from. Every file starts with one or two
lines saying what it is for. A `c8 ignore` always says why the line cannot run in a test.

## Before a script change ships

- [ ] Does each new command do one job, and say in its name whether it changes the repository?
- [ ] Is the decision pure, and tested apart from the files it touches?
- [ ] Does every path come from `lib/paths.ts`, and every outside effect go through `io`?
- [ ] Do the names follow the tables above, verbs included?
- [ ] Does `--dry-run` change nothing?
- [ ] Is the command in WORKFLOW.md's table, and in an area in `script/testRunner/areas.ts`?
