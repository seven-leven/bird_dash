// Live sections in the docs: on GitHub a page shows a plain table; on the docs site the
// same place shows a component that draws the real thing (the accent ramps from the CSS,
// the icons from the registry). The page marks the section:
//
//   <!-- live: AccentRamps -->
//   | Step | ... the table GitHub shows ... |
//   <!-- /live -->
//
// and the site swaps everything between the markers for <AccentRamps />.

const BLOCK = /<!-- live: (\w+) -->[\s\S]*?<!-- \/live -->/g;

/** The page's Markdown with every live section replaced by its component. */
export function liveBlocks(source: string): string {
  return source.replace(BLOCK, (_, name: string) => `<${name} />`);
}

/** The components a page asks for, in order (to check each one exists). */
export function liveNames(source: string): string[] {
  return [...source.matchAll(BLOCK)].map((m) => m[1]);
}
