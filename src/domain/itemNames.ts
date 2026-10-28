import { dhivehiNames } from './dhivehiNames.ts';

/** The language a name is written in: Dhivehi (Thaana), English, or Latin. */
export type NameLang = 'dv' | 'en' | 'la';

/**
 * What a name is for, which decides where and how it is shown:
 * - `title`  — the item's main name, shown first and largest (the first Dhivehi
 *              name when there is one, otherwise the English name);
 * - `also`   — a further name in the title's language ("also Kulhee Kukulhu");
 * - `common` — the English name, when a Dhivehi name heads the item;
 * - `latin`  — the scientific name.
 */
export type NameRole = 'title' | 'also' | 'common' | 'latin';

export interface ItemName {
  text: string;
  lang: NameLang;
  role: NameRole;
  /** How to say a Dhivehi name, in Latin letters, when the list gives it. */
  roman?: string | undefined;
}

/** The name fields a list entry may carry (`public/lists/<id>.json`). */
export interface NameFields {
  name?: string;
  sci?: string;
  dhiv?: string | undefined;
  dhiv_script?: string | undefined;
}

/**
 * Every name an item has, in display order: Dhivehi names first (the first is the
 * title, any others are "also"), then English, then Latin. Components render this
 * list and never read the name fields themselves, so an item with other names (a
 * piece in a series: a title and no scientific name) needs no component change.
 */
export function buildNames(fields: NameFields): ItemName[] {
  const names: ItemName[] = [];
  for (const { script, roman } of dhivehiNames(fields.dhiv_script ?? '', fields.dhiv ?? '')) {
    const role = names.length ? 'also' : 'title';
    names.push(
      roman ? { text: script, lang: 'dv', role, roman } : { text: script, lang: 'dv', role },
    );
  }
  const english = (fields.name ?? '').trim();
  if (english) names.push({ text: english, lang: 'en', role: names.length ? 'common' : 'title' });
  const latin = (fields.sci ?? '').trim();
  if (latin) names.push({ text: latin, lang: 'la', role: 'latin' });
  return names;
}

/** Every word a search should find the item by: each name and each romanisation. */
export const nameWords = (names: readonly ItemName[]): string[] =>
  names.flatMap((n) => (n.roman ? [n.text, n.roman] : [n.text]));

/** One line of names: every name in one language, joined with " / ". */
export interface NameLine {
  text: string;
  lang: NameLang;
}

/**
 * The names as lines, one per language in the order the languages first appear: the
 * compact form a grid tile or a search result shows ("ވަލު ކުކުޅު / ކުލީ ކުކުޅު", then
 * "White-breasted Waterhen", then the Latin).
 */
export function nameLines(names: readonly ItemName[]): NameLine[] {
  const lines: NameLine[] = [];
  for (const { text, lang } of names) {
    const line = lines.find((l) => l.lang === lang);
    if (line) line.text += ` / ${text}`;
    else lines.push({ text, lang });
  }
  return lines;
}
