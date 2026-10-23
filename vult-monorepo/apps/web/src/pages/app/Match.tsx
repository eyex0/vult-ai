import { formatEuro, type BankTransaction, type Candidate, type Proposal } from "@vult/match";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, Check, FileText, FileUp, Loader2, Play, Plug, RotateCcw, Sparkles, Undo2, Unplug, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePage } from "@/components/app/PageMeta";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { COMMISSION_RATE } from "@/data/matchDemo";
import { useDemoMatch, useLiveMatch, type DisplayItem, type MatchModel, type MatchRow, type Outcome } from "@/data/matchSources";
import { memberName } from "@/data/selectors";
import { useDB } from "@/data/store";
import { API_MODE, apiFetch, clearConnection, DEFAULT_API_URL, getConnection, saveConnection, sessionConnection, type ApiConnection } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Items = Map<string, DisplayItem>;

const Spinner = () => <Loader2 aria-label="Loading" className="size-3.5 animate-spin text-app-dim" />;

function notify(o: Outcome | void) {
  if (!o) return;
  (o.error ? toast.error : toast.success)(o.title, { description: o.description });
}

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

function Allocations({ allocations, items }: { allocations: { itemId: string; amount: number }[]; items: Items }) {
  return (
    <ul className="flex flex-col gap-1">
      {allocations.map((a) => {
        const item = items.get(a.itemId);
        const credit = item?.kind === "credit_note";
        return (
          <li key={a.itemId} className="flex items-center justify-between gap-3 rounded-lg border border-app-line-soft bg-app-raise px-2.5 py-1.5 text-[13px]">
            <span className="min-w-0 truncate">
              {item ? (
                <>
                  <span className={cn("font-medium", credit ? "text-[#f6b67a]" : "text-white")}>{credit ? "Credit note" : "FT"} {item.invoiceNumber.replace(/^NC\s*/, "")}</span>
                  <span className="text-app-mute"> · {item.customerName}</span>
                  <span className="text-app-mute"> · due {formatDate(item.dueDate)}</span>
                </>
              ) : (
                <span className="text-app-mute">Invoice no longer open</span>
              )}
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

function ReviewCard({ row, items, onConfirm, onIgnore }: { row: MatchRow; items: Items; onConfirm: (c: Candidate) => Promise<void>; onIgnore: () => Promise<void> }) {
  const proposal: Proposal = row.proposal ?? { transactionId: row.tx.id, kind: "payment", status: "unmatched", best: null, alternatives: [] };
  const options = [proposal.best, ...proposal.alternatives].filter((c): c is Candidate => !!c);
  const [pick, setPick] = useState(0);
  const [busy, setBusy] = useState(false);
  const chosen = options[pick];
  const act = (work: () => Promise<void>) => async () => {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  };
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }} className="flex flex-col gap-3 rounded-xl border border-app-line bg-app-panel p-4">
      <TxHeader tx={row.tx} />
      {chosen ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-app-mute">{options.length > 1 ? `Suggestion ${pick + 1} of ${options.length}` : "Suggestion"}</span>
            <ConfidenceBar value={chosen.confidence} />
          </div>
          <Allocations allocations={chosen.allocations} items={items} />
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
          <Button size="sm" variant="accent" disabled={busy} onClick={act(() => onConfirm(chosen))}>
            {busy ? <Spinner /> : <Check className="size-3.5" />} Confirm
          </Button>
        )}
        {options.length > 1 && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setPick((pick + 1) % options.length)}>
            <ArrowLeftRight className="size-3.5" /> Other option
          </Button>
        )}
        <Button size="sm" variant="ghost" className="ml-auto" disabled={busy} onClick={act(onIgnore)}>
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

function ConnectModal({ open, onOpenChange, onConnected }: { open: boolean; onOpenChange: (v: boolean) => void; onConnected: (c: ApiConnection) => void }) {
  const [url, setUrl] = useState(() => getConnection()?.url ?? DEFAULT_API_URL);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const connect = async () => {
    const conn = { url: url.trim().replace(/\/+$/, ""), token: token.trim() };
    if (!/^https?:\/\//.test(conn.url)) return setError("Enter the API address, starting with http:// or https://");
    if (!conn.token) return setError("Paste the workspace token.");
    setTesting(true);
    setError("");
    try {
      await apiFetch(conn, "/match/transactions?status=MATCHED");
      saveConnection(conn);
      onConnected(conn);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setTesting(false);
    }
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Connect to your workspace"
      description="Use your own invoices and bank movements instead of the demo. The token stays in this browser."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="accent" disabled={testing} onClick={() => void connect()}>
            {testing && <Spinner />} Connect
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="API address">{(p) => <Input {...p} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com" />}</Field>
        <Field label="Workspace token" error={error || false} hint={<>Ask your admin, or run <code className="font-mono">pnpm --filter @vult/api-server token -- --tenant &lt;id&gt;</code></>}>
          {(p) => <Input {...p} type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="eyJ…" />}
        </Field>
      </div>
    </Modal>
  );
}

export default function MatchPage() {
  usePage({ title: "Match", icon: ArrowLeftRight });
  const db = useDB();
  // Signed in against the API: always live. Demo build: live only after an admin pastes a token.
  const [conn, setConn] = useState<ApiConnection | null>(() => (API_MODE ? sessionConnection : getConnection()));
  const demo = useDemoMatch();
  const live = useLiveMatch(conn);
  const model: MatchModel = conn ? live : demo;
  const [tab, setTab] = useState("review");
  const [connectOpen, setConnectOpen] = useState(false);
  const statementRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const rows = model.rows;
  const incoming = rows.filter((r) => r.tx.amount > 0 || r.proposal?.kind === "riba_return");
  const review = rows.filter((r) => r.status === "review");
  const unmatched = rows.filter((r) => r.status === "unmatched");
  const matched = rows.filter((r) => r.status === "auto" || r.status === "confirmed").sort((a, b) => b.tx.date.localeCompare(a.tx.date));
  const autoCount = rows.filter((r) => r.status === "auto").length;
  const collected = model.balances.reduce((s, b) => s + b.collected, 0);
  const overdue = model.balances.reduce((s, b) => s + b.overdue, 0);

  const disconnect = () => {
    clearConnection();
    setConn(null);
    toast("Back to demo data");
  };
  const pickFile = (handler: ((f: File) => Promise<Outcome>) | undefined) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && handler) notify(await handler(file));
  };

  const owners = model.owners;
  const commissions = owners
    ? [...model.balances.reduce((m, b) => {
        const owner = owners.get(b.customerVat) ?? "m1";
        const row = m.get(owner) ?? { owner, collected: 0, customers: 0 };
        row.collected += b.collected;
        row.customers++;
        return m.set(owner, row);
      }, new Map<string, { owner: string; collected: number; customers: number }>()).values()].sort((a, b) => b.collected - a.collected)
    : [];

  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto flex max-w-[1040px] flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Payments matched to invoices</h1>
              {model.mode === "live" ? (
                <Badge dark tone="green" dot title={conn?.url}>Live</Badge>
              ) : (
                <Badge dark tone="neutral">Demo data</Badge>
              )}
              {model.loading && <Spinner />}
            </div>
            <p className="mt-1 max-w-xl text-sm text-app-dim">Vult reads your SDI invoices and bank movements and matches them by itself. Confirm the few it is unsure about and it learns for next time.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={statementRef} type="file" accept={model.mode === "live" ? ".csv,.xml,text/csv,application/xml" : ".csv,text/csv"} className="hidden" onChange={pickFile(model.uploadStatement)} />
            <input ref={invoiceRef} type="file" accept=".xml,.p7m,.zip" className="hidden" onChange={pickFile(model.uploadInvoices)} />
            {model.uploadInvoices && (
              <Button size="sm" variant="secondary" onClick={() => invoiceRef.current?.click()}>
                <FileText className="size-3.5" /> Upload invoices
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => statementRef.current?.click()}>
              <FileUp className="size-3.5" /> {model.mode === "live" ? "Upload bank statement" : "Upload bank CSV"}
            </Button>
            {model.run && (
              <Button size="sm" variant="ghost" onClick={async () => notify(await model.run!())}>
                <Play className="size-3.5" /> Run matching
              </Button>
            )}
            {model.reset && (
              <Button size="sm" variant="ghost" onClick={() => notify(model.reset!())}>
                <RotateCcw className="size-3.5" /> Reset demo
              </Button>
            )}
            {API_MODE ? null : model.mode === "live" ? (
              <Button size="sm" variant="ghost" onClick={disconnect}>
                <Unplug className="size-3.5" /> Disconnect
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConnectOpen(true)}>
                <Plug className="size-3.5" /> Connect API
              </Button>
            )}
          </div>
        </div>

        {model.error && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#5a2a2a] bg-[rgb(240_82_82/0.08)] px-4 py-3 text-sm text-[#f59090]">
            <span className="flex-1">{model.error}</span>
            {!API_MODE && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setConnectOpen(true)}>Check connection</Button>
                <Button size="sm" variant="ghost" onClick={disconnect}>Use demo data</Button>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Matched automatically" value={`${incoming.length ? Math.round((autoCount / incoming.length) * 100) : 0}%`} sub={`${autoCount} of ${incoming.length} incoming`} tone="#6fe3a5" />
          <Stat label="To review" value={String(review.length)} sub="One click each" tone={review.length ? "#f6b67a" : undefined} />
          <Stat label="Collected" value={formatEuro(collected)} sub={matched.length === 1 ? "1 payment" : `${matched.length} payments`} />
          <Stat label="Overdue" value={formatEuro(overdue)} sub={`as of ${formatDate(model.today)}`} tone={overdue ? "#f59090" : undefined} />
        </div>

        <Tabs
          value={tab}
          onValueChange={setTab}
          items={[
            { value: "review", label: "To review", count: review.length },
            { value: "matched", label: "Matched", count: matched.length },
            { value: "unmatched", label: "Unmatched", count: unmatched.length },
            { value: "customers", label: "Customers" },
            ...(owners ? [{ value: "commissions", label: "Commissions" }] : []),
          ]}
        />

        {model.mode === "live" && !model.loading && !rows.length && !model.error && (
          <EmptyState icon={FileUp} title="Start with your own data">
            Upload your invoices (XML, .p7m, or the ZIP from the Agenzia delle Entrate portal), then a bank statement (camt.053 or CSV). Vult matches them right away.
          </EmptyState>
        )}

        {tab === "review" && !!rows.length && (
          review.length ? (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false} mode="popLayout">
                {review.map((r) => (
                  <ReviewCard key={r.tx.id} row={r} items={model.items} onConfirm={async (c) => notify(await model.confirm(r, c))} onIgnore={async () => notify(await model.ignore(r))} />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <EmptyState icon={Check} title="Nothing to review">Every payment is matched. New bank movements will show up here when Vult is unsure.</EmptyState>
          )
        )}

        {tab === "matched" && (
          <ul className="flex flex-col gap-2">
            {matched.map((r) => (
              <motion.li key={r.tx.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2.5 rounded-xl border border-app-line bg-app-panel p-4">
                <TxHeader tx={r.tx} />
                <Allocations allocations={r.applied ?? []} items={model.items} />
                <div className="flex flex-wrap items-center gap-2">
                  {r.status === "auto" ? (
                    <Badge dark tone="green"><Sparkles className="size-3" /> Matched automatically</Badge>
                  ) : (
                    <Badge dark tone="blue"><Check className="size-3" /> Confirmed by you</Badge>
                  )}
                  {r.status === "auto" && r.proposal?.best && <Reasons candidate={r.proposal.best} />}
                  {(r.status === "confirmed" || model.mode === "live") && (
                    <Button size="sm" variant="ghost" className="ml-auto" onClick={async () => notify(await model.undo(r))}>
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
                {unmatched.map((r) => (
                  <ReviewCard key={r.tx.id} row={r} items={model.items} onConfirm={async (c) => notify(await model.confirm(r, c))} onIgnore={async () => notify(await model.ignore(r))} />
                ))}
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
                {model.balances.map((b) => (
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

        {tab === "commissions" && owners && (
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
      </div>
      <ConnectModal open={connectOpen} onOpenChange={setConnectOpen} onConnected={(c) => { setConn(c); toast.success("Connected", { description: c.url }); }} />
    </div>
  );
}
