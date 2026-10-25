# Wildlife Illustrated

## A design manifesto

_The drawings carry the colour. Everything around them makes room._

Wildlife Illustrated is an archive of illustrations in progress. Its interface should feel like a
quiet field guide: clear, consistent and honest about what exists today and what is still to come.
This document is both its point of view and its practical reference.

![Design guide](assets/design-guide.png)

The picture is drawn from the real tokens and icons by `npm run design`. The source of truth for the
tokens is [`src/styles/main.css`](../src/styles/main.css); this guide explains the decisions behind
them and how to apply them. The picture has a voice of its own (warm paper, a serif for statements);
neither is a site token. The site's colours are the swatches drawn on it.

---

## The five principles

### P1 — Drawings first

**The work is the most vivid thing on the screen.**

Illustrations carry the colour; the interface stays quiet. Nothing sits over a drawing except its
small id badge. Names, counts and controls belong beside or below it. When two choices work equally
well, choose the one that draws less attention to the interface.

### P2 — Show progress honestly

**A drawing and an empty space are not the same thing.**

This is a record of work in progress. Drawn work appears on paper-white; work not yet drawn recedes
into the interface's grey. Counts say exactly what is known, and never appear before the data is
ready.

### P3 — Always say where you are

**A visitor should never have to guess.**

The current collection, view, section and drawing are named and visibly marked. Headings stay with
the content they describe; current states use one consistent marker; links make it possible to
return. Navigation always explains both where someone is and how they got there.

### P4 — One way to do each thing

**Consistency is a feature, not a constraint.**

Tokens, components and language are shared across the site. Before creating a new pattern, use the
one that already exists. When a genuinely new pattern is needed, make it the shared pattern from
then on.

### P5 — For everyone, on every screen

**Access is part of the design, not a finishing pass.**

Start with phones. Support light and dark themes, keyboard and touch, readable contrast, reduced
motion, and both Thaana and English. Nothing essential depends on hover, colour alone or an
unlabelled icon.

When a decision is unclear, return to these principles. Change a rule if it conflicts with a
principle; do not quietly abandon the principle.

---

## 01. Colour — quiet ground, clear signal

_P1 Drawings first · P3 Always say where you are · P5 For everyone, on every screen_

Two ramps do the work: **slate** for neutral surfaces and text, **accent** for emphasis. Use token
names such as `slate-500` and `accent-700` in components, never raw hex values or a
collection-specific hue such as `teal-500`.

Every collection has one accent, declared as `accent` in `public/collections.json`. It helps
visitors know where they are: Birds use teal, Sharks blue, and Shells rose. The menu of allowed hues
lives in `src/styles/main.css`, so a new collection can choose an approved hue without changing the
CSS.

### Where colour belongs

| Role                             | Light theme                  | Dark theme                   |
| -------------------------------- | ---------------------------- | ---------------------------- |
| Page                             | `slate-50`                   | `slate-950`                  |
| Surface: header, sidebar, menus  | white                        | `slate-950` / `slate-900`    |
| Main text                        | `slate-900` / `slate-800`    | `slate-100`                  |
| Muted text                       | `slate-500` (`.text-muted`)  | `slate-400` (`.text-muted`)  |
| Borders and dividers             | `slate-200` / `slate-100`    | `slate-800`                  |
| Focus, current marker, progress  | `accent-500`                 | `accent-500`                 |
| Primary button (`.btn-primary`)  | `accent-700` with white text | `accent-700` with white text |
| Viewer title (`.viewer-title`)   | `slate-900`                  | white                        |
| Viewer body (`.viewer-body`)     | `slate-600`                  | white at 70%                 |
| Viewer label (`.viewer-label`)   | `slate-500`                  | white at 50%                 |
| Drawing id badge (over an image) | white at 70% on black at 50% | the same                     |

The accent is a signal, not decoration. Reserve it for keyboard focus, the current item, progress,
search matches and the primary action. If it appears in lots of places at once, it has stopped
communicating.

Never make colour carry meaning alone. A current tab also has a fill and stronger text; colour
reinforces the state rather than being the only clue.

### Contrast is part of the palette

New text colours must meet WCAG AA: at least **4.5:1 for body text** and **3:1 for large text and
icons**.

