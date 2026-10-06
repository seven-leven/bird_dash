# Design guide

How Wildlife Illustrated looks, and the rules that keep it looking that way. Read this before adding
a button, a colour or an icon.

![Design guide](design-guide.png)

The picture is drawn from the real tokens and icons by `deno task design`. The tokens themselves
live in [`src/assets/main.css`](../src/assets/main.css); that file is the source of truth, and this
page explains how to use it.

## The one idea

**The illustrations carry the colour. Everything around them stays quiet.** The interface is grey
with a single teal accent, so a drawing is always the most colourful thing on the screen. When a
choice is unclear, pick the option that draws less attention to the interface.

## 1. Colour

Two ramps and nothing else: **slate** for every neutral, and **accent** for emphasis. Use the names
(`slate-500`, `accent-700`), never a hex value or a specific hue (`teal-500`) in a component.

**Each collection has its own accent,** so the colour also tells you where you are: birds are teal,
sharks blue, shells rose. A collection names its hue with `accent` in `public/collections.json`; the
menu of allowed hues (teal, emerald, blue, indigo, violet, rose) is in `main.css`. Every hue on the
menu passes the contrast checks below; yellow, amber and lime are left out because white text on
them does not.

| Role                                  | Light               | Dark                |
| ------------------------------------- | ------------------- | ------------------- |
| Page background                       | `slate-50`          | `slate-950`         |
| Surface (header, sidebar, menus)      | `white`             | `slate-950` / `900` |
| Text                                  | `slate-900` / `800` | `slate-100`         |
| Muted text (use `.text-muted`)        | `slate-500`         | `slate-400`         |
| Borders and dividers                  | `slate-200` / `100` | `slate-800`         |
| Focus ring, current marker, progress  | `accent-500`        | `accent-500`        |
| Primary button                        | `accent-700`, white | `accent-700`, white |
| On imagery and in the viewer (titles) | `white`             | `white`             |
| On imagery and in the viewer (body)   | `white/70`          | `white/70`          |
| On imagery and in the viewer (labels) | `white/50`          | `white/50`          |

Rules:

- **The accent is rare.** It marks keyboard focus, the current item, progress, a search match and
  the one primary button. If the accent appears in more than a few places on a screen, something is
  wrong.
- **Never use colour alone to say something.** The current tab has a fill and bolder text as well as
  a teal marker, so it still reads for someone who cannot tell teal from grey.
- **Check contrast for any new text colour.** Body text needs at least 4.5:1 against its background
  (WCAG AA); large text and icons need 3:1. The pairs in use measure:

  | Pair                                 | Ratio  |
  | ------------------------------------ | ------ |
  | `slate-900` on white                 | 17.9:1 |
  | `slate-500` on white (muted)         | 4.8:1  |
  | `slate-100` on `slate-950`           | 18.4:1 |
  | `slate-400` on `slate-950` (muted)   | 7.9:1  |
  | white on `accent-700` (button)       | 5.5:1  |
  | white at 70% on black (viewer body)  | 10.0:1 |
  | white at 50% on black (viewer label) | 5.3:1  |

  `accent-500` on white is only 2.5:1, so it is fine for a marker or ring but **not for text**; teal
  text on a light background must be `accent-700`. `slate-400` on white also fails for text.
- **Every colour has a dark-mode partner.** Write both (`text-slate-500 dark:text-slate-400`) or use
  a class that already does (`.text-muted`, `.btn-ghost`, `.nav-item`).

## 2. Type

The system sans-serif for everything, and **Faruma** (`.font-dhivehi`, with `dir="rtl"`) for Thaana
script. Six sizes; do not add another or write a pixel size by hand.

| Token        | Size | Used for                                       |
| ------------ | ---- | ---------------------------------------------- |
| `text-2xl`   | 24px | Dhivehi title in the viewer                    |
| `text-xl`    | 20px | English title in the viewer                    |
| `text-base`  | 16px | Section headings, sidebar title                |
| `text-sm`    | 14px | Controls, body text, tile titles               |
| `text-xs`    | 12px | Counts, secondary lines                        |
| `text-micro` | 11px | Labels (`.caps-label`), badges, keyboard hints |

Rules:

- **Weight shows importance, not size alone:** `font-semibold` for titles and headings,
  `font-medium` for controls, regular for everything else.
- **Numbers that change or line up** (counts, ids, zoom) get `tabular-nums` so they do not jiggle.
- **Scientific names are italic.** Ids are monospace (`IdBadge`).
- **Name order is fixed:** Dhivehi name first when there is one, then English, then scientific — on
  tiles and in the viewer. Search results lead with English, because that is what is typed.
- **Long names truncate** (`truncate`) instead of wrapping and pushing the layout around.

## 3. Wording

