const MARK_OPEN =
  '<mark class="bg-accent-200/80 dark:bg-accent-500/30 text-inherit rounded-[2px] px-[1px]">';
const MARK_CLOSE = '</mark>';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function useSearchHighlight() {
  // Compile the match regex once per distinct query instead of per field per
  // render (highlightText is called for name, sci-name, and id of every result).
  let cachedQuery = '';
  let cachedRegex: RegExp | null = null;

  function highlightText(text: string, query: string): string {
    const q = query.trim();
    if (!q) return escapeHtml(text);

    if (q !== cachedQuery) {
      cachedQuery = q;
      cachedRegex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    }

    // Match against the RAW text and escape each piece afterwards. Matching the
    // already-escaped text would let a query like "g" land inside "&gt;" and
    // split the entity, which a browser then shows literally. With one capture
    // group, split() puts the matches at the odd indices.
    return text
      .split(cachedRegex!)
      .map((part, i) => i % 2 ? `${MARK_OPEN}${escapeHtml(part)}${MARK_CLOSE}` : escapeHtml(part))
      .join('');
  }

  return { highlightText };
}
