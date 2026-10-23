import { Prisma, type Invoice, type InvoiceInstallment, type PaymentMethod, type PrismaClient, type BankTransaction as TxRow } from '@vult/database';
import {
  emptyMemory,
  learn,
  reconcile,
  summarizeCustomers,
  type BankTransaction,
  type Candidate,
  type MatchMemory,
  type OpenItem,
  type Proposal,
} from '@vult/match';

type Db = PrismaClient;
type InstallmentWithInvoice = InvoiceInstallment & { invoice: Invoice };

const METHOD: Record<PaymentMethod, OpenItem['method']> = {
  TRANSFER: 'transfer',
  RIBA: 'riba',
  DIRECT_DEBIT: 'direct_debit',
  CASH: 'cash',
  CARD: 'card',
  OTHER: 'other',
};
/** Returned Ri.Ba. are looked for among installments collected in this window. */
const RETURN_WINDOW_DAYS = 180;
const MAX_TRANSACTIONS_PER_RUN = 5_000;
const MAX_ITEMS_PER_RUN = 50_000;

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

export class MatchError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function toOpenItem(i: InstallmentWithInvoice): OpenItem {
  return {
    id: i.id,
    invoiceId: i.invoiceId,
    invoiceNumber: i.invoice.number,
    invoiceDate: isoDay(i.invoice.issueDate),
    customerVat: i.invoice.customerVat,
    customerName: i.invoice.customerName,
    kind: i.invoice.kind === 'CREDIT_NOTE' ? 'credit_note' : 'invoice',
    amount: Number(i.amountCents),
    dueDate: isoDay(i.dueDate),
    method: METHOD[i.method],
    ...(i.invoice.withholdingCents > 0n ? { withholding: Number(i.invoice.withholdingCents) } : {}),
    ...(i.invoice.splitPayment ? { splitPayment: true } : {}),
  };
}

export function toBankTransaction(row: TxRow): BankTransaction {
  return {
    id: row.id,
    date: isoDay(row.bookingDate),
    amount: Number(row.amountCents),
    counterpartyName: row.counterpartyName,
    ...(row.counterpartyIban ? { counterpartyIban: row.counterpartyIban } : {}),
    description: row.description,
  };
}

async function lockTenant(db: Db, tenantId: string) {
  // One matching run or confirmation per tenant at a time, so two never claim the same invoice.
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tenantId}))`;
}

async function loadMemory(db: Db, tenantId: string): Promise<MatchMemory> {
  const row = await db.matchMemory.findUnique({ where: { tenantId } });
  const data = row?.data as Partial<MatchMemory> | undefined;
  return data?.version === 1 ? { ...emptyMemory(), ...data } as MatchMemory : emptyMemory();
}

export async function importTransactions(db: Db, tenantId: string, txs: BankTransaction[]) {
  const { count } = await db.bankTransaction.createMany({
    data: txs.map((t) => ({
      tenantId,
      externalId: t.id,
      bookingDate: day(t.date),
      amountCents: BigInt(t.amount),
      counterpartyName: t.counterpartyName.slice(0, 300),
      counterpartyIban: t.counterpartyIban?.slice(0, 64) ?? null,
      description: t.description.slice(0, 2_000),
    })),
    skipDuplicates: true,
  });
  return { imported: count, duplicates: txs.length - count };
}

export interface RunSummary {
  auto: number;
  review: number;
  unmatched: number;
  ignored: number;
}

/** Allocation amount -> change in paid_cents: a used credit note counts up like a payment. */
const paidDelta = (item: OpenItem, amount: number) => (item.kind === 'credit_note' ? Math.abs(amount) : amount);

function suggestionJson(p: Proposal) {
  return { kind: p.kind, status: p.status, best: p.best, alternatives: p.alternatives } as unknown as object;
}

/** Runs the engine over everything still open, records confident matches, and stores suggestions for the rest. */
export async function runMatching(db: Db, tenantId: string, today = isoDay(new Date())): Promise<RunSummary> {
  await lockTenant(db, tenantId);
  const memory = await loadMemory(db, tenantId);
  const since = new Date(day(today).getTime() - RETURN_WINDOW_DAYS * 86_400_000);
  const ids = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM invoice_installments
    WHERE tenant_id = ${tenantId}::uuid
      AND (paid_cents < amount_cents OR (paid_cents > 0 AND due_date >= ${since}))
    ORDER BY due_date
    LIMIT ${MAX_ITEMS_PER_RUN}`;
  const installments = await db.invoiceInstallment.findMany({ where: { id: { in: ids.map((r) => r.id) } }, include: { invoice: true } });
  const rows = await db.bankTransaction.findMany({
    where: { tenantId, status: { in: ['UNMATCHED', 'SUGGESTED'] } },
    orderBy: { bookingDate: 'asc' },
    take: MAX_TRANSACTIONS_PER_RUN,
  });
  const items = installments.map(toOpenItem);
  const byId = new Map(items.map((i) => [i.id, i]));
  const paid = Object.fromEntries(installments.map((i) => [i.id, Number(i.paidCents)]));
  const { proposals } = reconcile({ items, transactions: rows.map(toBankTransaction), paid, memory });

  const summary: RunSummary = { auto: 0, review: 0, unmatched: 0, ignored: 0 };
  for (const p of proposals) {
    if (p.kind === 'outgoing') {
      summary.ignored++;
      await db.bankTransaction.update({ where: { id: p.transactionId }, data: { status: 'IGNORED', suggestion: Prisma.DbNull, confidence: null } });
      continue;
    }
    if (p.status === 'auto' && p.best) {
      summary.auto++;
      await recordAllocations(db, tenantId, p.transactionId, p.best, 'AUTO', byId);
      await db.bankTransaction.update({
        where: { id: p.transactionId },
        data: { status: 'MATCHED', suggestion: suggestionJson(p), confidence: p.best.confidence },
      });
      continue;
    }
    if (p.status === 'review') summary.review++;
    else summary.unmatched++;
    await db.bankTransaction.update({
      where: { id: p.transactionId },
      data: {
        status: p.status === 'review' ? 'SUGGESTED' : 'UNMATCHED',
        suggestion: p.best ? suggestionJson(p) : Prisma.DbNull,
        confidence: p.best?.confidence ?? null,
      },
    });
  }
  return summary;
}