| Pair                       | Contrast |
| -------------------------- | -------- |
| `slate-900` on white       | 17.8:1   |
| `slate-600` on white       | 7.6:1    |
| `slate-500` on white       | 4.8:1    |
| `slate-100` on `slate-950` | 18.4:1   |
| `slate-400` on `slate-950` | 7.7:1    |
| white on `accent-700`      | 5.4:1    |
| white at 70% on black      | 10.0:1   |
| white at 50% on black      | 5.3:1    |

`accent-500` on white is about 2.4:1: use it for markers and focus rings, not text. Accent-coloured
text on a light background uses `accent-700`. `slate-400` on white also fails for text.

Every hue offered to collections must pass both tests: white text on its `700` shade at least 4.5:1,
and its `500` shade against white at least 2.4:1. A test checks the menu automatically. Amber,
yellow, lime, green and cyan are left out because their `500` shades are too pale; red is left out
because it reads as an error. For collections shown beside one another, choose distinct neighbours —
avoid pairs such as rose and pink, or violet and purple.

The viewer follows the page theme: a light page opens a light viewer. Use `.viewer-title`,
`.viewer-body` and `.viewer-label` for its text; do not hard-code faded white. Every colour needs a
dark-theme partner, either through paired classes such as `text-slate-500 dark:text-slate-400` or an
existing class such as `.text-muted`, `.btn-ghost` or `.nav-item`.

---

## 02. Type — useful, never loud

_P4 One way to do each thing · P5 For everyone, on every screen_

Use the system sans-serif throughout, and Faruma for every Thaana character. Faruma heads the main
font list but only covers Thaana, so Dhivehi is set in it wherever it appears, even typed into
search; everything else falls through to the sans-serif. Mark a Dhivehi name with `.font-dhivehi`
and `dir="rtl"`. That class also sets a line height of 1.85: Faruma's vowel marks reach half an em
below the baseline, and a tighter line, or a truncated one, cuts them off, so never add `leading-*`
to Dhivehi. The type scale has six sizes; do not add another or write pixel sizes by hand.

| Token        | Size | Purpose                                                    |
| ------------ | ---- | ---------------------------------------------------------- |
| `text-3xl`   | 30px | Dhivehi title in the viewer                                |
| `text-xl`    | 20px | English title in the viewer, when no Dhivehi name heads it |
| `text-base`  | 16px | Section headings, sidebar title, Dhivehi names             |
| `text-sm`    | 14px | Controls, body text, English names on tiles                |
| `text-xs`    | 12px | Counts and secondary lines                                 |
| `text-micro` | 11px | `.caps-label`, `.count-pill`, keyboard hints               |

Weight carries hierarchy: `font-semibold` for titles and headings, `font-medium` for controls, and
regular weight for everything else. Use `tabular-nums` for changing or aligned numbers such as
counts, ids and zoom values. Scientific names are italic; ids use monospace through `IdBadge`.

Name order is the same everywhere: **Dhivehi, English, scientific** on tiles and in the viewer.
Search results lead with English, because that is what visitors type. When a Dhivehi name exists it
is always shown, one step larger than the English beside it, because Faruma reads small at the same
nominal size. Scientific names can wait for the viewer.

In the viewer the names are one block, aligned to one edge: the Dhivehi name largest (`text-3xl`),
how to say it directly under it in small muted text ("Reyru"), then the English and the scientific
name. The romanisation is part of the name, never a separate field. Above the block, one line says
where the drawing sits and when: its id, its group (a link that shows that group in the grid) and
the month it was drawn, in the month view's words.

Nothing essential hides behind hover. Tiles show Dhivehi and English names on every device. Long
names truncate with `truncate` rather than wrapping and shifting the layout.

---

## 03. Language — say what is true

_P2 Show progress honestly · P3 Always say where you are · P4 One way to do each thing_

Words are part of the interface. Use the same wording for the same action, make counts describe the
data that actually exists, and let every control explain what it does.

### Counts describe the view

Counts come from [`src/lib/formatCount.ts`](../src/lib/formatCount.ts); never compose them by hand.

| What the view contains                    | Under the collection's name         | Sidebar pill |
| ----------------------------------------- | ----------------------------------- | ------------ |
| A collection with gaps, grouped by family | `All 204` · `Drawn 15` (the filter) | `4 of 8`     |
| A collection with none, grouped by family | `30 of 30 drawn` (`drawnOf`)        | `4 of 8`     |
| Drawn items only, grouped by month        | `2 drawings` (`drawings`)           | `2`          |
| Search, family view (dropdown and chip)   | `10 matches, 1 drawn`               | none         |
| Search, month view (drawn items only)     | `4 matches` (`matches`)             | none         |

