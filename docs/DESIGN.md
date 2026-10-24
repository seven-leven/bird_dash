# Design guide

How Wildlife Illustrated looks, and the rules that keep it looking that way. Read this before adding
a button, a colour or an icon.

![Design guide](assets/design-guide.png)

The picture is drawn from the real tokens and icons by `npm run design`. The tokens themselves live
in [`src/styles/main.css`](../src/styles/main.css); that file is the source of truth, and this page
explains how to use it.

## Principles

Five principles, and every rule on this page follows from one of them. Each rule names its principle
in brackets, as **(P1)** to **(P5)**, so you can work backwards from any rule to why it exists. When
a case is not covered here, decide it from the principles; when a rule seems wrong for a case, check
it against its principle, and change the rule rather than bend the principle.

### P1. Drawings first

The illustrations carry the colour; the interface stays grey and quiet, so a drawing is always the
most colourful thing on the screen. **Nothing is laid over a drawing** except its small id badge:
names, counts and controls sit beside or below it. When a choice is unclear, pick the option that
draws less attention to the interface.

### P2. Show progress honestly

The site is a record of work in progress. **A drawing and a gap never look alike:** what has been
drawn is shown on paper (white), what has not is shown faint on the interface's own grey. Every
count means exactly what it says, and none is shown before it is known.

### P3. Always say where you are

The current collection, view, section and drawing are always named and marked: by the accent, by the
current-item style, by a heading that stays in view. A visitor can always tell where they are and
how they got there, and a link can always take them back.

### P4. One way to do each thing

The same tokens, components and words everywhere, so the site reads as one piece of work. A new need
is met with what exists before anything new is added; when something new is needed, it becomes the
one way from then on.

### P5. For everyone, on every screen

Phone first, both themes, keyboard and touch, readable contrast, reduced motion, and Thaana as well
as English. Nothing a visitor needs is hidden behind hover or carried by colour alone.

## 1. Colour

_Serves P1 drawings first, P3 where you are, P5 for everyone._

Two ramps and nothing else: **slate** for every neutral, and **accent** for emphasis. Use the names
(`slate-500`, `accent-700`), never a hex value or a specific hue (`teal-500`) in a component.

**Each collection has its own accent,** (P3) so the colour also tells you where you are: birds are
teal, sharks blue, shells rose. A collection names its hue with `accent` in
`public/collections.json`; the menu of allowed hues is in `main.css`, and has more than are in use
so a new collection can pick one without touching the CSS:

| Hue     | White on 700 (button) | 500 on white (marker, ring) | Used by |
| ------- | --------------------- | --------------------------- | ------- |
| teal    | 5.5:1                 | 2.5:1                       | Birds   |
| emerald | 5.5:1                 | 2.5:1                       | free    |
| cyan    | 5.4:1                 | 2.4:1                       | free    |
| sky     | 5.9:1                 | 2.8:1                       | free    |
| blue    | 6.7:1                 | 3.7:1                       | Sharks  |
| indigo  | 7.9:1                 | 4.5:1                       | free    |
| violet  | 7.1:1                 | 4.2:1                       | free    |
| purple  | 7.0:1                 | 4.0:1                       | free    |
| fuchsia | 6.3:1                 | 3.5:1                       | free    |
| pink    | 6.0:1                 | 3.5:1                       | free    |
| rose    | 6.3:1                 | 3.7:1                       | Shells  |
| orange  | 5.2:1                 | 2.8:1                       | free    |

A hue is on the menu only if white text on its 700 shade is at least 4.5:1 **and** its 500 shade is
no paler against white than teal's (2.4:1 or more), because that shade draws the current marker and
the focus ring. A test checks every hue on the menu against both numbers. Amber, yellow, lime and
green are left out for being too pale at 500 (1.9 to 2.3:1); red is left out because it reads as an
error. Pick neighbours that are easy to tell apart: not rose and pink, or violet and purple, for two
collections that sit side by side.

| Role                                 | Light                    | Dark                     |
| ------------------------------------ | ------------------------ | ------------------------ |
| Page background                      | `slate-50`               | `slate-950`              |
| Surface (header, sidebar, menus)     | `white`                  | `slate-950` / `900`      |
| Text                                 | `slate-900` / `800`      | `slate-100`              |
| Muted text (use `.text-muted`)       | `slate-500`              | `slate-400`              |
| Borders and dividers                 | `slate-200` / `100`      | `slate-800`              |
| Focus ring, current marker, progress | `accent-500`             | `accent-500`             |
| Primary button                       | `accent-700`, white      | `accent-700`, white      |
| Viewer titles (`.viewer-title`)      | `slate-900`              | `white`                  |
| Viewer body (`.viewer-body`)         | `slate-600`              | `white/70`               |
| Viewer labels (`.viewer-label`)      | `slate-500`              | `white/50`               |
| Id badge on a drawing                | `white/70` on `black/50` | `white/70` on `black/50` |

