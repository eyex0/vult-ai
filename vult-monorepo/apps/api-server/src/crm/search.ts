import { phoneticKey, tokens } from '@vult/arabic';

/**
 * The words a record is found by: each word folded for Arabic and Latin (diacritics, hamza forms, case), plus a
 * `~key` per word that is the same for every spelling of a name (محمد, Mohamed, Muhammad → ~mhmd). Stored in
 * `search_text` and indexed with pg_trgm, so search stays a single indexed scan at volume.
 */
export function searchTextOf(...parts: (string | null | undefined)[]): string {
  const words = tokens(parts.filter(Boolean).join(' '));
  const keys = words.map(phoneticKey).filter((k) => k.length >= 2).map((k) => `~${k}`);
  return [...new Set([...words, ...keys])].join(' ').slice(0, 4000);
}

/** Every query word must match: inside a folded word, or at the start of a word's spelling key. */
export function searchConditions(q: string) {
  return tokens(q)
    .slice(0, 8)
    .map((word) => {
      const key = phoneticKey(word);
      const or: { searchText: { contains: string } }[] = [{ searchText: { contains: word } }];
      if (key.length >= 2) or.push({ searchText: { contains: `~${key}` } });
      return { OR: or };
    });
}