async function recordAllocations(
  db: Db,
  tenantId: string,
  transactionId: string,
  candidate: Pick<Candidate, 'allocations' | 'confidence'>,
  source: 'AUTO' | 'CONFIRMED',
  items: Map<string, OpenItem>,
  userId?: string,
) {
  for (const a of candidate.allocations) {
    const item = items.get(a.itemId);
    if (!item) throw new MatchError(400, `Unknown installment ${a.itemId}`);
    await db.paymentAllocation.create({
      data: {
        tenantId,
        transactionId,
        installmentId: a.itemId,
        amountCents: BigInt(a.amount),
        source,
        confidence: candidate.confidence,
        confirmedById: userId ?? null,
      },
    });
    await db.invoiceInstallment.update({ where: { id: a.itemId }, data: { paidCents: { increment: BigInt(paidDelta(item, a.amount)) } } });
  }
}

export interface ConfirmInput {
  allocations: { installmentId: string; amountCents: number }[];
}

/**
 * A person confirms (or corrects) a match. The allocations are checked against what is still open,
 * the engine learns from it, and matching runs again so similar payments now match by themselves.
 */
export async function confirmMatch(db: Db, tenantId: string, userId: string, transactionId: string, input: ConfirmInput, today?: string) {
  await lockTenant(db, tenantId);
  const row = await db.bankTransaction.findFirst({ where: { id: transactionId, tenantId } });
  if (!row) throw new MatchError(404, 'Transaction not found');
  if (row.status === 'MATCHED') throw new MatchError(409, 'Transaction is already matched');
  const installments = await db.invoiceInstallment.findMany({
    where: { tenantId, id: { in: input.allocations.map((a) => a.installmentId) } },
    include: { invoice: true },
  });
  if (installments.length !== new Set(input.allocations.map((a) => a.installmentId)).size) throw new MatchError(400, 'Unknown installment');
  const byId = new Map(installments.map((i) => [i.id, i]));
  const txAmount = Number(row.amountCents);
  let total = 0;
  for (const a of input.allocations) {
    const inst = byId.get(a.installmentId)!;
    const open = Number(inst.amountCents - inst.paidCents);
    const paid = Number(inst.paidCents);
    const credit = inst.invoice.kind === 'CREDIT_NOTE';
    const ok =
      txAmount > 0
        ? credit
          ? a.amountCents < 0 && -a.amountCents <= open
          : a.amountCents > 0 && a.amountCents <= open
        : !credit && a.amountCents < 0 && -a.amountCents <= paid;
    if (!ok) throw new MatchError(400, `Amount ${a.amountCents} does not fit installment ${inst.invoice.number}`);
    total += a.amountCents;
  }
  const gap = Math.abs(txAmount - total);
  const tolerance = Math.max(1_500, Math.round(Math.abs(total) * 0.035));
  if (txAmount > 0 ? total <= 0 || gap > tolerance : Math.abs(total) > Math.abs(txAmount) || gap > 1_500) {
    throw new MatchError(400, 'Allocations do not add up to the transaction amount');
  }

  const items = new Map(installments.map((i) => [i.id, toOpenItem(i)]));
  await recordAllocations(db, tenantId, row.id, { allocations: input.allocations.map((a) => ({ itemId: a.installmentId, amount: a.amountCents })), confidence: 1 }, 'CONFIRMED', items, userId);
  await db.bankTransaction.update({ where: { id: row.id }, data: { status: 'MATCHED', confidence: 1 } });

  const { memory, lessons } = learn(await loadMemory(db, tenantId), toBankTransaction(row), [...items.values()]);
  await db.matchMemory.upsert({
    where: { tenantId },
    create: { tenantId, data: memory as unknown as object },
    update: { data: memory as unknown as object },
  });
  const rerun = await runMatching(db, tenantId, today);
  return { lessons, rerun };
}

