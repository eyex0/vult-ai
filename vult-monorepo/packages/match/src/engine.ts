import { findSubsets } from './subset.js';
import {
  daysBetween,
  extractReferences,
  formatEuro,
  nameSimilarity,
  nameTokens,
  tokenCoverage,
  tokenSimilarity,
  normalizeIban,
  normalizeName,
  normalizeText,
  normalizeVat,
  refMatchesNumber,
  taxIdsInText,
  type InvoiceRef,
} from './text.js';
import type {
  Allocation,
  BankTransaction,
  Candidate,
  Cents,
  MatchMemory,
  MatchOptions,
  OpenItem,
  Proposal,
  Reason,
  ReconcileInput,
  ReconcileResult,
} from './types.js';

export const DEFAULT_OPTIONS: MatchOptions = {
  autoThreshold: 0.85,
  reviewThreshold: 0.45,
  maxFee: 1500,
  maxCombination: 6,
  maxPool: 24,
};

export function emptyMemory(): MatchMemory {
  return { version: 1, ibans: {}, aliases: {}, discounts: {} };
}

const RIBA_BATCH = /\b(RIBA|RICEVUTE BANCARIE|RICEVUTA BANCARIA|PORTAFOGLIO|DISTINTA|EFFETTI|SBF)\b/;
const RETURNED = /\b(INSOLUT\w*|RICHIAM\w*|STORNO|IMPAGAT\w*|RESO|RITORNO|UNPAID|RETURNED)\b/;
/** Early-payment discounts Italian customers commonly take, in basis points. */
const COMMON_DISCOUNTS = [100, 150, 200, 250, 300];
const MAX_OVERPAY: Cents = 500;
const MAX_EVIDENCE = 0.6;

interface Evidence {
  score: number;
  reasons: Reason[];
}

interface Ctx {
  opts: MatchOptions;
  memory: MatchMemory;
  items: Map<string, OpenItem>;
  byCustomer: Map<string, OpenItem[]>;
  names: Map<string, string>;
  tokens: Map<string, string[]>;
  /** Name word -> customers, and first four letters -> customers (for names the bank cut short). */
  wordIndex: Map<string, Set<string>>;
  prefixIndex: Map<string, Set<string>>;
  /** Original open amount -> items, for payments from strangers. */
  amountIndex: Map<Cents, string[]>;
  open: Map<string, Cents>;
  collected: Map<string, Cents>;
}

const clamp = (n: number) => Math.max(0, Math.min(0.99, Math.round(n * 1000) / 1000));
const pct = (n: number) => `${Math.round(n * 100)}%`;
const byDue = (a: OpenItem, b: OpenItem) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id);
const sameAllocations = (a: Candidate, b: Candidate) =>
  a.allocations.length === b.allocations.length &&
  a.allocations.every((x) => b.allocations.some((y) => y.itemId === x.itemId && y.amount === x.amount));

function addEvidence(map: Map<string, Evidence>, vat: string, score: number, reason: Reason) {
  const e = map.get(vat) ?? { score: 0, reasons: [] };
  if (e.reasons.some((r) => r.code === reason.code)) return;
  e.score = Math.min(MAX_EVIDENCE, e.score + score);
  e.reasons.push(reason);
  map.set(vat, e);
}

/** Who sent the money: learned IBANs and aliases, a VAT number in the text, or the name. */
function payerEvidence(tx: BankTransaction, ctx: Ctx): Map<string, Evidence> {
  const ev = new Map<string, Evidence>();
  const name = (vat: string) => ctx.names.get(vat) ?? vat;
  const iban = normalizeIban(tx.counterpartyIban);
  const ibanVat = iban ? ctx.memory.ibans[iban] : undefined;
  if (ibanVat && ctx.byCustomer.has(ibanVat)) addEvidence(ev, ibanVat, 0.5, { code: 'known_iban', label: 'Known IBAN' });
  const aliasVat = ctx.memory.aliases[normalizeName(tx.counterpartyName)];
  if (aliasVat && ctx.byCustomer.has(aliasVat)) {
    addEvidence(ev, aliasVat, 0.45, { code: 'known_alias', label: `${tx.counterpartyName} pays for ${name(aliasVat)}` });
  }
  for (const id of taxIdsInText(`${tx.counterpartyName} ${tx.description}`)) {
    if (ctx.byCustomer.has(id)) addEvidence(ev, id, 0.5, { code: 'vat_in_text', label: 'VAT number in description' });
  }
  const payer = nameTokens(tx.counterpartyName);
  const text = nameTokens(tx.description);
  for (const vat of nearbyCustomers(payer, text, ctx)) {
    const tokens = ctx.tokens.get(vat) ?? [];
    const sim = Math.max(tokenSimilarity(payer, tokens), 0.9 * tokenCoverage(tokens, text));
    if (sim >= 0.6) addEvidence(ev, vat, 0.45 * sim, { code: 'name', label: `Name matches ${pct(sim)}` });
  }
  return ev;
}

