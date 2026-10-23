import { daysBetween, normalizeVat } from './text.js';
import type { Cents, OpenItem } from './types.js';

/** Money applied to an item by a confirmed match. Negative when a Ri.Ba. came back unpaid. */
export interface AppliedPayment {
  itemId: string;
  amount: Cents;
  /** YYYY-MM-DD the money arrived. */
  date: string;
}

export interface CustomerBalance {
  customerVat: string;
  customerName: string;
  /** Invoices minus credit notes. */
  billed: Cents;
  collected: Cents;
  open: Cents;
  overdue: Cents;
  /** Average days paid after the due date, weighted by amount; negative means early. Null until something is paid. */
  avgDaysLate: number | null;
  lastPayment: string | null;
  invoices: number;
}

/** The revenue panel of a company: billed, collected, open and overdue, from invoices and matched payments. */
export function summarizeCustomers(items: OpenItem[], payments: AppliedPayment[], today: string): CustomerBalance[] {
  const byItem = new Map<string, AppliedPayment[]>();
  for (const p of payments) byItem.set(p.itemId, [...(byItem.get(p.itemId) ?? []), p]);
  const out = new Map<string, CustomerBalance & { lateWeight: number; lateSum: number }>();
  for (const item of items) {
    const vat = normalizeVat(item.customerVat);
    const row =
      out.get(vat) ??
      { customerVat: vat, customerName: item.customerName, billed: 0, collected: 0, open: 0, overdue: 0, avgDaysLate: null, lastPayment: null, invoices: 0, lateWeight: 0, lateSum: 0 };
    const applied = byItem.get(item.id) ?? [];
    const used = Math.abs(applied.reduce((s, p) => s + p.amount, 0));
    if (item.kind === 'credit_note') {
      row.billed -= item.amount;
      row.open -= Math.max(0, item.amount - used);
    } else {
      row.invoices++;
      row.billed += item.amount;
      const got = applied.reduce((s, p) => s + p.amount, 0);
      row.collected += got;
      const left = Math.max(0, item.amount - got);
      row.open += left;
      if (left > 0 && item.dueDate < today) row.overdue += left;
      for (const p of applied.filter((x) => x.amount > 0)) {
        row.lateSum += daysBetween(item.dueDate, p.date) * p.amount;
        row.lateWeight += p.amount;
        if (!row.lastPayment || p.date > row.lastPayment) row.lastPayment = p.date;
      }
    }
    out.set(vat, row);
  }
  return [...out.values()]
    .map(({ lateWeight, lateSum, ...row }) => ({ ...row, open: Math.max(0, row.open), avgDaysLate: lateWeight ? Math.round(lateSum / lateWeight) : null }))
    .sort((a, b) => b.open - a.open || a.customerName.localeCompare(b.customerName));
}
