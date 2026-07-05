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
      const escapedQuery = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cachedRegex = new RegExp(`(${escapedQuery})`, 'gi');
    }

    return escapeHtml(text).replace(cachedRegex!, `${MARK_OPEN}$1${MARK_CLOSE}`);
  }

  return { highlightText };
}