/**
 * Customers worth comparing names with: those sharing a word with the payer or the description.
 * Common words ("STUDIO", "BAR", "ITALIA") are skipped when rarer ones exist, so the work stays small.
 */
function nearbyCustomers(payer: string[], text: string[], ctx: Ctx): Set<string> {
  const lists: Set<string>[] = [];
  for (const t of new Set([...payer, ...text])) {
    const hit = ctx.wordIndex.get(t);
    if (hit) lists.push(hit);
  }
  const last = payer[payer.length - 1];
  if (last && last.length >= 4) {
    const hit = ctx.prefixIndex.get(last.slice(0, 4));
    if (hit) lists.push(hit);
  }
  lists.sort((a, b) => a.size - b.size);
  const near = new Set<string>();
  for (const list of lists) {
    if (near.size && list.size > 300) break;
    if (list.size > 3000) break;
    for (const vat of list) near.add(vat);
  }
  return near;
}

/** Average days between a candidate's due dates and the payment: the tie-breaker between equal installments. */
const dueDistance = new WeakMap<Candidate, number>();
const NEAR = 0.05;

/** Same customer, same total, but due further from the payment date: a weaker reading, not a real rival. */
function outranks(best: Candidate, rival: Candidate): boolean {
  const total = (c: Candidate) => c.allocations.reduce((s, a) => s + a.amount, 0);
  const db = dueDistance.get(best);
  const dr = dueDistance.get(rival);
  return best.customerVat !== null && best.customerVat === rival.customerVat && total(best) === total(rival) && db !== undefined && dr !== undefined && dr > db + 7;
}

function amountFit(diff: Cents, total: Cents, vat: string | null, ctx: Ctx): { score: number; reason: Reason } | null {
  if (Math.abs(diff) <= 1) return { score: 0.35, reason: { code: 'exact_amount', label: 'Exact amount' } };
  if (diff > 0) {
    return diff <= MAX_OVERPAY ? { score: 0.2, reason: { code: 'overpaid', label: `Paid ${formatEuro(diff)} more` } } : null;
  }
  const short = -diff;
  const learned = vat ? ctx.memory.discounts[vat] : undefined;
  const near = (bp: number) => Math.abs(short - Math.round((total * bp) / 10_000)) <= 2;
  if (learned && near(learned)) {
    return { score: 0.3, reason: { code: 'discount', label: `${learned / 100}% early-payment discount (learned)` } };
  }
  if (short <= ctx.opts.maxFee && short <= total * 0.025) {
    return { score: 0.22, reason: { code: 'bank_fee', label: `Bank fee ${formatEuro(short)}` } };
  }
  const common = COMMON_DISCOUNTS.find(near);
  return common ? { score: 0.15, reason: { code: 'discount', label: `${common / 100}% discount` } } : null;
}

function itemNotes(items: OpenItem[]): Reason[] {
  const out: Reason[] = [];
  const withholding = items.reduce((s, i) => s + (i.withholding ?? 0), 0);
  if (withholding > 0) out.push({ code: 'withholding', label: `Withholding tax ${formatEuro(withholding)} kept by customer` });
  if (items.some((i) => i.splitPayment)) out.push({ code: 'split_payment', label: 'Split payment: VAT goes to the state' });
  return out;
}