Rules:

- **The accent is rare.** (P1) It marks keyboard focus, the current item, progress, a search match
  and the one primary button. If the accent appears in more than a few places on a screen, something
  is wrong.
- **Never use colour alone to say something.** (P5) The current tab has a fill and bolder text as
  well as a teal marker, so it still reads for someone who cannot tell teal from grey.
- **Check contrast for any new text colour.** (P5) Body text needs at least 4.5:1 against its
  background (WCAG AA); large text and icons need 3:1. The pairs in use measure:

  | Pair                                 | Ratio  |
  | ------------------------------------ | ------ |
  | `slate-900` on white                 | 17.9:1 |
  | `slate-500` on white (muted)         | 4.8:1  |
  | `slate-100` on `slate-950`           | 18.4:1 |
  | `slate-400` on `slate-950` (muted)   | 7.9:1  |
  | white on `accent-700` (button)       | 5.5:1  |
  | white at 70% on black (viewer body)  | 10.0:1 |
  | white at 50% on black (viewer label) | 5.3:1  |
  | `slate-600` on white (viewer body)   | 7.6:1  |

  `accent-500` on white is only 2.5:1, so it is fine for a marker or ring but **not for text**; teal
  text on a light background must be `accent-700`. `slate-400` on white also fails for text.
- **The viewer follows the theme too** (P5): a light page opens a light viewer. Its text uses the
  three `.viewer-*` roles, which carry both themes, never a raw `white/70`.
- **Every colour has a dark-mode partner.** (P5) Write both (`text-slate-500 dark:text-slate-400`)
  or use a class that already does (`.text-muted`, `.btn-ghost`, `.nav-item`).

## 2. Type

_Serves P4 one way, P5 for everyone._

The system sans-serif for everything, and **Faruma** (`.font-dhivehi`, with `dir="rtl"`) for Thaana
script. Six sizes; do not add another or write a pixel size by hand.

| Token        | Size | Used for                                       |
| ------------ | ---- | ---------------------------------------------- |
| `text-2xl`   | 24px | Dhivehi title in the viewer                    |
| `text-xl`    | 20px | English title in the viewer                    |
| `text-base`  | 16px | Section headings, sidebar title, Dhivehi names |
| `text-sm`    | 14px | Controls, body text, English names on tiles    |
| `text-xs`    | 12px | Counts, secondary lines                        |
| `text-micro` | 11px | Labels (`.caps-label`), badges, keyboard hints |

Rules:

- **Weight shows importance, not size alone:** (P4) `font-semibold` for titles and headings,
  `font-medium` for controls, regular for everything else.
- **Numbers that change or line up** (P4) (counts, ids, zoom) get `tabular-nums` so they do not
  jiggle.
- **Scientific names are italic.** (P4) Ids are monospace (`IdBadge`).
- **Name order is fixed:** (P4) Dhivehi name first when there is one, then English, then scientific
  — on tiles and in the viewer. Search results lead with English, because that is what is typed.
- **Names are always visible.** (P5) A tile shows its Dhivehi and English names on every device;
  nothing needed to identify a drawing is hidden behind hover, which touch screens do not have. The
  scientific name can wait for the viewer.
- **Thaana is set one step larger** (P5) than the English beside it (`text-base` next to `text-sm`):
  Faruma reads small at the same size.
- **Long names truncate** (P4) (`truncate`) instead of wrapping and pushing the layout around.

## 3. Wording

_Serves P2 honest progress, P3 where you are, P4 one way._

- **Counts** (P2) come from [`src/lib/formatCount.ts`](../src/lib/formatCount.ts); do not write one
  by hand. Which form depends on what the view holds:

  | The view holds                      | Heading or summary                 | Sidebar pill |
  | ----------------------------------- | ---------------------------------- | ------------ |
  | Drawn and undrawn items (by family) | "4 of 8 drawn" (`drawnOf`)         | "4 of 8"     |
  | Only drawn items (by date)          | "2 drawings" (`drawings`)          | "2"          |
  | Search results                      | "1 result" / "10 matches, 1 drawn" | none         |

  The forms differ on purpose: "of 8" only means something where there is a total to be drawn.
- **A reference to another drawing is a link to it.** (P3) "See note for #11 (Greater Flamingo)"
  links to `#birds/011`, so it opens that drawing like any deep link.