export async function ignoreTransaction(db: Db, tenantId: string, transactionId: string) {
  const { count } = await db.bankTransaction.updateMany({ where: { id: transactionId, tenantId, status: { not: 'MATCHED' } }, data: { status: 'IGNORED' } });
  if (!count) throw new MatchError(404, 'Transaction not found or already matched');
}

/** Transactions with their suggestion, the suggested invoices spelled out for display. */
export async function listTransactions(db: Db, tenantId: string, status?: TxRow['status']) {
  const rows = await db.bankTransaction.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    orderBy: [{ bookingDate: 'desc' }, { id: 'asc' }],
    take: 500,
    include: { allocations: true },
  });
  const ids = new Set<string>();
  for (const r of rows) {
    const s = r.suggestion as { best?: Candidate; alternatives?: Candidate[] } | null;
    for (const c of [s?.best, ...(s?.alternatives ?? [])]) for (const a of c?.allocations ?? []) ids.add(a.itemId);
    for (const a of r.allocations) ids.add(a.installmentId);
  }
  const installments = await db.invoiceInstallment.findMany({ where: { tenantId, id: { in: [...ids] } }, include: { invoice: true } });
  return {
    transactions: rows.map((r) => ({
      id: r.id,
      date: isoDay(r.bookingDate),
      amountCents: Number(r.amountCents),
      counterpartyName: r.counterpartyName,
      counterpartyIban: r.counterpartyIban,
      description: r.description,
      status: r.status,
      confidence: r.confidence,
      suggestion: r.suggestion,
      allocations: r.allocations.map((a) => ({ installmentId: a.installmentId, amountCents: Number(a.amountCents), source: a.source })),
    })),
    installments: Object.fromEntries(
      installments.map((i) => [
        i.id,
        {
          invoiceNumber: i.invoice.number,
          customerName: i.invoice.customerName,
          customerVat: i.invoice.customerVat,
          dueDate: isoDay(i.dueDate),
          amountCents: Number(i.amountCents),
          paidCents: Number(i.paidCents),
          kind: i.invoice.kind,
        },
      ]),
    ),
  };
}

/** Billed, collected, open and overdue per customer, with how late each one pays. */
export async function receivables(db: Db, tenantId: string, today = isoDay(new Date()), customerVat?: string) {
  const installments = await db.invoiceInstallment.findMany({
    where: { tenantId, ...(customerVat ? { invoice: { customerVat } } : {}) },
    include: { invoice: true, allocations: { include: { transaction: { select: { bookingDate: true } } } } },
  });
  const payments = installments.flatMap((i) =>
    i.allocations.map((a) => ({ itemId: i.id, amount: Number(a.amountCents), date: isoDay(a.transaction.bookingDate) })),
  );
  return summarizeCustomers(installments.map(toOpenItem), payments, today);
}
