import {
  emptyMemory,
  formatEuro,
  learn,
  parseBankCsv,
  reconcile,
  summarizeCustomers,
  type AppliedPayment,
  type BankTransaction,
  type Candidate,
  type MatchMemory,
  type OpenItem,
  type Proposal,
} from "@vult/match";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Check, FileUp, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { usePage } from "@/components/app/PageMeta";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { COMMISSION_RATE, DEMO_CUSTOMERS, DEMO_ITEMS, DEMO_TRANSACTIONS, MATCH_TODAY } from "@/data/matchDemo";
import { memberName } from "@/data/selectors";
import { useDB } from "@/data/store";
import { formatDate } from "@/lib/format";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";

const KEY = "match.v1";

interface Confirmed {
  allocations: { itemId: string; amount: number }[];
  at: string;
}

interface MatchState {
  memory: MatchMemory;
  confirmed: Record<string, Confirmed>;
  ignored: string[];
  uploaded: BankTransaction[];
}

const initial = (): MatchState => ({ memory: emptyMemory(), confirmed: {}, ignored: [], uploaded: [] });

function useMatchState() {
  const [state, setState] = useState<MatchState>(() => ({ ...initial(), ...readJSON<Partial<MatchState>>(KEY, {}) }));
  const update = (next: MatchState) => {
    setState(next);
    writeJSON(KEY, next);
  };
  return [state, update] as const;
}

/** Everything the page shows, recomputed from the demo data, the uploaded rows and what the person decided. */
function useReconciliation(state: MatchState) {
  return useMemo(() => {
    const transactions = [...DEMO_TRANSACTIONS, ...state.uploaded];
    const byTx = new Map(transactions.map((t) => [t.id, t]));
    const items = new Map(DEMO_ITEMS.map((i) => [i.id, i]));
    const paid: Record<string, number> = {};
    const payments: AppliedPayment[] = [];
    const applyAlloc = (txId: string, allocations: { itemId: string; amount: number }[]) => {
      const date = byTx.get(txId)?.date ?? MATCH_TODAY;
      for (const a of allocations) {
        const item = items.get(a.itemId);
        if (!item) continue;
        paid[a.itemId] = (paid[a.itemId] ?? 0) + (item.kind === "credit_note" ? Math.abs(a.amount) : a.amount);
        payments.push({ itemId: a.itemId, amount: a.amount, date });
      }
    };
    for (const [txId, c] of Object.entries(state.confirmed)) applyAlloc(txId, c.allocations);
    const pending = transactions.filter((t) => !state.confirmed[t.id] && !state.ignored.includes(t.id));
    const { proposals } = reconcile({ items: DEMO_ITEMS, transactions: pending, paid, memory: state.memory });
    for (const p of proposals) if (p.status === "auto" && p.best) applyAlloc(p.transactionId, p.best.allocations);
    const byId = new Map(proposals.map((p) => [p.transactionId, p]));
    return { transactions, byTx, items, proposals: byId, payments, balances: summarizeCustomers(DEMO_ITEMS, payments, MATCH_TODAY) };
  }, [state]);
}

type View = ReturnType<typeof useReconciliation>;

const confidenceTone = (c: number): BadgeTone => (c >= 0.85 ? "green" : c >= 0.6 ? "blue" : c >= 0.45 ? "amber" : "neutral");

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.85 ? "#3ddc84" : value >= 0.6 ? "#6f87ff" : value >= 0.45 ? "#f2994a" : "#8a8d96";
  return (
    <span className="flex items-center gap-2" title={`Confidence ${Math.round(value * 100)}%`}>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-app-line">
        <motion.span className="block h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.round(value * 100)}%` }} transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }} />
      </span>
      <span className="tabular w-8 text-xs text-app-dim">{Math.round(value * 100)}%</span>
    </span>
  );
}