The forms differ on purpose: "of 8" only makes sense when there is a total still to be drawn. A
search is counted in "matches" wherever it is shown; never "results". Never show a count until it is
known.

Each count is shown once on a screen, and sits under the name of what it counts. The sidebar opens
in three levels, largest first: the collection's emblem, its name, then its count, so `All 30 ·
Drawn 3` under "Shells" can only mean shells. The view's name then labels the list below. Never put
a collection's count under a view's name: under "Groups", "30" reads as thirty groups. Below 1024px
the sidebar is a drawer, so the count sits above the grid instead. The sidebar's footer holds the
total across every collection.

A view has one name, in the header's tab and over the sidebar's list alike: the collection's groups
in the plural ("Families", "Orders"), or "Months". `src/lib/viewName.ts` makes it.

Use **sentence case** for buttons, labels and headings: "Clear search", not "Clear Search".
`.caps-label` handles the small uppercase treatment; its markup is still written in sentence case.

Say what a control does in its `aria-label` and tooltip, especially when it is icon-only: "Switch to
dark mode", not "Moon".

A reference to another drawing is a real link. "See note for #11 (Greater Flamingo)" links to
`#birds/011` and opens that drawing like any other deep link.

The illustrator's note is their own words, so it is set as they wrote it: in regular text (not
italic, which is hard to read at length), split into paragraphs at blank lines, marked by a rule at
its side. A long note (over about 320 characters, or more than two paragraphs) opens folded to its
first lines with "Read more"; each drawing's note starts folded; the panel scrolls if it is still
taller than the screen.

---

## 04. Form — a quiet frame for the work

_P1 Drawings first · P4 One way to do each thing_

The interface frames the drawings; it does not compete with them. Prefer clear edges and consistent
spacing over decorative effects.

### Three corner treatments, no more

- `rounded-control` — **6px** for buttons, inputs and badges.
- `rounded-card` — **12px** for tiles, panels and menus.
- `rounded-full` — count pills and the progress bar.

### Space follows a rhythm

