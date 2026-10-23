import {
  emptyMemory,
  learn,
  parseBankCsv,
  reconcile,
  summarizeCustomers,
  type AppliedPayment,
  type BankTransaction,
  type Candidate,
  type CustomerBalance,
  type MatchMemory,
  type OpenItem,
  type Proposal,
} from "@vult/match";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, postJson, type ApiConnection } from "@/lib/api";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";
import { DEMO_CUSTOMERS, DEMO_ITEMS, DEMO_TRANSACTIONS, MATCH_TODAY } from "./matchDemo";

export type RowStatus = "auto" | "confirmed" | "review" | "unmatched" | "ignored";

export interface MatchRow {
  tx: BankTransaction;
  proposal: Proposal | null;
  /** What was recorded for a matched row. */
  applied: { itemId: string; amount: number }[] | null;
  status: RowStatus;
}

export type DisplayItem = Pick<OpenItem, "id" | "invoiceNumber" | "customerName" | "dueDate" | "kind">;

/** The outcome of an action, for the toast. */
export interface Outcome {
  title: string;
  description?: string;
  error?: boolean;
}

/** What the Match page needs, whether the data is the built-in demo or a live workspace behind the API. */
export interface MatchModel {
  mode: "demo" | "live";
  loading: boolean;
  error: string | null;
  today: string;
  rows: MatchRow[];
  items: Map<string, DisplayItem>;
  balances: CustomerBalance[];
  /** Account owner per customer VAT, when known (commissions). */
  owners: Map<string, string> | null;
  confirm: (row: MatchRow, c: Candidate) => Promise<Outcome>;
  ignore: (row: MatchRow) => Promise<Outcome | void>;
  undo: (row: MatchRow) => Promise<Outcome | void>;
  uploadStatement: (file: File) => Promise<Outcome>;
  uploadInvoices?: (file: File) => Promise<Outcome>;
  run?: () => Promise<Outcome>;
  reset?: () => Outcome;
}

const moreAuto = (n: number) => (n ? (n > 1 ? `${n} more payments now match automatically` : "1 more payment now matches automatically") : "");
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const joinNotes = (parts: string[]) => parts.filter(Boolean).join(" · ") || undefined;

// ---------------------------------------------------------------------------
// Demo: the engine runs in the browser over fictional data; decisions stay in this browser.

const DEMO_KEY = "match.v1";

interface DemoState {
  memory: MatchMemory;
  confirmed: Record<string, { allocations: { itemId: string; amount: number }[]; at: string }>;
  ignored: string[];
  uploaded: BankTransaction[];
}

const demoInitial = (): DemoState => ({ memory: emptyMemory(), confirmed: {}, ignored: [], uploaded: [] });

function demoPaid(confirmed: DemoState["confirmed"], items: Map<string, OpenItem>) {
  const paid: Record<string, number> = {};
  for (const c of Object.values(confirmed)) {
    for (const a of c.allocations) {
      const item = items.get(a.itemId);
      if (item) paid[a.itemId] = (paid[a.itemId] ?? 0) + (item.kind === "credit_note" ? Math.abs(a.amount) : a.amount);
    }
  }
  return paid;
}