function Allocations({ candidate, items }: { candidate: Pick<Candidate, "allocations">; items: View["items"] }) {
  return (
    <ul className="flex flex-col gap-1">
      {candidate.allocations.map((a) => {
        const item = items.get(a.itemId);
        if (!item) return null;
        const credit = item.kind === "credit_note";
        return (
          <li key={a.itemId} className="flex items-center justify-between gap-3 rounded-lg border border-app-line-soft bg-app-raise px-2.5 py-1.5 text-[13px]">
            <span className="min-w-0 truncate">
              <span className={cn("font-medium", credit ? "text-[#f6b67a]" : "text-white")}>{credit ? "Credit note" : "FT"} {item.invoiceNumber.replace(/^NC\s*/, "")}</span>
              <span className="text-app-mute"> · {item.customerName}</span>
              <span className="text-app-mute"> · due {formatDate(item.dueDate)}</span>
            </span>
            <span className={cn("tabular shrink-0", a.amount < 0 ? "text-[#f59090]" : "text-app-text")}>{formatEuro(a.amount)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Reasons({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {candidate.reasons.map((r) => (
        <Badge key={r.code + r.label} dark tone={r.code === "ambiguous" || r.code === "partial" ? "amber" : r.code === "riba_return" ? "red" : r.code.startsWith("known") ? "violet" : "neutral"}>
          {r.code.startsWith("known") && <Sparkles aria-hidden className="size-3" />}
          {r.label}
        </Badge>
      ))}
    </div>
  );
}

function TxHeader({ tx }: { tx: BankTransaction }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Avatar name={tx.counterpartyName || "?"} size={32} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{tx.counterpartyName || "Unknown payer"}</p>
        <p className="truncate font-mono text-[12px] text-app-mute">{tx.description || "—"}</p>
        <p className="mt-0.5 text-xs text-app-mute">{formatDate(tx.date, { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>
      <span className={cn("tabular ml-auto shrink-0 text-[15px] font-semibold", tx.amount < 0 ? "text-[#f59090]" : "text-[#6fe3a5]")}>
        {tx.amount > 0 ? "+" : ""}
        {formatEuro(tx.amount)}
      </span>
    </div>
  );
}

function ReviewCard({ tx, proposal, view, onConfirm, onIgnore }: { tx: BankTransaction; proposal: Proposal; view: View; onConfirm: (c: Candidate) => void; onIgnore: () => void }) {
  const options = [proposal.best, ...proposal.alternatives].filter((c): c is Candidate => !!c);
  const [pick, setPick] = useState(0);
  const chosen = options[pick];
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }} className="flex flex-col gap-3 rounded-xl border border-app-line bg-app-panel p-4">
      <TxHeader tx={tx} />
      {chosen ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-app-mute">{options.length > 1 ? `Suggestion ${pick + 1} of ${options.length}` : "Suggestion"}</span>
            <ConfidenceBar value={chosen.confidence} />
          </div>
          <Allocations candidate={chosen} items={view.items} />
          {chosen.difference !== 0 && (
            <p className="text-xs text-app-mute">
              Difference {formatEuro(chosen.difference)} — {chosen.difference < 0 ? "written off as fee or discount" : "paid in excess"}
            </p>
          )}
          <Reasons candidate={chosen} />
        </>
      ) : (
        <p className="text-sm text-app-dim">No open invoice fits this payment.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {chosen && (
          <Button size="sm" variant="accent" onClick={() => onConfirm(chosen)}>
            <Check className="size-3.5" /> Confirm
          </Button>
        )}
        {options.length > 1 && (
          <Button size="sm" variant="ghost" onClick={() => setPick((pick + 1) % options.length)}>
            <ArrowLeftRight className="size-3.5" /> Other option
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onIgnore}>
          <X className="size-3.5" /> Not a customer payment
        </Button>
      </div>
    </motion.li>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-app-line bg-app-panel px-4 py-3">
      <p className="text-xs text-app-mute">{label}</p>
      <p className="tabular mt-1 text-[22px] font-semibold tracking-[-0.02em]" style={tone ? { color: tone } : undefined}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-app-mute">{sub}</p>}
    </div>
  );
}

export default function MatchPage() {
  usePage({ title: "Match", icon: ArrowLeftRight });
  const db = useDB();
  const [state, setState] = useMatchState();
  const view = useReconciliation(state);
  const [tab, setTab] = useState("review");
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = view.transactions.map((tx) => {
    const p = view.proposals.get(tx.id);
    const confirmed = state.confirmed[tx.id];
    const ignored = state.ignored.includes(tx.id) || p?.kind === "outgoing";
    const status = confirmed ? "confirmed" : ignored ? "ignored" : p?.status ?? "unmatched";
    return { tx, p, confirmed, status };
  });
  const incoming = rows.filter((r) => r.tx.amount > 0 || r.p?.kind === "riba_return");
  const review = rows.filter((r) => r.status === "review");
  const unmatched = rows.filter((r) => r.status === "unmatched");
  const matched = rows.filter((r) => r.status === "auto" || r.status === "confirmed").sort((a, b) => b.tx.date.localeCompare(a.tx.date));
  const autoCount = rows.filter((r) => r.status === "auto").length;
  const collected = view.balances.reduce((s, b) => s + b.collected, 0);
  const overdue = view.balances.reduce((s, b) => s + b.overdue, 0);

  const confirm = (tx: BankTransaction, c: Candidate) => {
    const settled = c.allocations.map((a) => view.items.get(a.itemId)).filter((i): i is OpenItem => !!i);
    const { memory, lessons } = learn(state.memory, tx, settled);
    const next: MatchState = { ...state, memory, confirmed: { ...state.confirmed, [tx.id]: { allocations: c.allocations, at: new Date().toISOString() } } };
    // How many more payments the engine now matches by itself thanks to what it just learned.
    const before = new Set(rows.filter((r) => r.status === "auto").map((r) => r.tx.id));
    const pending = view.transactions.filter((t) => !next.confirmed[t.id] && !next.ignored.includes(t.id));
    const paid: Record<string, number> = {};
    for (const conf of Object.values(next.confirmed)) for (const a of conf.allocations) {
      const item = view.items.get(a.itemId);
      if (item) paid[a.itemId] = (paid[a.itemId] ?? 0) + (item.kind === "credit_note" ? Math.abs(a.amount) : a.amount);
    }
    const after = reconcile({ items: DEMO_ITEMS, transactions: pending, paid, memory }).proposals.filter((p) => p.status === "auto" && !before.has(p.transactionId)).length;
    setState(next);
    toast.success("Match confirmed", {
      description: [...lessons.map((l) => `Learned: ${l}`), after ? (after > 1 ? `${after} more payments now match automatically` : "1 more payment now matches automatically") : ""].filter(Boolean).join(" · ") || undefined,
    });
  };
  const ignore = (tx: BankTransaction) => setState({ ...state, ignored: [...state.ignored, tx.id] });
  const undo = (tx: BankTransaction) => {
    const { [tx.id]: _, ...confirmedRest } = state.confirmed;
    setState({ ...state, confirmed: confirmedRest, ignored: state.ignored.filter((id) => id !== tx.id) });
  };
  const upload = async (file: File) => {
    const { transactions, skipped } = parseBankCsv(await file.text());
    const known = new Set(view.transactions.map((t) => t.id));
    const fresh = transactions.filter((t) => !known.has(t.id));
    setState({ ...state, uploaded: [...state.uploaded, ...fresh] });
    if (!transactions.length) toast.error("No transactions found in this file", { description: skipped[0]?.reason });
    else toast.success(`Imported ${fresh.length} transactions`, { description: skipped.length ? `${skipped.length} rows skipped` : undefined });
  };
  const reset = () => {
    removeKey(KEY);
    setState(initial());
    toast("Demo reset");
  };

  const owners = new Map<string, string>(DEMO_CUSTOMERS.map((c) => [c.vat, c.ownerId]));
  const commissions = [...view.balances.reduce((m, b) => {
    const owner = owners.get(b.customerVat) ?? "m1";
    const row = m.get(owner) ?? { owner, collected: 0, customers: 0 };
    row.collected += b.collected;
    row.customers++;
    return m.set(owner, row);
  }, new Map<string, { owner: string; collected: number; customers: number }>()).values()].sort((a, b) => b.collected - a.collected);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex max-w-[1040px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Payments matched to invoices</h1>
            <p className="mt-1 max-w-xl text-sm text-app-dim">Vult reads your SDI invoices and bank movements and matches them by itself. Confirm the few it is unsure about and it learns for next time.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <FileUp className="size-3.5" /> Upload bank CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw className="size-3.5" /> Reset demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Matched automatically" value={`${incoming.length ? Math.round((autoCount / incoming.length) * 100) : 0}%`} sub={`${autoCount} of ${incoming.length} incoming`} tone="#6fe3a5" />
          <Stat label="To review" value={String(review.length)} sub="One click each" tone={review.length ? "#f6b67a" : undefined} />
          <Stat label="Collected" value={formatEuro(collected)} sub={`${matched.length} payments`} />
          <Stat label="Overdue" value={formatEuro(overdue)} sub={`as of ${formatDate(MATCH_TODAY)}`} tone={overdue ? "#f59090" : undefined} />
        </div>

        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "review", label: "To review", count: review.length },
            { value: "matched", label: "Matched", count: matched.length },
            { value: "unmatched", label: "Unmatched", count: unmatched.length },
            { value: "customers", label: "Customers" },
            { value: "commissions", label: "Commissions" },
          ]}
        />

        {tab === "review" && (
          review.length ? (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {review.map((r) => <ReviewCard key={r.tx.id} tx={r.tx} proposal={r.p!} view={view} onConfirm={(c) => confirm(r.tx, c)} onIgnore={() => ignore(r.tx)} />)}
              </AnimatePresence>
            </ul>
          ) : (
            <EmptyState icon={Check} title="Nothing to review">Every payment is matched. New bank movements will show up here when Vult is unsure.</EmptyState>
          )
        )}

        {tab === "matched" && (
          <ul className="flex flex-col gap-2">
            {matched.map(({ tx, p, confirmed, status }) => (
              <motion.li key={tx.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2.5 rounded-xl border border-app-line bg-app-panel p-4">
                <TxHeader tx={tx} />
                <Allocations candidate={confirmed ?? p!.best!} items={view.items} />
                <div className="flex flex-wrap items-center gap-2">
                  {status === "auto" ? <Badge dark tone="green"><Sparkles className="size-3" /> Matched automatically</Badge> : <Badge dark tone="blue"><Check className="size-3" /> Confirmed by you</Badge>}
                  {status === "auto" && p?.best && <Reasons candidate={p.best} />}
                  {status === "confirmed" && (
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={() => undo(tx)}>
                      <Undo2 className="size-3.5" /> Undo
                    </Button>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        )}

        {tab === "unmatched" && (
          unmatched.length ? (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {unmatched.map((r) => <ReviewCard key={r.tx.id} tx={r.tx} proposal={r.p ?? { transactionId: r.tx.id, kind: "payment", status: "unmatched", best: null, alternatives: [] }} view={view} onConfirm={(c) => confirm(r.tx, c)} onIgnore={() => ignore(r.tx)} />)}
              </AnimatePresence>
            </ul>
          ) : (
            <EmptyState icon={Check} title="No unmatched payments" />
          )
        )}

        {tab === "customers" && (
          <div className="overflow-x-auto rounded-xl border border-app-line">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead className="bg-app-raise text-left text-xs text-app-mute">
                <tr>{["Customer", "Billed", "Collected", "Open", "Overdue", "Pays", "Last payment"].map((h, i) => <th key={h} className={cn("px-3 py-2 font-medium", i > 0 && i < 5 && "text-right")}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {view.balances.map((b) => (
                  <tr key={b.customerVat} className="border-t border-app-line-soft">
                    <td className="px-3 py-2.5"><span className="font-medium text-white">{b.customerName}</span><span className="block text-xs text-app-mute">P.IVA {b.customerVat}</span></td>
                    <td className="tabular px-3 text-right">{formatEuro(b.billed)}</td>
                    <td className="tabular px-3 text-right text-[#6fe3a5]">{formatEuro(b.collected)}</td>
                    <td className="tabular px-3 text-right">{formatEuro(b.open)}</td>
                    <td className={cn("tabular px-3 text-right", b.overdue ? "text-[#f59090]" : "text-app-mute")}>{formatEuro(b.overdue)}</td>
                    <td className="px-3">{b.avgDaysLate === null ? <span className="text-app-mute">—</span> : <Badge dark tone={b.avgDaysLate <= 0 ? "green" : b.avgDaysLate <= 15 ? "amber" : "red"}>{b.avgDaysLate === 0 ? "On time" : b.avgDaysLate < 0 ? `${-b.avgDaysLate}d early` : `${b.avgDaysLate}d late`}</Badge>}</td>
                    <td className="px-3 text-app-dim">{b.lastPayment ? formatDate(b.lastPayment) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "commissions" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-app-dim">Commission of {COMMISSION_RATE * 100}% on money actually collected, per account owner. No spreadsheet, no disputes: every euro links to an invoice and a bank movement.</p>
            <div className="overflow-x-auto rounded-xl border border-app-line">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead className="bg-app-raise text-left text-xs text-app-mute">
                  <tr><th className="px-3 py-2 font-medium">Agent</th><th className="px-3 py-2 font-medium">Customers</th><th className="px-3 py-2 text-right font-medium">Collected</th><th className="px-3 py-2 text-right font-medium">Commission</th></tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.owner} className="border-t border-app-line-soft">
                      <td className="flex items-center gap-2 px-3 py-2.5"><Avatar name={memberName(db, c.owner)} size={24} /><span className="font-medium text-white">{memberName(db, c.owner)}</span></td>
                      <td className="px-3 text-app-dim">{c.customers}</td>
                      <td className="tabular px-3 text-right">{formatEuro(c.collected)}</td>
                      <td className="tabular px-3 text-right font-semibold text-white">{formatEuro(Math.round(c.collected * COMMISSION_RATE))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!!review.length && tab !== "review" && (
          <p className="text-center text-xs text-app-mute">
            <Badge dark tone={confidenceTone(0.5)}>{review.length} to review</Badge>
          </p>
        )}
      </div>
    </div>
  );
}