Spacing moves in **4px steps** (Tailwind's `1` is 4px). Use the existing scale rather than inventing
values.

- Inside a control: `gap-1.5` or `gap-2`.
- Control padding: `px-3 py-1.5`.
- Between tiles: `gap-3` to `gap-6`.
- Page padding: `p-4` on phones, `p-6` on larger screens.

Related things sit closer together than unrelated things. Let spacing explain the relationship.

### Edges before effects

Separate surfaces with a 1px border before reaching for a shadow; in the dark theme that border is
`slate-800`, as everywhere, never a faded white. There are two shadows, named for the two ways
something leaves the page: `shadow-float` for what sits over it (menus, sheets, the open phone
sidebar), and `shadow-lift` for what rises a little (a hovered tile, controls over a drawing). Tiles
stay square, and images are never cropped: use `object-contain`.

An id has one badge, `IdBadge`, in two placements: `overlay` over a drawing, `surface` anywhere else
(the viewer's panel and search rows included).

---

## 05. States — make interaction legible

_P3 Always say where you are · P4 One way to do each thing · P5 For everyone, on every screen_

An interactive element looks and behaves the same wherever it appears.

| State    | Appearance                                           |
| -------- | ---------------------------------------------------- |
| Default  | Muted text, no fill                                  |
| Hover    | Light grey fill, darker text                         |
| Current  | Grey fill, strong text and the accent marker         |
| Focus    | A visible 2px accent ring, `.focus-ring`             |
| Disabled | Faded text, no hover treatment, `cursor-not-allowed` |

Use the shared classes rather than restyling each control: `.btn-ghost` for icon or text buttons,
`.btn-primary` for the one primary action, `.nav-item` for a choice among several, `.count-pill`,
`.kbd-hint` and `.caps-label`.

Where a count can also filter, the count is the control: `DrawnFilter` sets "All 204" and "Drawn 15"
as two tabs, drawn like the header's view switch (`.nav-item` with the accent marker under the
current one), so they read as a choice and say how far along the collection is at once. Do not add a
separate switch beside a count; it competes with the name above it. Each tab is a button with
`aria-pressed`, in a group labelled "Show".

"Current" is semantic, not just visual. Set `aria-current` or `aria-pressed`; `.nav-item` styles
itself from those attributes, so what is seen and what assistive technology announces agree.

If it looks clickable, it must do something. Undrawn tiles are not buttons: no pointer cursor, no
hover lift, no tab stop. Never remove a focus ring without replacing it.

On phones, touch targets are at least **36px**. At that size they need no extra space between them
(WCAG 2.5.8 asks for 24px), so a tight row such as the phone header can keep its small gaps.

---

## 06. Motion — change with purpose

_P1 Drawings first · P4 One way to do each thing · P5 For everyone, on every screen_

Motion explains a change; it never decorates.

- `duration-fast` — **150ms** for hover and colour changes.
- `duration-slow` — **300ms** for movement, such as opening the sidebar.

A theme switch is a colour change: the whole page, header included, changes together at
`duration-fast`, and no region lags behind. Honour the operating system's reduced-motion setting by
turning transitions and smooth scrolling off.

---

## 07. The mark — one small signature

_P4 One way to do each thing_

The Wildlife Illustrated mark is a bird perched on the open edge of an unfinished frame: a page
corner with one side missing, the bird looking out. Its round 2px outline shares the icon set's
language. The collection's bird icon is the same bird redrawn on the 24px grid, and the tile
reverses the mark onto a solid square. These are variations of one identity, not separate designs.

![Logo sheet](assets/logo.png)

The source lives in [`src/lib/logo.ts`](../src/lib/logo.ts). `<LogoMark />` draws it, and `npm run
design` writes the files to `docs/assets/logo/`.

| Version           | Use                                             | File or implementation            |
| ----------------- | ----------------------------------------------- | --------------------------------- |
| Mark              | Default, 20px and up                            | `logo/mark.svg`, `mark-white.svg` |
| Tile              | Favicon, app icon, avatar, small or busy spaces | `logo/tile.svg`, `tile-512.png`   |
| Horizontal lockup | Header and wide spaces                          | The mark, then the wordmark       |
| Stacked lockup    | Square spaces and title cards                   | Built in the page                 |

The mark is `slate-900` on light backgrounds and white on dark ones — never a collection accent,
because the accent changes and the identity does not. In the wordmark, "Wildlife" is semibold and
"Illustrated" light, in the system sans-serif, sentence case, slightly tight; the second word is
muted (`slate-500` / `slate-400`).

Keep the mark at least 20px wide. Below that, use the tile: its solid shape survives where the open
frame would blur. Leave clear space of half the mark's width on every side.

Do not close the frame, move the bird off its line, fill, stretch or rotate the mark, add a shadow,
or set the wordmark in another font or in capitals. The browser-tab icon is the tile: `npm run
design` writes it to `public/favicon.svg`, with a 64px `favicon.png` for browsers that take no SVG
icon.

---

## 08. Icons — one family, one meaning

_P4 One way to do each thing · P5 For everyone, on every screen_

Every interface icon lives in [`src/lib/icons.ts`](../src/lib/icons.ts) and is drawn through `<Icon
name="…" />`; the logo is the only other SVG in the project. The registry, the icon sheet
([`assets/icons.png`](assets/icons.png)) and the guide use the same groups, in the same order:

- **Collections:** `bird`, `shark`, `shell`
- **Views:** `taxonomy`, `calendar`
- **Search:** `search`, `noResults`
- **Navigation:** `menu`, `chevronLeft`, `chevronRight`, `chevronDown`, `close`, `externalLink`
- **Viewer:** `zoomIn`, `zoomOut`, `reset`
- **Theme:** `sun`, `moon`
- **Labels:** `tag`, `image`, `commit`, `layers`, `pencil`, `languages`, `book`
- **Keyboard:** `arrowsUpDown`, `enter`, `command`
- **Principles:** `easel`, `progress`, `pin`, `grid`, `person`
- **Brand:** `github`

Add a new icon to one of these groups in `ICON_GROUPS`; a test fails if one is left out. In the
pictures the groups share one column grid, with a thin divider in the empty column between
neighbours, so icons, names and dividers line up from row to row.

### Drawing the set

- Draw on a **24 × 24** grid and fill most of it, leaving about 1.5px at the edges.
- Use a **2px stroke**, round ends and joins, and no fills.
- Prefer one or two bold shapes. If an icon needs more than about five strokes, simplify it.
- It must stay legible at **16px**. Run `npm run design` and look at `docs/assets/icons.png`.

Icons take `currentColor` and come in four sizes, by role: `size-3` (12px) beside a label or figure,
`size-4` (16px) in a control, `size-5` or `size-6` (20 or 24px) standing alone. Label icons sit
before their text through `.with-icon`, which sizes them. One icon is larger: the collection's
emblem at the top of the sidebar, `size-10` (40px) in the accent, the biggest icon on the page and
the only one of its size. A test fails on any other size, or a second emblem.

Each icon has one meaning wherever it appears: `tag` is the version, `image` the drawing count,
`commit` the build's commit, `layers` all collections together, `pencil` the illustrator or "drawn",
`languages` a name in another language, and `book` further reading. Icons support words; they do not
replace them. Decorative icons are hidden from screen readers.

Use drawn icons instead of Unicode symbols for arrows, return, ticks and crosses (`↑ ↓ ↵ ✓ ✕`),
because their look varies by font and device. Plain text on a key cap, such as `esc` or `Ctrl K`,
stays text.

Brand marks are the exception. Show another organisation's logo exactly as its owner publishes it,
solid fill included, and mark it `filled` in the registry; do not redraw it in our line style. Use
it in one colour, next to the brand's name. Every icon-only button needs an `aria-label`.

Collections choose their icon in `public/collections.json` (`"icon": "bird"`).

---

## 09. Tiles — paper or possibility

_P1 Drawings first · P2 Show progress honestly_

A tile is a square image with its names in a caption below, never over the drawing. The two kinds of
tile are unmistakably different at a glance.

|                      | Drawn                                        | Not drawn yet                      |
| -------------------- | -------------------------------------------- | ---------------------------------- |
| Image                | The illustration on white paper              | The collection icon, faint on grey |
| Surface, light theme | white                                        | `slate-100`                        |
| Surface, dark theme  | white paper on `slate-900`                   | `slate-900`                        |
| Caption              | Dhivehi, then English, in the text colours   | The same names, muted              |
| Interaction          | Lifts on hover, focus ring, opens the viewer | None: not interactive              |

Both names stay visible and truncate instead of wrapping. In the light theme an undrawn tile's muted
names use `slate-600`, because `slate-500` on `slate-100` reaches only 4.3:1.

The small top-left `IdBadge` is the only thing allowed over a drawing. Undrawn tiles recede: no
shading, shadow or hover. A grid with many gaps should feel quiet, so the finished drawings stand
out.

Placeholders are 512 × 512, generated from the collection icon once per theme. Their background is
the tile's grey, never white, so they cannot be mistaken for sketches on paper. Their files and
colours are in the [reference](#reference) below.

`npm run placeholders` draws both from the icon set; do not edit them by hand. A contract test
checks that both exist. At about 2.4:1 against their background, they are faint on purpose.

---

## 10. Layout — help people find their place

_P2 Show progress honestly · P3 Always say where you are · P4 One way to do each thing · P5 For
everyone, on every screen_

Design for the phone first, then let the layout widen. Nothing scrolls sideways; check at **375px**.

| Screen               | Behaviour                                                             |
| -------------------- | --------------------------------------------------------------------- |
| Below 420px          | Search is a button; opened, it takes the header row until closed      |
| Phone, below 640px   | Two-column grid                                                       |
| Below 768px          | Collections are one menu button; search shares the row                |
| Tablet, from 768px   | Collection tabs (up to four), logo and wordmark                       |
| Desktop, from 1024px | Sidebar stays visible: the collection's emblem, name and count on top |

Each region has one job: the header switches collection, view and theme; the sidebar jumps between
sections; the grid presents drawings; the viewer shows one drawing and its details.

Each section gets one heading, and it stays in view while the visitor scrolls through the section.
Do not add a second label that repeats it. The sticky heading names a section of the active view — a
month in the month view, never a family left over from another view.

The header is one row at every width. As it narrows, things give way in a fixed order, so the
current collection is always named:

1. **Collections become one menu.** Below 768px, or whenever there are more than four collections,
   the tabs become one button that names the current collection (its icon, its name, `chevronDown`)
   and opens the list of all of them. Escape or a press outside closes it.
2. **The logo goes.** Below 640px the row keeps the collection's name over the logo mark, because
   orientation matters most.
3. **Search folds into a button.** Below 420px an inline field would be too narrow to type in, so
   search is a button; opened, it takes the whole row, with a close button, until closed or left
   empty.

The view switch and the theme toggle never give way: they are icons, 36px each.

The month view runs newest first, because returning visitors want what's new. Months stay continuous
so gaps remain visible, but three or more empty months in a row fold into one disabled row, such as
`Nov 2024 – Sep 2025`.

### Search has two jobs

The dropdown is for jumping anywhere. It searches every collection, drawn or not. Each result shows
a thumbnail or a "Not drawn yet" label, highlights the match, and names the group when the group's
name is what matched. Its header gives both numbers: `10 matches, 1 drawn`.

The page filter narrows the current view to the matches and says so in its chip, in the dropdown's
words: `10 matches, 1 drawn for 'plover'` in the family view, which shows what is planned as well,
and `1 match for 'plover'` in the month view, which holds drawings only. When search narrows what
the viewer pages through, its counter says so: `1 of 1 · matching 'plover'`.

---

## 11. Empty, loading and error — never pretend

_P2 Show progress honestly · P4 One way to do each thing_

One component, `EmptyState`, handles every case. The sidebar and the main area describe the same
state and never contradict each other.

| Situation                            | Icon            | Message                                              | Next step                       |
| ------------------------------------ | --------------- | ---------------------------------------------------- | ------------------------------- |
| A collection or view has no drawings | Collection icon | "Nothing drawn yet"                                  | The planned count: "42 planned" |
| Search has no matches                | `noResults`     | "No matches for 'x'"                                 | "Clear search"                  |
| Data failed to load                  | `close`         | "Couldn't load the gallery" or "Couldn't load Birds" | The reason, and "Try again"     |
| Data is loading                      | none            | Grey placeholder rows and tiles                      | No count, no message            |

`0 of 0 drawn` is not a loading state: it claims to know what is not yet known. `noResults` belongs
to search, not to empty collections. A mostly unfinished collection says how much is done — `15 of
204 drawn`, set as `All 204 · Drawn 15` — under its name, and the count is the filter (above the
grid below 1024px). A collection with no drawings says "Nothing drawn yet" rather than showing a
wall of icons.

---

## Before a change ships

A short review of whether a change still belongs to the same design.

### Drawings first

- [ ] Is anything over a drawing other than its id badge?
- [ ] Is the accent kept for a few meaningful signals?

### Show progress honestly

- [ ] Can visitors tell drawn from undrawn in both themes?
- [ ] Do counts come from `formatCount.ts`, and stay hidden until known?
- [ ] Does every view have the right empty and loading states?

### Always say where you are

- [ ] Are the current collection, view and section named and marked?
- [ ] Do the sidebar and the main area agree?

### One way to do each thing

- [ ] Does it use the slate and accent tokens, the six type sizes, 4px spacing and the three corner
      treatments?
- [ ] Does it use the shared classes and components, with sentence-case wording?
- [ ] If a token or an icon changed, was `npm run design` run?

### For everyone, on every screen

- [ ] Does it fit at 375px without sideways scrolling, with touch targets of at least 36px?
- [ ] Does it work with the keyboard alone, with a visible focus ring and a label on every icon-only
      button?
- [ ] Does text meet 4.5:1 in both themes, with no meaning carried by colour or hover alone?

## Reference

The exact values behind the rules above. Tests check these tables against the code that draws and
measures them (`script/design/palette.ts`, `script/placeholders/draw_placeholders.ts`), so they
cannot drift.

### Ramps

| Step  | `slate-*` | `accent-*` (teal) |
| ----- | --------- | ----------------- |
| `50`  | `#f8fafc` | `#f0fdfa`         |
| `100` | `#f1f5f9` | `#cbfbf1`         |
| `200` | `#e2e8f0` | `#96f7e4`         |
| `300` | `#cad5e2` | `#46ecd5`         |
| `400` | `#90a1b9` | `#00d5be`         |
| `500` | `#62748e` | `#00bba7`         |
| `600` | `#45556c` | `#009689`         |
| `700` | `#314158` | `#00786f`         |
| `800` | `#1d293d` | `#005f5a`         |
| `900` | `#0f172b` | `#0b4f4a`         |
| `950` | `#020618` | `#022f2e`         |

### Placeholder files

| Theme | File             | Background              | Icon                    |
| ----- | ---------------- | ----------------------- | ----------------------- |
| Light | `<id>.webp`      | `slate-100` (`#f1f5f9`) | `#a1a1a1`               |
| Dark  | `<id>-dark.webp` | `slate-900` (`#0f172b`) | `slate-600` (`#45556c`) |

---

_Let the drawings speak. Let the interface be clear. Let the rules serve the work._
