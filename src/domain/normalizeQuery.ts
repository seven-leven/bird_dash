/**
 * The one definition of how a search query is compared against `searchText`
 * (which is stored lowercased): trimmed and lowercased.
 */
export const normalizeQuery = (query: string): string => query.trim().toLowerCase();