- **Sentence case** (P4) for buttons, labels and headings ("Clear search", not "Clear Search"). The
  small uppercase labels are styled that way by `.caps-label`; write them in sentence case in the
  markup.
- **Say what a control does** (P5) in its `aria-label` and tooltip ("Switch to dark mode"),
  especially for icon-only buttons.

## 4. Shape and spacing

_Serves P1 drawings first, P4 one way._

- **Corners:** (P4) `rounded-control` (6px) for buttons, inputs and badges; `rounded-card` (12px)
  for tiles, panels and menus; `rounded-full` for count pills and the progress bar. Nothing else.
- **Spacing moves in steps of 4px** (P4) (Tailwind's `1` = 4px). The common values are
  `gap-1.5`/`gap-2` inside a control, `px-3 py-1.5` for a control's padding, `gap-3` to `gap-6`
  between tiles, and `p-4` (phone) or `p-6` for page padding. Related things sit closer together
  than unrelated things.
- **Borders before shadows.** (P1) Surfaces are separated by a 1px border. Shadows are for things
  that float above the page: menus, the open sidebar on a phone, a hovered tile.
- **Tiles are square** (P1) and images are never cropped (`object-contain`).

## 5. States

_Serves P3 where you are, P4 one way, P5 for everyone._

Every interactive thing needs all of these, and they look the same everywhere:

| State    | Look                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| Default  | Muted text, no fill                                                                  |
| Hover    | Light grey fill, darker text                                                         |
| Current  | Grey fill, strong text, teal marker (`.nav-item` with `aria-current`/`aria-pressed`) |
| Focus    | 2px teal ring (`.focus-ring`), for keyboard users only                               |
| Disabled | Faded text, no hover, `cursor-not-allowed`                                           |

Rules:

- **Use the shared classes** (P4) instead of re-typing styles: `.btn-ghost` for an icon or text
  button, `.nav-item` for one choice among several, `.count-pill`, `.kbd-hint`, `.caps-label`.
- **"Current" is set with ARIA, not a class.** (P3) `.nav-item` styles itself from `aria-current` or
  `aria-pressed`, so what is shown and what a screen reader hears cannot disagree.
- **If it looks clickable, it must do something.** (P4) Undrawn tiles are not buttons, so they have
  no pointer cursor, hover lift or tab stop.
- **Never remove a focus ring** (P5) without replacing it.
- **Touch targets are at least 36px** (P5) on phones, with 8px between neighbours.

## 6. Motion

_Serves P1 drawings first, P4 one way, P5 for everyone._

Two speeds: `duration-fast` (150ms) for hover and colour changes, `duration-slow` (300ms) for things
that move, such as the sidebar. **A theme switch is a colour change:** (P4) every part of the page,
header included, changes together at `duration-fast`, so no region lags behind the rest. Motion
should explain a change, not decorate it (P1). The site honours the "reduce motion" system setting
(P5), which turns transitions and smooth scrolling off.

## 7. Logo

_Serves P4 one way._

![Logo](assets/logo.png)

The logo is a bird perched on the open edge of an unfinished frame: a page corner with one side
missing, and the bird looking out of it. It is drawn with the same round 2px stroke as the icons, so
the logo and the interface share one hand. The bird is an outline of a perching bird (back, tail,
breast, wing, legs); the `bird` icon used for the collection tab and the placeholders is the same
bird redrawn at the 24px icon grid. The tile is the same drawing reversed onto a solid square, not a
second design. The source is [`src/lib/logo.ts`](../src/lib/logo.ts); `<LogoMark />` draws it, and
`npm run design` writes the files in [`docs/assets/logo/`](assets/logo/).

| Version               | Use it for                                             | File                              |
| --------------------- | ------------------------------------------------------ | --------------------------------- |
| **Mark**              | The default, 20px and up                               | `logo/mark.svg`, `mark-white.svg` |
| **Tile**              | Small or busy places: favicon, app icon, avatar        | `logo/tile.svg`, `tile-512.png`   |
| **Horizontal lockup** | The header, and anywhere wide: mark, then the wordmark | built in the page                 |
| **Stacked**           | Square spaces and title cards                          | built in the page                 |

Rules:

- **Colour:** (P4) `slate-900` on light, white on dark. Never an accent colour: the accent changes
  with the collection, and the logo must not.
- **Wordmark:** (P4) "Wildlife" in semibold, "Illustrated" in light, in the system sans-serif,
  sentence case, with slightly tight letter-spacing. The second word is muted (`slate-500` /
  `slate-400`).
- **Size:** (P4) the mark down to 20px; below that use the tile, whose solid shape survives where
  the open frame would break up.
- **Clear space:** (P4) keep half the mark's width empty on every side.
- **Don't** (P4) close the frame, move the bird off its line, fill the mark, stretch or rotate it,
  add a shadow, or set the wordmark in another font or in capitals.

The browser-tab icon is still one of the drawings (`public/favicon.png`). To use the logo there
instead, replace it with `docs/assets/logo/tile-512.png`.

## 8. Icons

_Serves P4 one way, P5 for everyone._

Every icon lives in [`src/lib/icons.ts`](../src/lib/icons.ts) and is drawn by `<Icon name="…" />`.
The only other SVG in the project is the logo, in the same folder. See
[`icons.png`](assets/icons.png).

The registry is grouped by purpose, and the file, the sheet and this guide all follow the same
order: **Collections** (bird, shark, shell), **Views** (taxonomy, calendar), **Search** (search,
noResults), **Navigation** (menu, chevrons, close, externalLink), **Viewer** (zoomIn, zoomOut,
reset), **Theme** (sun, moon), **Labels** (tag, image, commit, layers, pencil, languages, book),
**Keyboard** (arrowsUpDown, enter, command), **Principles** (easel, progress, pin, grid, person: one
for each principle above, drawn in the guide image) and **Brand** (github). A new icon goes into one
of the groups in `ICON_GROUPS`; a test fails if it is left out.

**Label icons** (P4) go before a label or a figure, at 12px, in the same colour as the text (the
`.with-icon` class). Each has one meaning, used everywhere: `tag` is the version, `image` a count of
drawings, `commit` the build's commit, `layers` all collections together, `pencil` the illustrator
or "drawn", `languages` a name in another language, `book` further reading. They are decoration next
to text, never a replacement for it, so they are hidden from screen readers.

**Use an icon, not a Unicode symbol,** (P4) for arrows, the return key, ticks and crosses (↑ ↓ ↵ ✓
✕). Those characters come from whatever font the visitor has, so their size, weight and even shape
change from machine to machine. Plain words on a key cap ("esc", "Ctrl K") stay as text.

To add one, match the set:

- 24 × 24 grid, drawn to fill most of it; keep about 1.5px clear of the edge.
- 2px stroke, round ends and joins, **no fills** (a dot is a zero-length line: `M16 7h.01`).
- One or two bold shapes. If it needs more than about five strokes, simplify it.
- It must still read at 16px. Check with `npm run design` and look at `docs/assets/icons.png`.
- **Brand marks are the exception.** (P4) Another organisation's logo (GitHub's, in the footer) is
  shown exactly as its owner publishes it, solid fill included, and marked `filled` in the registry.
  Do not redraw a brand mark in our line style: it is not ours to change, and most brands forbid it.
  Show it in one colour, next to the brand's name.