function customerCandidates(
  tx: BankTransaction,
  vat: string,
  ev: Evidence | undefined,
  refs: InvoiceRef[],
  referenced: Set<string>,
  ctx: Ctx,
): Candidate[] {
  const items = (ctx.byCustomer.get(vat) ?? []).filter((i) => (ctx.open.get(i.id) ?? 0) > 0);
  const invoices = items.filter((i) => i.kind === 'invoice').sort(byDue);
  const credits = items.filter((i) => i.kind === 'credit_note').slice(0, 4);
  if (!invoices.length) return [];
  const pool = [
    ...invoices.filter((i) => referenced.has(i.id)),
    ...invoices.filter((i) => !referenced.has(i.id)),
  ].slice(0, ctx.opts.maxPool);
  const oldest = new Set(invoices.map((i) => i.id));
  const evScore = ev?.score ?? 0;
  const open = (i: OpenItem) => ctx.open.get(i.id) ?? 0;
  const lo = tx.amount - MAX_OVERPAY;
  const hi = Math.max(tx.amount + ctx.opts.maxFee, Math.ceil(tx.amount / 0.97));

  const creditSets: OpenItem[][] = [[]];
  credits.forEach((c, i) => {
    creditSets.push([c]);
    credits.slice(i + 1).forEach((d) => creditSets.push([c, d]));
  });

  const out: Candidate[] = [];
  for (const cn of creditSets) {
    const cnTotal = cn.reduce((s, c) => s + open(c), 0);
    const subsets = findSubsets({
      items: pool.map((i) => ({ id: i.id, amount: open(i) })),
      lo: lo + cnTotal,
      hi: hi + cnTotal,
      maxSize: ctx.opts.maxCombination,
      maxResults: 40,
    });
    for (const ids of subsets) {
      const chosen = ids.map((id) => ctx.items.get(id)!).sort(byDue);
      const total = chosen.reduce((s, i) => s + open(i), 0) - cnTotal;
      const diff = tx.amount - total;
      const fit = amountFit(diff, total, vat, ctx);
      if (!fit) continue;
      let score = evScore + fit.score;
      const reasons: Reason[] = [...(ev?.reasons ?? []), fit.reason];
      const covered = chosen.filter((i) => referenced.has(i.id));
      if (refs.length) {
        if (covered.length === chosen.length) {
          score += 0.35;
          reasons.push({ code: 'reference', label: `Invoice ${covered.map((i) => i.invoiceNumber).join(', ')} in description` });
        } else if (covered.length) {
          score += 0.15;
          reasons.push({ code: 'reference', label: `Invoice ${covered.map((i) => i.invoiceNumber).join(', ')} in description` });
        } else score -= 0.15;
      }
      if (covered.length < chosen.length) score -= 0.04 * (chosen.length - 1);
      // Customers usually settle their oldest invoices first.
      const oldestN = [...oldest].slice(0, chosen.length);
      if (chosen.every((i) => oldestN.includes(i.id))) score += 0.03;
      if (chosen.some((i) => daysBetween(i.invoiceDate, tx.date) < -1)) score -= 0.3;
      for (const c of cn) reasons.push({ code: 'credit_note', label: `Credit note ${c.invoiceNumber} deducted` });
      reasons.push(...itemNotes(chosen));
      const allocations: Allocation[] = [
        ...chosen.map((i) => ({ itemId: i.id, amount: open(i) })),
        ...cn.map((c) => ({ itemId: c.id, amount: -open(c) })),
      ];
      const candidate: Candidate = { customerVat: vat, allocations, confidence: clamp(score), difference: diff, reasons };
      dueDistance.set(candidate, chosen.reduce((s, i) => s + Math.abs(daysBetween(i.dueDate, tx.date)), 0) / chosen.length);
      out.push(candidate);
    }
  }

  if (!out.length && (evScore >= 0.4 || invoices.some((i) => referenced.has(i.id)))) {
    // Nothing adds up: treat it as a partial payment of the referenced or oldest invoice.
    const target = invoices.find((i) => referenced.has(i.id)) ?? invoices.find((i) => open(i) > tx.amount);
    if (target && open(target) > tx.amount) {
      const refBonus = referenced.has(target.id) ? 0.3 : 0;
      out.push({
        customerVat: vat,
        allocations: [{ itemId: target.id, amount: tx.amount }],
        confidence: clamp(Math.min(evScore + refBonus + 0.05, ctx.opts.autoThreshold - 0.01)),
        difference: 0,
        reasons: [
          ...(ev?.reasons ?? []),
          ...(refBonus ? [{ code: 'reference' as const, label: `Invoice ${target.invoiceNumber} in description` }] : []),
          { code: 'partial', label: `Partial payment: ${formatEuro(tx.amount)} of ${formatEuro(open(target))}` },
        ],
      });
    }
  }
  return out;
}

