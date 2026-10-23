import type { Cents } from './types.js';

export interface SubsetQuery {
  items: { id: string; amount: Cents }[];
  /** Inclusive bounds for the subset total. */
  lo: Cents;
  hi: Cents;
  maxSize: number;
  maxResults: number;
  /** Hard cap on search steps so one odd transaction can never stall a run. */
  budget?: number;
}

/**
 * Finds groups of open items whose total falls in [lo, hi] (bounded subset-sum).
 * Items are searched largest first with two prunes: skip an item that overshoots `hi`,
 * and stop once even the largest remaining items cannot reach `lo`.
 */
export function findSubsets(q: SubsetQuery): string[][] {
  const items = q.items.filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
  const n = items.length;
  const prefix = [0];
  for (const it of items) prefix.push(prefix[prefix.length - 1]! + it.amount);
  const results: string[][] = [];
  const chosen: string[] = [];
  let steps = q.budget ?? 200_000;

  const visit = (start: number, sum: Cents): void => {
    if (chosen.length >= q.maxSize) return;
    for (let k = start; k < n; k++) {
      if (results.length >= q.maxResults || --steps <= 0) return;
      const next = sum + items[k]!.amount;
      if (next > q.hi) continue;
      // Items are sorted descending, so the best this branch can do is take the next ones in order.
      const room = q.maxSize - chosen.length - 1;
      if (next + prefix[Math.min(n, k + 1 + room)]! - prefix[k + 1]! < q.lo) return;
      chosen.push(items[k]!.id);
      if (next >= q.lo) results.push([...chosen]);
      visit(k + 1, next);
      chosen.pop();
    }
  };
  visit(0, 0);
  return results;
}