- **Counts** come from [`src/lib/formatCount.ts`](../src/lib/formatCount.ts): "15 of 204 drawn", "4
  of 8", "18 drawings", "1 result". Do not write a count by hand.
- **Sentence case** for buttons, labels and headings ("Clear search", not "Clear Search"). The small
  uppercase labels are styled that way by `.caps-label`; write them in sentence case in the markup.
- **Say what a control does** in its `aria-label` and tooltip ("Switch to dark mode"), especially
  for icon-only buttons.

## 4. Shape and spacing

- **Corners:** `rounded-control` (6px) for buttons, inputs and badges; `rounded-card` (12px) for
  tiles, panels and menus; `rounded-full` for count pills and the progress bar. Nothing else.
- **Spacing moves in steps of 4px** (Tailwind's `1` = 4px). The common values are `gap-1.5`/`gap-2`
  inside a control, `px-3 py-1.5` for a control's padding, `gap-3` to `gap-6` between tiles, and
  `p-4` (phone) or `p-6` for page padding. Related things sit closer together than unrelated things.
- **Borders before shadows.** Surfaces are separated by a 1px border. Shadows are for things that
  float above the page: menus, the open sidebar on a phone, a hovered tile.
- **Tiles are square** and images are never cropped (`object-contain`).

## 5. States

Every interactive thing needs all of these, and they look the same everywhere:

| State    | Look                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| Default  | Muted text, no fill                                                                  |
| Hover    | Light grey fill, darker text                                                         |
| Current  | Grey fill, strong text, teal marker (`.nav-item` with `aria-current`/`aria-pressed`) |
| Focus    | 2px teal ring (`.focus-ring`), for keyboard users only                               |
| Disabled | Faded text, no hover, `cursor-not-allowed`                                           |

Rules:

- **Use the shared classes** instead of re-typing styles: `.btn-ghost` for an icon or text button,
  `.nav-item` for one choice among several, `.count-pill`, `.kbd-hint`, `.caps-label`.
- **"Current" is set with ARIA, not a class.** `.nav-item` styles itself from `aria-current` or
  `aria-pressed`, so what is shown and what a screen reader hears cannot disagree.
- **If it looks clickable, it must do something.** Undrawn tiles are not buttons, so they have no
  pointer cursor, hover lift or tab stop.
- **Never remove a focus ring** without replacing it.
- **Touch targets are at least 36px** on phones, with 8px between neighbours.

## 6. Motion

Two speeds: `duration-fast` (150ms) for hover and colour changes, `duration-slow` (300ms) for things
that move, such as the sidebar. Motion should explain a change, not decorate it. The site honours
the "reduce motion" system setting, which turns transitions and smooth scrolling off.

## 7. Icons

Every icon lives in [`src/components/icons/icons.ts`](../src/components/icons/icons.ts) and is drawn
by `<Icon name="…" />`. There is no SVG markup anywhere else. See [`icons.png`](icons.png).

To add one, match the set:

- 24 × 24 grid, drawn to fill most of it; keep about 1.5px clear of the edge.
- 2px stroke, round ends and joins, **no fills** (a dot is a zero-length line: `M16 7h.01`).
- One or two bold shapes. If it needs more than about five strokes, simplify it.
- It must still read at 16px. Check with `deno task design` and look at `docs/icons.png`.
- Colour comes from the text colour (`currentColor`); size from `w-4 h-4` (16px) in controls or
  `w-5 h-5`/`w-6 h-6` for standalone use.
- An icon-only button always has an `aria-label`.

Collections name their icon in `public/collections.json` (`"icon": "bird"`).

## 8. Placeholders

An item that is not drawn yet shows its collection's icon in `#a1a1a1` on white, 512 × 512.
`deno task placeholders` draws them from the icon set, so they never need editing by hand. They are
deliberately faint: a placeholder should recede next to a real drawing.

## 9. Layout

- **Breakpoints:** phone below 640px (two-column grid, search on its own row), tablet from 768px
  (single-row header), desktop from 1024px (sidebar always visible).
- **Design the phone layout first,** then let it widen. Nothing may scroll sideways; check at 375px.
- **One job per region:** the header switches collection, view and theme; the sidebar jumps between
  sections; the grid shows drawings; the viewer shows one drawing and its details.

## Checklist for a UI change

1. Does it use only slate and accent, by name, with a dark-mode partner?
2. Is every size from the six-step type scale and the 4px spacing steps?
3. Are corners `rounded-control`, `rounded-card` or `rounded-full`?
4. Does it have hover, focus, current and disabled states, using the shared classes?
5. Does it work with the keyboard alone, and does every icon-only button have a label?
6. Does text meet 4.5:1 contrast in both themes?
7. Does it fit at 375px wide without sideways scrolling, with 36px touch targets?
8. Are counts worded by `formatCount.ts`, and labels in sentence case?
9. If you added an icon or changed a token, did you run `deno task design`?