/** A bank credits several Ri.Ba. at once: find the group of due Ri.Ba., across customers, that adds up. */
function ribaBatchCandidates(tx: BankTransaction, ctx: Ctx): Candidate[] {
  const pool = [...ctx.items.values()]
    .filter((i) => i.kind === 'invoice' && i.method === 'riba' && (ctx.open.get(i.id) ?? 0) > 0)
    .filter((i) => {
      const d = daysBetween(tx.date, i.dueDate);
      return d >= -15 && d <= 90;
    })
    .sort((a, b) => Math.abs(daysBetween(tx.date, a.dueDate)) - Math.abs(daysBetween(tx.date, b.dueDate)))
    .slice(0, 40);
  const subsets = findSubsets({
    items: pool.map((i) => ({ id: i.id, amount: ctx.open.get(i.id) ?? 0 })),
    lo: tx.amount,
    hi: tx.amount + ctx.opts.maxFee,
    maxSize: 15,
    maxResults: 20,
  });
  return subsets.flatMap((ids) => {
    const chosen = ids.map((id) => ctx.items.get(id)!).sort(byDue);
    const total = chosen.reduce((s, i) => s + (ctx.open.get(i.id) ?? 0), 0);
    const diff = tx.amount - total;
    const fit = amountFit(diff, total, null, ctx);
    if (!fit || fit.reason.code === 'discount') return [];
    const dues = chosen.map((i) => i.dueDate).sort();
    const tight = daysBetween(dues[0]!, dues[dues.length - 1]!) <= 3;
    const vats = new Set(chosen.map((i) => i.customerVat));
    return [{
      customerVat: vats.size === 1 ? chosen[0]!.customerVat : null,
      allocations: chosen.map((i) => ({ itemId: i.id, amount: ctx.open.get(i.id) ?? 0 })),
      confidence: clamp(0.45 + fit.score + (tight ? 0.1 : 0) - (chosen.length === 1 ? 0.1 : 0)),
      difference: diff,
      reasons: [
        { code: 'riba_batch' as const, label: `Ri.Ba. batch: ${chosen.length} invoices, ${vats.size} customers` },
        fit.reason,
      ],
    }];
  });
}

/** A Ri.Ba. the customer did not pay comes back as a debit: reopen the invoice it collected. */
function returnCandidates(tx: BankTransaction, ctx: Ctx): Candidate[] {
  const amount = -tx.amount;
  const words = nameTokens(`${tx.counterpartyName} ${tx.description}`);
  const refs = extractReferences(tx.description);
  const out: Candidate[] = [];
  for (const item of ctx.items.values()) {
    const got = ctx.collected.get(item.id) ?? 0;
    if (item.kind !== 'invoice' || got <= 0) continue;
    const fee = amount - got;
    if (fee < 0 || fee > ctx.opts.maxFee) continue;
    const reasons: Reason[] = [{ code: 'riba_return', label: 'Returned unpaid (insoluto)' }];
    let score = item.method === 'riba' ? 0.45 : 0.3;
    if (fee <= 1) {
      score += 0.25;
      reasons.push({ code: 'exact_amount', label: 'Exact amount' });
    } else {
      score += 0.15;
      reasons.push({ code: 'bank_fee', label: `Return fee ${formatEuro(fee)}` });
    }
    const cover = tokenCoverage(ctx.tokens.get(item.customerVat) ?? [], words);
    if (cover >= 0.99) {
      score += 0.3;
      reasons.push({ code: 'name', label: 'Customer named in description' });
    }
    if (refs.some((r) => refMatchesNumber(r, item.invoiceNumber))) {
      score += 0.3;
      reasons.push({ code: 'reference', label: `Invoice ${item.invoiceNumber} in description` });
    }
    out.push({ customerVat: item.customerVat, allocations: [{ itemId: item.id, amount: -got }], confidence: clamp(score), difference: tx.amount + got, reasons });
  }
  return out;
}