- Colour comes from the text colour (`currentColor`); size from `w-4 h-4` (16px) in controls or `w-5
  h-5`/`w-6 h-6` for standalone use.
- An icon-only button always has an `aria-label`.

Collections name their icon in `public/collections.json` (`"icon": "bird"`).

## 9. Tiles and placeholders

_Serves P1 drawings first, P2 honest progress._

A tile is a square image with its names in a **caption below it**, never on top of it. The two kinds
of tile differ in every respect that can be seen at a glance:

|                   | Drawn                                            | Not drawn yet                                    |
| ----------------- | ------------------------------------------------ | ------------------------------------------------ |
| Image             | The drawing, on white paper                      | The collection's icon, faint, on the tile's grey |
| Tile surface      | White (light), white paper on `slate-900` (dark) | `slate-100` (light), `slate-900` (dark)          |
| Caption           | Dhivehi then English, in text colours            | The same names in muted text                     |
| Hover, focus, tab | Lifts, ring, is a button (opens the viewer)      | None: it is not interactive                      |

- **The caption sits under the image** (P1), Dhivehi name first, English below, both always shown
  and truncated rather than wrapped. On an undrawn tile in the light theme the muted name is
  `slate-600`, because `slate-500` on `slate-100` (4.3:1) falls short of 4.5:1.
- **The id badge** (P1) (`IdBadge`, top-left) is the one thing allowed on the image.
- **Undrawn tiles recede:** (P2) no shading, no shadow, no hover. A grid that is mostly gaps should
  look quiet, with the few drawings standing out.

An item that is not drawn yet shows its collection's icon, 512 × 512, drawn once per theme. The
background is the tile's grey, **not white**, so a placeholder can never be mistaken for a sketch on
paper:

| Theme | File             | Background            | Icon                  |
| ----- | ---------------- | --------------------- | --------------------- |
| Light | `<id>.webp`      | `slate-100` (#f1f5f9) | `#a1a1a1`             |
| Dark  | `<id>-dark.webp` | `slate-900` (#0f172a) | `slate-600` (#475569) |

`npm run placeholders` draws both from the icon set, so they never need editing by hand, and the
contract test fails if either is missing. They are deliberately faint (about 2.4:1 against their
background in both themes): a placeholder should recede next to a real drawing.

## 10. Layout

_Serves P2 honest progress, P3 where you are, P4 one way, P5 for everyone._

- **Breakpoints:** (P5) phone below 640px (two-column grid, search on its own row), tablet from
  768px (single-row header), desktop from 1024px (sidebar always visible).
- **Design the phone layout first,** (P5) then let it widen. Nothing may scroll sideways; check at
  375px.
- **One job per region:** (P4) the header switches collection, view and theme; the sidebar jumps
  between sections; the grid shows drawings; the viewer shows one drawing and its details.
- **One heading per section.** (P3) A section's heading is also what sticks to the top while you
  scroll through it; there is no second label repeating it. The sticky heading always names the
  section in view, in the current view (a month in the date view, never a family left over from the
  other).
- **On phones the header still says where you are:** (P3) the current collection's name beside its
  icon; the other collections are icons alone (each with an `aria-label`). The logo mark returns
  from 640px: at 375px the row holds only one of the two, and the name is the one that orients.
- **The date view reads newest first:** (P2) it is where a returning visitor looks for what is new.
  Months stay continuous so the gaps show, but a run of three or more empty months folds into one
  disabled row ("Nov 2024 – Sep 2025").
- **Search has two parts with two jobs,** (P3) and their counts must not be confused:
  - the **dropdown** jumps anywhere: every collection, drawn or not. Each result shows the drawing's
    thumbnail, or marks it "not drawn yet", and highlights what matched; a match on the group name
    names the group. Its header gives both numbers ("10 matches, 1 drawn").
  - the **page filter** narrows the current view to drawn matches, and says so in its chip ("1
    result for 'plover'").
- **The viewer says what it is paging through.** (P3) When a search narrows it, the counter says so
  ("1 of 1 · matching 'plover'").

## 11. Empty, loading and error states

_Serves P2 honest progress, P4 one way._

One component (`EmptyState`) and four situations, each always worded and drawn the same way. The
sidebar and the main area show the same situation, never two different messages.

| Situation                             | Icon                  | Title                                                                     | Then                          |
| ------------------------------------- | --------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| A collection or view with no drawings | the collection's icon | "Nothing drawn yet"                                                       | "42 planned", from the counts |
| A search that matches nothing         | `noResults`           | "No matches for 'x'"                                                      | a "Clear search" button       |
| Data that failed to load              | `close`               | "Couldn't load the gallery" (or "Couldn't load Birds" for one collection) | the reason, and "Try again"   |
| Still loading                         | none                  | none: grey placeholder rows and tiles                                     | —                             |

- **Never show a count before it is known.** (P2) While loading, the sidebar shows placeholder rows
  like the grid does; "0 of 0 drawn" is a real answer and must not appear as a stand-in.
- **`noResults` means a search** (P4) and nothing else. An empty collection is not a failed search.
- **A collection that is mostly gaps** (P2) says so above the grid ("15 of 204 drawn") and offers to
  show drawn items only; a collection with none shows "Nothing drawn yet" instead of a wall of
  icons.

## Checklist for a UI change

Grouped by principle; a "no" means the change breaks the principle it is listed under.

**P1 Drawings first**

- Is anything laid over a drawing other than its id badge?
- Is the accent in only a few places on the screen?

**P2 Show progress honestly**

- Can a visitor tell drawn from not-drawn at a glance, in both themes?
- Are counts worded by `formatCount.ts`, and none shown before it is known?
- Does every view have its empty and loading state from section 11?

**P3 Always say where you are**

- Is the current collection, view and section named and marked?
- Do the sidebar and the main area agree?

**P4 One way to do each thing**

- Does it use only slate and accent, by name, the type scale, the 4px steps and the three corners?
- Does it use the shared classes and components, and sentence case?
- If you added an icon or changed a token, did you run `npm run design`?

**P5 For everyone, on every screen**

- Does it fit at 375px wide without sideways scrolling, with 36px touch targets?
- Does it work with the keyboard alone, with a visible focus ring, and does every icon-only button
  have a label?
- Does text meet 4.5:1 contrast in both themes, with nothing carried by colour or hover alone?