export function useDemoMatch(): MatchModel {
  const [state, setRaw] = useState<DemoState>(() => ({ ...demoInitial(), ...readJSON<Partial<DemoState>>(DEMO_KEY, {}) }));
  const setState = (next: DemoState) => {
    setRaw(next);
    writeJSON(DEMO_KEY, next);
  };

  const computed = useMemo(() => {
    const transactions = [...DEMO_TRANSACTIONS, ...state.uploaded];
    const items = new Map(DEMO_ITEMS.map((i) => [i.id, i]));
    const byTx = new Map(transactions.map((t) => [t.id, t]));
    const paid = demoPaid(state.confirmed, items);
    const payments: AppliedPayment[] = [];
    const record = (txId: string, allocations: { itemId: string; amount: number }[]) => {
      for (const a of allocations) payments.push({ itemId: a.itemId, amount: a.amount, date: byTx.get(txId)?.date ?? MATCH_TODAY });
    };
    for (const [txId, c] of Object.entries(state.confirmed)) record(txId, c.allocations);
    const pending = transactions.filter((t) => !state.confirmed[t.id] && !state.ignored.includes(t.id));
    const { proposals } = reconcile({ items: DEMO_ITEMS, transactions: pending, paid, memory: state.memory });
    const byId = new Map(proposals.map((p) => [p.transactionId, p]));
    for (const p of proposals) if (p.status === "auto" && p.best) record(p.transactionId, p.best.allocations);
    const rows: MatchRow[] = transactions.map((tx) => {
      const p = byId.get(tx.id) ?? null;
      const confirmed = state.confirmed[tx.id];
      if (confirmed) return { tx, proposal: p, applied: confirmed.allocations, status: "confirmed" };
      if (state.ignored.includes(tx.id) || p?.kind === "outgoing") return { tx, proposal: p, applied: null, status: "ignored" };
      if (p?.status === "auto") return { tx, proposal: p, applied: p.best!.allocations, status: "auto" };
      return { tx, proposal: p, applied: null, status: p?.status ?? "unmatched" };
    });
    return { rows, items, transactions, balances: summarizeCustomers(DEMO_ITEMS, payments, MATCH_TODAY) };
  }, [state]);

  return {
    mode: "demo",
    loading: false,
    error: null,
    today: MATCH_TODAY,
    rows: computed.rows,
    items: computed.items,
    balances: computed.balances,
    owners: new Map(DEMO_CUSTOMERS.map((c) => [c.vat, c.ownerId])),
    async confirm(row, c) {
      const settled = c.allocations.map((a) => computed.items.get(a.itemId)).filter((i): i is OpenItem => !!i);
      const { memory, lessons } = learn(state.memory, row.tx, settled);
      const next: DemoState = { ...state, memory, confirmed: { ...state.confirmed, [row.tx.id]: { allocations: c.allocations, at: new Date().toISOString() } } };
      // How many more payments the engine now matches by itself thanks to what it just learned.
      const before = new Set(computed.rows.filter((r) => r.status === "auto").map((r) => r.tx.id));
      const pending = computed.transactions.filter((t) => !next.confirmed[t.id] && !next.ignored.includes(t.id));
      const after = reconcile({ items: DEMO_ITEMS, transactions: pending, paid: demoPaid(next.confirmed, computed.items), memory }).proposals.filter(
        (p) => p.status === "auto" && !before.has(p.transactionId),
      ).length;
      setState(next);
      return { title: "Match confirmed", description: joinNotes([...lessons.map((l) => `Learned: ${l}`), moreAuto(after)]) };
    },
    async ignore(row) {
      setState({ ...state, ignored: [...state.ignored, row.tx.id] });
    },
    async undo(row) {
      const { [row.tx.id]: _removed, ...confirmed } = state.confirmed;
      setState({ ...state, confirmed, ignored: state.ignored.filter((id) => id !== row.tx.id) });
    },
    async uploadStatement(file) {
      const { transactions, skipped } = parseBankCsv(await file.text());
      if (!transactions.length) return { title: "No transactions found in this file", description: skipped[0]?.reason, error: true };
      const known = new Set(computed.transactions.map((t) => t.id));
      const fresh = transactions.filter((t) => !known.has(t.id));
      setState({ ...state, uploaded: [...state.uploaded, ...fresh] });
      return { title: `Imported ${plural(fresh.length, "transaction")}`, description: skipped.length ? `${skipped.length} rows skipped` : undefined };
    },
    reset() {
      removeKey(DEMO_KEY);
      setState(demoInitial());
      return { title: "Demo reset" };
    },
  };
}

// ---------------------------------------------------------------------------
// Live: the API stores invoices, bank movements and matches for the workspace the token belongs to.

interface ApiTransaction {
  id: string;
  date: string;
  amountCents: number;
  counterpartyName: string;
  counterpartyIban: string | null;
  description: string;
  status: "UNMATCHED" | "SUGGESTED" | "MATCHED" | "IGNORED";
  confidence: number | null;
  suggestion: { kind: Proposal["kind"]; status: Proposal["status"]; best: Candidate | null; alternatives?: Candidate[] } | null;
  allocations: { installmentId: string; amountCents: number; source: "AUTO" | "CONFIRMED" }[];
}

interface ApiInstallment {
  invoiceNumber: string;
  customerName: string;
  customerVat: string;
  dueDate: string;
  amountCents: number;
  paidCents: number;
  kind: "INVOICE" | "CREDIT_NOTE";
}