function propose(tx: BankTransaction, ctx: Ctx): Proposal {
  const text = normalizeText(`${tx.counterpartyName} ${tx.description}`);
  let kind: Proposal['kind'] = 'payment';
  let candidates: Candidate[];
  if (tx.amount < 0) {
    if (!RETURNED.test(text)) return { transactionId: tx.id, kind: 'outgoing', status: 'unmatched', best: null, alternatives: [] };
    kind = 'riba_return';
    candidates = returnCandidates(tx, ctx);
  } else {
    const ev = payerEvidence(tx, ctx);
    const refs = extractReferences(tx.description);
    const referenced = new Set<string>();
    if (refs.length) {
      for (const item of ctx.items.values()) {
        if ((ctx.open.get(item.id) ?? 0) > 0 && refs.some((r) => refMatchesNumber(r, item.invoiceNumber))) referenced.add(item.id);
      }
    }
    const vats = new Set<string>(ev.keys());
    for (const id of referenced) vats.add(ctx.items.get(id)!.customerVat);
    const fallback = vats.size === 0;
    if (fallback) {
      // Unknown payer and no invoice number: only customers with an open item of exactly this amount.
      for (const id of [...(ctx.amountIndex.get(tx.amount) ?? []), ...(ctx.amountIndex.get(tx.amount + 1) ?? []), ...(ctx.amountIndex.get(tx.amount - 1) ?? [])]) {
        if (Math.abs((ctx.open.get(id) ?? 0) - tx.amount) <= 1) vats.add(ctx.items.get(id)!.customerVat);
        if (vats.size >= 10) break;
      }
    }
    candidates = [];
    if (RIBA_BATCH.test(text)) candidates.push(...ribaBatchCandidates(tx, ctx));
    for (const vat of vats) candidates.push(...customerCandidates(tx, vat, ev.get(vat), refs, referenced, ctx));
    if (fallback) {
      const exact = candidates.filter((c) => c.customerVat && c.reasons.some((r) => r.code === 'exact_amount') && !c.reasons.some((r) => r.code === 'riba_batch'));
      if (exact.length === 1) {
        exact[0]!.confidence = clamp(exact[0]!.confidence + 0.15);
        exact[0]!.reasons.push({ code: 'unique_amount', label: 'Only open item with this amount' });
      }
    }
  }

  candidates.sort((a, b) => {
    // Near ties go to the installment due closest to the payment date ("rata" of March paid in March).
    if (Math.abs(a.confidence - b.confidence) <= NEAR) {
      const da = dueDistance.get(a);
      const dbb = dueDistance.get(b);
      if (da !== undefined && dbb !== undefined && Math.abs(da - dbb) > 7) return da - dbb;
    }
    return b.confidence - a.confidence || a.allocations.length - b.allocations.length;
  });
  const unique: Candidate[] = [];
  for (const c of candidates) if (!unique.some((u) => sameAllocations(u, c))) unique.push(c);
  const [best, second] = unique;
  const rivals = best ? unique.filter((c) => c !== best && c.confidence >= best.confidence - NEAR && !outranks(best, c)) : [];
  if (best && second && rivals.length) {
    best.confidence = clamp(best.confidence - 0.25);
    best.reasons.push({ code: 'ambiguous', label: `${rivals.length + 1} possible matches` });
  }
  if (!best) return { transactionId: tx.id, kind, status: 'unmatched', best: null, alternatives: [] };
  const partial = best.reasons.some((r) => r.code === 'partial');
  const status =
    best.confidence >= ctx.opts.autoThreshold && !partial ? 'auto' : best.confidence >= ctx.opts.reviewThreshold ? 'review' : 'unmatched';
  return { transactionId: tx.id, kind, status, best, alternatives: unique.slice(1, 4) };
}

function canApply(p: Proposal, ctx: Ctx): boolean {
  return (p.best?.allocations ?? []).every((a) =>
    p.kind === 'riba_return' ? (ctx.collected.get(a.itemId) ?? 0) >= -a.amount : (ctx.open.get(a.itemId) ?? 0) >= Math.abs(a.amount),
  );
}

function apply(p: Proposal, ctx: Ctx) {
  for (const a of p.best?.allocations ?? []) {
    const item = ctx.items.get(a.itemId)!;
    const open = ctx.open.get(a.itemId) ?? 0;
    if (p.kind === 'riba_return') {
      ctx.open.set(a.itemId, open - a.amount);
      ctx.collected.set(a.itemId, (ctx.collected.get(a.itemId) ?? 0) + a.amount);
    } else {
      ctx.open.set(a.itemId, open - Math.abs(a.amount));
      if (item.kind === 'invoice') ctx.collected.set(a.itemId, (ctx.collected.get(a.itemId) ?? 0) + a.amount);
    }
  }
}

/**
 * Matches bank transactions to open invoices. Confident matches are applied in order of confidence,
 * so two transfers never claim the same invoice; the rest come back as suggestions for a person.
 */