interface RunSummary {
  auto: number;
  review: number;
  unmatched: number;
  ignored: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const describeRun = (r: RunSummary) => joinNotes([r.auto ? `${plural(r.auto, "payment")} matched automatically` : "", r.review ? `${r.review} to review` : ""]);

function toRow(t: ApiTransaction): MatchRow {
  const tx: BankTransaction = {
    id: t.id,
    date: t.date,
    amount: t.amountCents,
    counterpartyName: t.counterpartyName,
    description: t.description,
    ...(t.counterpartyIban ? { counterpartyIban: t.counterpartyIban } : {}),
  };
  const s = t.suggestion;
  const proposal: Proposal | null = s ? { transactionId: t.id, kind: s.kind, status: s.status, best: s.best, alternatives: s.alternatives ?? [] } : null;
  if (t.status === "MATCHED") {
    const applied = t.allocations.map((a) => ({ itemId: a.installmentId, amount: a.amountCents }));
    return { tx, proposal, applied, status: t.allocations.some((a) => a.source === "CONFIRMED") ? "confirmed" : "auto" };
  }
  const status: RowStatus = t.status === "IGNORED" ? "ignored" : t.status === "SUGGESTED" ? "review" : "unmatched";
  return { tx, proposal, applied: null, status };
}

export function useLiveMatch(conn: ApiConnection | null): MatchModel {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [items, setItems] = useState<Map<string, DisplayItem>>(new Map());
  const [balances, setBalances] = useState<CustomerBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!conn) return;
    setLoading(true);
    try {
      const [list, rec] = await Promise.all([
        apiFetch<{ transactions: ApiTransaction[]; installments: Record<string, ApiInstallment> }>(conn, "/match/transactions"),
        apiFetch<{ data: CustomerBalance[] }>(conn, "/receivables"),
      ]);
      setRows(list.transactions.map(toRow));
      setItems(
        new Map(
          Object.entries(list.installments).map(([id, i]) => [
            id,
            { id, invoiceNumber: i.invoiceNumber, customerName: i.customerName, dueDate: i.dueDate, kind: i.kind === "CREDIT_NOTE" ? "credit_note" : "invoice" },
          ]),
        ),
      );
      setBalances(rec.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }, [conn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const guarded = async (work: () => Promise<Outcome>): Promise<Outcome> => {
    try {
      const outcome = await work();
      await refresh();
      return outcome;
    } catch (e) {
      return { title: "Something went wrong", description: e instanceof Error ? e.message : undefined, error: true };
    }
  };
  const runMatching = () => apiFetch<RunSummary>(conn!, "/match/run", postJson({}));
  const upload = (path: string, file: File, fallbackType: string) =>
    apiFetch<Record<string, unknown>>(conn!, path, { method: "POST", headers: { "content-type": file.type || fallbackType }, body: file });

  return {
    mode: "live",
    loading,
    error,
    today: todayIso(),
    rows,
    items,
    balances,
    owners: null,
    confirm: (_row, c) =>
      guarded(async () => {
        const res = await apiFetch<{ lessons: string[]; rerun: RunSummary }>(
          conn!,
          `/match/transactions/${_row.tx.id}/confirm`,
          postJson({ allocations: c.allocations.map((a) => ({ installmentId: a.itemId, amountCents: a.amount })) }),
        );
        return { title: "Match confirmed", description: joinNotes([...res.lessons.map((l) => `Learned: ${l}`), moreAuto(res.rerun.auto)]) };
      }),
    ignore: (row) => guarded(async () => (await apiFetch(conn!, `/match/transactions/${row.tx.id}/ignore`, { method: "POST" }), { title: "Marked as not a customer payment" })),
    undo: (row) => guarded(async () => (await apiFetch(conn!, `/match/transactions/${row.tx.id}/unmatch`, { method: "POST" }), { title: "Match undone", description: "It will wait for your review from now on." })),
    uploadStatement: (file) =>
      guarded(async () => {
        const res = await upload("/bank/statements", file, "text/csv");
        const run = await runMatching();
        return { title: `Imported ${plural(Number(res.imported), "transaction")}`, description: joinNotes([res.duplicates ? `${res.duplicates} already imported` : "", describeRun(run) ?? ""]) };
      }),
    uploadInvoices: (file) =>
      guarded(async () => {
        const res = await upload("/invoices/import", file, "application/octet-stream");
        const run = await runMatching();
        const skipped = Array.isArray(res.skipped) ? res.skipped.length : 0;
        return {
          title: `Imported ${plural(Number(res.created), "invoice")}`,
          description: joinNotes([res.existing ? `${res.existing} already there` : "", res.purchases ? `${res.purchases} supplier invoices skipped` : "", skipped ? `${skipped} files not read` : "", describeRun(run) ?? ""]),
        };
      }),
    run: () => guarded(async () => ({ title: "Matching done", description: describeRun(await runMatching()) ?? "Nothing new to match" })),
  };
}