export function reconcile(input: ReconcileInput): ReconcileResult {
  const opts = { ...DEFAULT_OPTIONS, ...input.options };
  const paid = input.paid ?? {};
  const items = input.items.map((i) => ({ ...i, customerVat: normalizeVat(i.customerVat) }));
  const ctx: Ctx = {
    opts,
    memory: input.memory ?? emptyMemory(),
    items: new Map(items.map((i) => [i.id, i])),
    byCustomer: new Map(),
    names: new Map(),
    tokens: new Map(),
    wordIndex: new Map(),
    prefixIndex: new Map(),
    amountIndex: new Map(),
    open: new Map(items.map((i) => [i.id, Math.max(0, i.amount - Math.abs(paid[i.id] ?? 0))])),
    collected: new Map(items.map((i) => [i.id, i.kind === 'invoice' ? paid[i.id] ?? 0 : 0])),
  };
  for (const i of items) {
    ctx.byCustomer.set(i.customerVat, [...(ctx.byCustomer.get(i.customerVat) ?? []), i]);
    ctx.names.set(i.customerVat, i.customerName);
    if (!ctx.tokens.has(i.customerVat)) {
      const tokens = nameTokens(i.customerName);
      ctx.tokens.set(i.customerVat, tokens);
      for (const t of tokens) {
        for (const [index, key] of [[ctx.wordIndex, t], [ctx.prefixIndex, t.slice(0, 4)]] as const) {
          if (!index.has(key)) index.set(key, new Set());
          index.get(key)!.add(i.customerVat);
        }
      }
    }
    const open = ctx.open.get(i.id) ?? 0;
    if (i.kind === 'invoice' && open > 0) ctx.amountIndex.set(open, [...(ctx.amountIndex.get(open) ?? []), i.id]);
  }

  const done = new Map<string, Proposal>();
  let pending = [...input.transactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (let round = 0; round < 4 && pending.length; round++) {
    const proposals = pending.map((tx) => propose(tx, ctx));
    const order = proposals.map((p, i) => ({ p, tx: pending[i]! })).sort((a, b) => (b.p.best?.confidence ?? 0) - (a.p.best?.confidence ?? 0));
    const next: BankTransaction[] = [];
    let applied = false;
    for (const { p, tx } of order) {
      if (p.status === 'auto' && canApply(p, ctx)) {
        apply(p, ctx);
        done.set(tx.id, p);
        applied = true;
      } else next.push(tx);
    }
    pending = next;
    if (!applied) break;
  }
  for (const tx of pending) {
    const p = propose(tx, ctx);
    if (p.status === 'auto' && canApply(p, ctx)) apply(p, ctx);
    else if (p.status === 'auto') p.status = 'review';
    done.set(tx.id, p);
  }
  return {
    proposals: input.transactions.map((tx) => done.get(tx.id)!),
    open: Object.fromEntries(ctx.open),
  };
}

export interface Lesson {
  memory: MatchMemory;
  /** Plain-language notes on what was learned, for the person who confirmed. */
  lessons: string[];
}

/** Updates the memory from a match a person confirmed, so the next similar payment matches by itself. */
export function learn(memory: MatchMemory, tx: BankTransaction, settled: OpenItem[]): Lesson {
  const next: MatchMemory = { version: 1, ibans: { ...memory.ibans }, aliases: { ...memory.aliases }, discounts: { ...memory.discounts } };
  const lessons: string[] = [];
  const vats = new Set(settled.map((i) => normalizeVat(i.customerVat)));
  if (tx.amount <= 0 || vats.size !== 1) return { memory: next, lessons };
  const vat = [...vats][0]!;
  const customer = settled[0]!.customerName;

  const iban = normalizeIban(tx.counterpartyIban);
  if (iban && next.ibans[iban] !== vat) {
    next.ibans[iban] = vat;
    lessons.push(`IBAN ending ${iban.slice(-4)} belongs to ${customer}`);
  }
  const alias = normalizeName(tx.counterpartyName);
  if (alias && nameSimilarity(tx.counterpartyName, customer) < 0.6 && next.aliases[alias] !== vat) {
    next.aliases[alias] = vat;
    lessons.push(`${tx.counterpartyName} pays for ${customer}`);
  }
  const total = settled.reduce((s, i) => s + (i.kind === 'credit_note' ? -i.amount : i.amount), 0);
  const short = total - tx.amount;
  if (short >= 500 && total > 0) {
    const bp = COMMON_DISCOUNTS.find((d) => Math.abs(short - Math.round((total * d) / 10_000)) <= 2);
    if (bp && next.discounts[vat] !== bp) {
      next.discounts[vat] = bp;
      lessons.push(`${customer} takes a ${bp / 100}% early-payment discount`);
    }
  }
  return { memory: next, lessons };
}
