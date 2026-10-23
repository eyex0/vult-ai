import { emptyMemory, formatEuro, reconcile, type BankTransaction, type OpenItem } from "@vult/match";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Database, FileCheck2, Landmark, Lock, Mail, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GlowCTA, Reveal, RevealGroup, RevealItem, SectionIntro, TwoTone } from "@/components/marketing/Section";
import { Eyebrow } from "@/components/ui/Badge";
import { EASE } from "@/lib/motion";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Hero: the whole system as one animated map. Money and documents flow left to right.

const SOURCES = [
  { y: 50, title: "SDI e-invoices", sub: "FatturaPA XML · signed .p7m · AdE ZIP" },
  { y: 160, title: "Bank statements", sub: "camt.052 / 053 / 054 · CSV" },
  { y: 270, title: "Payments", sub: "Transfers · Ri.Ba. · returns" },
  { y: 380, title: "Email & calendar", sub: "Coming", soon: true },
];
const CORE = [
  { y: 110, title: "Ingestion", sub: "Parse, verify, deduplicate" },
  { y: 210, title: "Match engine", sub: "Payments ↔ invoices, learns" },
  { y: 310, title: "Workspace graph", sub: "Postgres · row-level security" },
];
const OUTPUTS = [
  { y: 50, title: "CRM", sub: "Revenue on every company" },
  { y: 160, title: "Agents", sub: "Reorders, late payers" },
  { y: 270, title: "Reports", sub: "Billed vs pipeline" },
  { y: 380, title: "API", sub: "Your tools, your data" },
];
const NODE_W = 236;
const NODE_H = 64;

const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;

function MapNode({ x, y, title, sub, soon, dark }: { x: number; y: number; title: string; sub: string; soon?: boolean; dark?: boolean }) {
  return (
    <g opacity={soon ? 0.55 : 1}>
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={14} fill={dark ? "#17181c" : "#141519"} stroke={soon ? "#2a2c33" : "#30323a"} strokeDasharray={soon ? "4 4" : undefined} />
      <text x={x + 18} y={y + 27} fill="#f1f2f5" fontSize="15" fontWeight={600}>{title}</text>
      <text x={x + 18} y={y + 47} fill="#8a8f9a" fontSize="12">{sub}</text>
    </g>
  );
}

function SystemMap() {
  const reduce = useReducedMotion();
  const coreX = 482;
  const coreW = 236;
  const inPaths = SOURCES.flatMap((s, i) => (s.soon ? [] : [{ id: `in${i}`, d: curve(40 + NODE_W, s.y + NODE_H / 2, coreX, CORE[0]!.y + NODE_H / 2) }]));
  const outPaths = OUTPUTS.map((o, i) => ({ id: `out${i}`, d: curve(coreX + coreW, CORE[2]!.y + NODE_H / 2, 924, o.y + NODE_H / 2) }));
  return (
    <svg viewBox="0 0 1200 470" role="img" aria-label="Vult architecture: SDI invoices and bank statements flow into ingestion, the match engine and the workspace graph, which feed the CRM, agents, reports and the API." className="h-auto w-full">
      <defs>
        <linearGradient id="core-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#266df0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6e5aff" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id="dot">
          <stop offset="0" stopColor="#9fc1ff" />
          <stop offset="1" stopColor="#266df0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[...inPaths, ...outPaths].map((p) => (
        <path key={p.id} id={p.id} d={p.d} fill="none" stroke="#2a3550" strokeWidth={1.5} />
      ))}
      {/* Dashed connector for what is not built yet. */}
      <path d={curve(40 + NODE_W, SOURCES[3]!.y + NODE_H / 2, coreX, CORE[0]!.y + NODE_H / 2)} fill="none" stroke="#2a2c33" strokeWidth={1.5} strokeDasharray="4 6" />
      {!reduce &&
        [...inPaths, ...outPaths].map((p, i) => (
          <circle key={`dot-${p.id}`} r={5} fill="url(#dot)">
            <animateMotion dur={`${2.6 + (i % 3) * 0.5}s`} begin={`${(i * 0.37) % 2}s`} repeatCount="indefinite">
              <mpath href={`#${p.id}`} />
            </animateMotion>
          </circle>
        ))}
      {/* Core: three stages, joined by short animated links. */}
      <rect x={coreX - 22} y={78} width={coreW + 44} height={330} rx={24} fill="url(#core-glow)" stroke="#2f4f9a" />
      <text x={coreX + coreW / 2} y={100} textAnchor="middle" fill="#9fb8ff" fontSize="11" fontWeight={600} letterSpacing="0.14em">VULT CORE</text>
      {CORE.slice(0, 2).map((c, i) => (
        <line key={c.title} x1={coreX + coreW / 2} y1={c.y + NODE_H} x2={coreX + coreW / 2} y2={CORE[i + 1]!.y} stroke="#4a6fd0" strokeWidth={2} strokeDasharray="3 5">
          {!reduce && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.8s" repeatCount="indefinite" />}
        </line>
      ))}
      {CORE.map((c) => (
        <MapNode key={c.title} x={coreX} y={c.y} title={c.title} sub={c.sub} dark />
      ))}
      {SOURCES.map((s) => (
        <MapNode key={s.title} x={40} {...s} />
      ))}
      {OUTPUTS.map((o) => (
        <MapNode key={o.title} x={924} {...o} />
      ))}
    </svg>
  );
}

/** Small screens: the same map as three stacked columns. */
function SystemList() {
  const col = (title: string, items: { title: string; sub: string; soon?: boolean }[]) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9fb8ff]">{title}</p>
      {items.map((i) => (
        <div key={i.title} className={cn("rounded-xl border border-[#30323a] bg-[#141519] px-4 py-3", i.soon && "border-dashed opacity-60")}>
          <p className="text-[15px] font-semibold text-white">{i.title}</p>
          <p className="text-xs text-[#8a8f9a]">{i.sub}</p>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col gap-6">
      {col("Sources", SOURCES)}
      {col("Vult core", CORE)}
      {col("What you get", OUTPUTS)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Four layers, cycling on their own; click to hold one.

const LAYERS = [
  {
    key: "ingestion",
    icon: FileCheck2,
    title: "Ingestion",
    lead: "Reads the documents Italian businesses actually exchange.",
    points: [
      "FatturaPA invoices, including batch files and credit notes (TD04)",
      "Signed .p7m files unpacked from the CMS envelope, not guessed at",
      "The Agenzia delle Entrate ZIP, with sizes checked before decompressing",
      "Bank statements in camt.052/053/054 and Italian CSV exports",
      "Re-importing the same file adds nothing",
    ],
  },
  {
    key: "engine",
    icon: Sparkles,
    title: "Match engine",
    lead: "Connects every euro in the bank to the invoice it pays.",
    points: [
      "Finds the payer by learned IBAN, parent company, VAT number or name",
      "Reads invoice numbers out of free-text transfer descriptions",
      "Searches combinations: several invoices, minus credit notes, in one transfer",
      "Explains fees, discounts, withholding tax, split payment and Ri.Ba. returns",
      "Learns from every confirmation, so the next one matches by itself",
    ],
  },
  {
    key: "data",
    icon: Database,
    title: "Workspace data",
    lead: "Each company's data is walled off by the database itself.",
    points: [
      "Postgres row-level security, enabled and forced on every table",
      "The app connects with a role that cannot bypass it",
      "A deploy refuses to start if any table is missing its policy",
      "Versioned migrations, checked for drift on every change",
      "Built to run in EU regions",
    ],
  },
  {
    key: "experience",
    icon: Landmark,
    title: "Experience",
    lead: "The CRM, agents and API all read the same verified numbers.",
    points: [
      "Revenue, open and overdue amounts on every company",
      "Commissions on money actually collected",
      "Sessions in httpOnly cookies, CSRF-protected writes",
      "A REST API with tokens for your own tools",
      "Agents that act on money signals (coming)",
    ],
  },
] as const;

function LayerStack() {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "-20% 0px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (held || !visible || reduce) return;
    const t = setInterval(() => setActive((a) => (a + 1) % LAYERS.length), 4200);
    return () => clearInterval(t);
  }, [held, visible, reduce]);
  const layer = LAYERS[active]!;
  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative mx-auto h-[360px] w-full max-w-[520px] [perspective:1200px]" aria-hidden>
        {LAYERS.map((l, i) => {
          const depth = LAYERS.length - 1 - i;
          const on = i === active;
          return (
            <motion.button
              key={l.key}
              type="button"
              tabIndex={-1}
              onClick={() => {
                setActive(i);
                setHeld(true);
              }}
              className={cn(
                "absolute left-1/2 flex h-[110px] w-[86%] -translate-x-1/2 items-center gap-4 rounded-2xl border px-6 text-left [transform-style:preserve-3d]",
                on ? "border-accent bg-white shadow-[0_30px_60px_-24px_rgb(38_109_240/0.45)]" : "border-line bg-soft",
              )}
              style={{ top: 20 + depth * 62, zIndex: on ? 10 : i + 1 }}
              animate={{ rotateX: 52, rotateZ: -8, y: on ? -18 : 0, x: on ? 36 : 0, scale: on ? 1.03 : 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <span className={cn("flex size-10 items-center justify-center rounded-xl border", on ? "border-accent/30 bg-accent-soft text-accent" : "border-line bg-white text-subtle")}>
                <l.icon className="size-5" />
              </span>
              <span className={cn("text-lg font-semibold", on ? "text-ink" : "text-subtle")}>{l.title}</span>
            </motion.button>
          );
        })}
      </div>
      <div>
        <div role="tablist" aria-label="Architecture layers" className="mb-6 flex flex-wrap gap-1.5">
          {LAYERS.map((l, i) => (
            <button
              key={l.key}
              role="tab"
              aria-selected={i === active}
              type="button"
              onClick={() => {
                setActive(i);
                setHeld(true);
              }}
              className={cn("relative h-9 rounded-[10px] px-3 text-sm font-medium transition-colors", i === active ? "text-ink" : "text-subtle hover:text-ink")}
            >
              {i === active && <motion.span layoutId="layer-tab" className="absolute inset-0 rounded-[10px] bg-soft-2" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative">{l.title}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={layer.key} role="tabpanel" initial={{ opacity: 0, y: 8, filter: "blur(2px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32, ease: EASE.outCubic }}>
            <h3 className="display text-[26px] font-medium leading-tight tracking-[-0.02em]">{layer.lead}</h3>
            <ul className="mt-5 flex flex-col gap-2.5">
              {layer.points.map((p, i) => (
                <motion.li key={p} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i + 0.1 }} className="flex gap-2.5 text-[15px] text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The real engine, running in the browser on three sample transfers (fictional companies).

const item = (id: string, vat: string, name: string, number: string, euros: number, due: string, extra: Partial<OpenItem> = {}): OpenItem => ({
  id, invoiceId: id, invoiceNumber: number, invoiceDate: "2026-09-01", customerVat: vat, customerName: name, kind: "invoice", amount: Math.round(euros * 100), dueDate: due, method: "transfer", ...extra,
});
const AURORA = ["00000000101", "Pastificio Aurora S.r.l."] as const;
const BRENTA = ["00000000202", "Officine Brenta S.p.A."] as const;
const LUCE = ["00000000303", "Studio Luce S.n.c."] as const;
const ITEMS: OpenItem[] = [
  item("a1", ...AURORA, "2026/118", 3050, "2026-09-30"),
  item("a2", ...AURORA, "2026/131", 1980, "2026-10-15"),
  item("b1", ...BRENTA, "120", 4000, "2026-09-30"),
  item("b2", ...BRENTA, "125", 2500, "2026-09-30"),
  item("b3", ...BRENTA, "NC 7", 300, "2026-09-20", { kind: "credit_note" }),
  item("r1", ...BRENTA, "141", 2450.5, "2026-10-15", { method: "riba" }),
  item("r2", ...AURORA, "123", 1100, "2026-10-15", { method: "riba" }),
  item("r3", ...LUCE, "124", 610, "2026-10-15", { method: "riba" }),
];
const EXAMPLES: { label: string; tx: BankTransaction }[] = [
  { label: "A known payer", tx: { id: "x1", date: "2026-09-30", amount: 305000, counterpartyName: "PASTIFICIO AURORA S", counterpartyIban: "IT00X0000000000000000000101", description: "BONIFICO SALDO FT 2026/118" } },
  { label: "Two invoices minus a credit note", tx: { id: "x2", date: "2026-10-02", amount: 620000, counterpartyName: "OFFICINE BRENTA SPA", description: "SALDO FT 120 125 MENO NOSTRA NC 7" } },
  { label: "A Ri.Ba. batch from the bank", tx: { id: "x3", date: "2026-10-14", amount: 416050, counterpartyName: "BANCA DEL TERRITORIO", description: "ACCREDITO DISTINTA RIBA SBF N 41" } },
];
const MEMORY = { ...emptyMemory(), ibans: { IT00X0000000000000000000101: AURORA[0] } };

function EngineDemo() {
  const [ex, setEx] = useState(0);
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const { tx } = EXAMPLES[ex]!;
  const proposal = useMemo(() => reconcile({ items: ITEMS, transactions: [tx], memory: MEMORY }).proposals[0]!, [tx]);
  const best = proposal.best;
  const byId = new Map(ITEMS.map((i) => [i.id, i]));
  const payer = best?.reasons.find((r) => ["known_iban", "known_alias", "name", "vat_in_text", "riba_batch"].includes(r.code));
  const refs = best?.reasons.find((r) => r.code === "reference");

  useEffect(() => setStep(reduce ? 4 : 0), [ex, reduce]);
  useEffect(() => {
    if (!visible || reduce || step >= 4) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, visible, reduce]);

  const steps: { title: string; body: ReactNode }[] = [
    { title: "Who paid?", body: payer ? payer.label : "Unknown payer: compared with every customer" },
    { title: "What does the description say?", body: refs ? refs.label : "No invoice number written" },
    {
      title: "Which invoices add up?",
      body: (
        <span className="flex flex-wrap gap-1.5">
          {best?.allocations.map((a) => {
            const i = byId.get(a.itemId)!;
            return (
              <span key={a.itemId} className={cn("rounded-md border px-1.5 py-0.5 text-xs", a.amount < 0 ? "border-[#f3c9a8] bg-[#fdf3ea] text-[#9a4b12]" : "border-line bg-white text-ink")}>
                {i.kind === "credit_note" ? "Credit note" : "FT"} {i.invoiceNumber.replace(/^NC\s*/, "")} · {formatEuro(a.amount)}
              </span>
            );
          })}
        </span>
      ),
    },
    { title: "How sure?", body: best ? `${Math.round(best.confidence * 100)}% — ${best.reasons.filter((r) => r !== payer && r !== refs).map((r) => r.label).join(", ")}` : "No candidate" },
    { title: "Decision", body: proposal.status === "auto" ? "Recorded automatically. The invoices are paid in the CRM." : "Sent to a person for one-click review." },
  ];

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
      <div className="flex flex-col gap-3">
        {EXAMPLES.map((e, i) => (
          <button
            key={e.label}
            type="button"
            onClick={() => setEx(i)}
            aria-pressed={i === ex}
            className={cn("rounded-2xl border p-4 text-left transition-[border-color,box-shadow]", i === ex ? "border-accent bg-white shadow-[0_12px_32px_-18px_rgb(38_109_240/0.5)]" : "border-line bg-white hover:border-line-strong")}
          >
            <p className="text-xs font-medium text-subtle">{e.label}</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{e.tx.counterpartyName}</p>
                <p className="truncate font-mono text-[12px] text-subtle">{e.tx.description}</p>
              </div>
              <span className="tabular shrink-0 font-semibold text-[#0f8a4f]">+{formatEuro(e.tx.amount)}</span>
            </div>
          </button>
        ))}
        <p className="text-xs text-subtle">This is the production matching engine, running in your browser on sample data.</p>
      </div>
      <ol className="relative flex flex-col gap-3 rounded-2xl border border-line bg-soft p-5" aria-live="polite">
        <span aria-hidden className="absolute bottom-8 left-[33px] top-8 w-px bg-line" />
        <motion.span aria-hidden className="absolute left-[33px] top-8 w-px origin-top bg-accent" animate={{ height: `${(step / 4) * 82}%` }} transition={{ duration: 0.6, ease: EASE.outCubic }} />
        {steps.map((s, i) => {
          const done = i <= step;
          return (
            <motion.li key={`${ex}-${i}`} className="relative flex gap-4" initial={false} animate={{ opacity: done ? 1 : 0.35 }} transition={{ duration: 0.3 }}>
              <span className={cn("relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors", done ? "border-accent bg-accent text-white" : "border-line bg-white text-subtle")}>
                {done && (i < step || step >= 4) ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 pb-1">
                <p className="text-[15px] font-semibold text-ink">{s.title}</p>
                <AnimatePresence>
                  {done && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-ink-2">
                      {s.body}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          );
        })}
        {step >= 4 && best && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-1 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span className="block h-full rounded-full bg-[#2bb673]" initial={{ width: 0 }} animate={{ width: `${Math.round(best.confidence * 100)}%` }} transition={{ duration: 0.7, ease: EASE.outCubic }} />
            </span>
            <span className="text-sm font-semibold text-ink">{proposal.status === "auto" ? "Matched automatically" : "To review"}</span>
          </motion.div>
        )}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Isolation: one table, two companies; the database only shows the rows of the signed-in one.

const ROWS = [
  { ws: "A", text: "FT 2026/118 · Pastificio Aurora", amount: "€3,050.00" },
  { ws: "B", text: "FT 88 · Cantina Valpiana", amount: "€12,400.00" },
  { ws: "A", text: "FT 2026/131 · Pastificio Aurora", amount: "€1,980.00" },
  { ws: "B", text: "FT 91 · Hotel Riva", amount: "€860.00" },
  { ws: "A", text: "NC 7 · Officine Brenta", amount: "−€300.00" },
  { ws: "B", text: "FT 95 · Enoteca Lido", amount: "€2,150.00" },
];

function IsolationDemo() {
  const [ws, setWs] = useState<"A" | "B">("A");
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setWs((w) => (w === "A" ? "B" : "A")), 3600);
    return () => clearInterval(t);
  }, [reduce]);
  return (
    <div className="rounded-2xl border border-[#2a2c33] bg-[#111215] p-5 font-mono text-[12.5px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[#8a8f9a]">
          SET app.tenant_id = <motion.span key={ws} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={ws === "A" ? "text-[#9fc1ff]" : "text-[#f6b67a]"}>'{ws === "A" ? "distribuzioni-rossi" : "vini-bianchi"}'</motion.span>;
        </span>
        <span className="flex items-center gap-1.5 rounded-md bg-[#1c1e24] px-2 py-1 text-[11px] text-[#6fe3a5]">
          <Lock className="size-3" /> FORCE ROW LEVEL SECURITY
        </span>
      </div>
      <p className="mt-2 text-[#8a8f9a]">SELECT number, customer, amount FROM invoices;</p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {ROWS.map((r) => {
          const mine = r.ws === ws;
          return (
            <motion.li
              key={r.text}
              animate={{ opacity: mine ? 1 : 0.16, x: mine ? 0 : 6, filter: mine ? "blur(0px)" : "blur(1.5px)" }}
              transition={{ duration: 0.45, ease: EASE.outCubic }}
              className={cn("flex items-center justify-between rounded-lg border px-3 py-2", mine ? (ws === "A" ? "border-[#2f4f9a] bg-[#141b2c] text-white" : "border-[#6b4a24] bg-[#21190f] text-white") : "border-[#22242a] text-[#8a8f9a]")}
            >
              <span className="flex items-center gap-2">
                {!mine && <Lock aria-hidden className="size-3" />}
                {r.text}
              </span>
              <span>{r.amount}</span>
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-4 text-[#8a8f9a]">
        → {ROWS.filter((r) => r.ws === ws).length} rows. The other company's rows are not filtered by the app: Postgres never returns them.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

const STATS = [
  ["< 1 s", "to match 300 bank movements against 2,000 customers"],
  ["14 / 14", "tables under forced row-level security, checked on every deploy"],
  ["3", "invoice formats read: XML, signed .p7m, the AdE ZIP"],
  ["0", "manual steps to re-import the same statement twice"],
];

const COMPARE: [string, string, string][] = [
  ["Where the numbers come from", "Emails, calls and what reps type in", "The e-invoices you are required to send, and your bank"],
  ["How revenue is known", "Deal amounts, often out of date", "Invoices billed and payments received, matched"],
  ["Italian documents", "Through add-ons, if at all", "FatturaPA, .p7m, Ri.Ba., camt.053, built in"],
  ["Separation between customers", "Usually checked in application code", "Enforced by the database on every query"],
  ["What it learns", "Field suggestions", "Who pays for whom, how, and how late"],
];

const NEXT = [
  { icon: FileCheck2, title: "SDI intermediary feed", desc: "Invoices arrive by themselves, no ZIP upload." },
  { icon: Landmark, title: "Open Banking", desc: "Bank movements through a licensed provider, daily." },
  { icon: Database, title: "Peppol & EN 16931", desc: "One invoice model for every EU country's mandate." },
  { icon: Mail, title: "Email & calendar", desc: "Conversations next to the money on every company." },
];

export default function ArchitecturePage() {
  useDocumentTitle("Architecture");
  return (
    <>
      <section className="relative overflow-hidden bg-night text-white">
        <div aria-hidden className="vlines-dark absolute inset-0 [mask-image:linear-gradient(to_bottom,#000,transparent_85%)]" />
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[38%] h-[520px] w-[980px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(38_109_240/0.32),rgb(110_90_255/0.1)_45%,transparent_70%)]"
          animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="rail-dark relative px-[clamp(20px,5vw,60px)] pb-[clamp(48px,7vw,88px)] pt-[clamp(64px,9vw,120px)]">
          <Reveal className="flex max-w-[860px] flex-col gap-5">
            <Eyebrow dark className="self-start">Architecture</Eyebrow>
            <TwoTone as="h1" dark lead="Built on the money, not on guesses." rest="Vult starts where every Italian B2B sale ends: the e-invoice and the bank transfer." className="text-[clamp(36px,5vw,60px)] leading-[1.04]" />
          </Reveal>
          <Reveal delay={0.15} className="mt-12 hidden sm:block">
            <SystemMap />
          </Reveal>
          <Reveal delay={0.15} className="mt-10 sm:hidden">
            <SystemList />
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(64px,8vw,112px)]">
          <SectionIntro eyebrow="Four layers" lead="Each layer does one job." rest="And each one can be tested on its own, from the invoice parser to the security policies." />
          <div className="mt-14">
            <LayerStack />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-soft">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(64px,8vw,112px)]">
          <SectionIntro eyebrow="Match engine" lead="Watch it think." rest="Pick a bank transfer. The engine finds the payer, reads the description, searches the invoices that add up, and decides." />
          <div className="mt-12">
            <EngineDemo />
          </div>
        </div>
      </section>

      <section className="border-b border-[#1f2026] bg-night text-white">
        <div className="rail-dark grid items-center gap-12 px-[clamp(20px,5vw,60px)] py-[clamp(64px,8vw,112px)] lg:grid-cols-2">
          <Reveal className="flex flex-col gap-5">
            <Eyebrow dark className="self-start">Isolation</Eyebrow>
            <TwoTone dark lead="Your invoices are walled off by the database." rest="Not by a filter someone could forget to write." className="text-[clamp(30px,3.2vw,40px)] leading-[1.1]" />
            <p className="max-w-[460px] text-[15px] text-[#a9acb6]">
              Every table carries the workspace it belongs to, and Postgres row-level security is enabled and forced on all of them. The API connects with a role that cannot bypass it, and a release that would leave a table unprotected does not start.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <IsolationDemo />
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <RevealGroup className="rail grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([v, l]) => (
            <RevealItem key={l} className="bg-white px-8 py-9">
              <p className="display text-[40px] font-medium leading-none tracking-[-0.03em]">{v}</p>
              <p className="mt-2 text-sm text-ink-2">{l}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <p className="rail px-[clamp(20px,5vw,60px)] py-3 text-xs text-subtle">Measured in Vult's test suite.</p>
      </section>

      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(64px,8vw,112px)]">
          <SectionIntro eyebrow="The difference" lead="A different foundation." rest="Most CRMs are built around conversations. Vult is built around the transactions underneath them." />
          <Reveal className="mt-12 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-[14.5px]">
              <thead className="bg-soft text-sm text-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium" />
                  <th className="px-5 py-3 font-medium">A typical CRM</th>
                  <th className="px-5 py-3 font-medium text-ink">Vult</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([k, a, b]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="px-5 py-4 font-medium text-ink">{k}</td>
                    <td className="px-5 py-4 text-subtle">{a}</td>
                    <td className="px-5 py-4 text-ink">
                      <span className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {b}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-line bg-soft">
        <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(64px,8vw,112px)]">
          <SectionIntro eyebrow="Next" lead="Built to grow with the mandates." rest="E-invoicing is becoming mandatory across Europe. The same core takes each new source." />
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NEXT.map((n) => (
              <RevealItem key={n.title} className="flex flex-col gap-3 rounded-2xl border border-dashed border-line-strong bg-white p-5">
                <span className="flex items-center justify-between">
                  <n.icon className="size-5 text-subtle" />
                  <span className="rounded-md bg-soft-2 px-1.5 py-0.5 text-[11px] font-medium text-subtle">Coming</span>
                </span>
                <p className="font-semibold text-ink">{n.title}</p>
                <p className="text-sm text-ink-2">{n.desc}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <GlowCTA title="Revenue you can prove." />
    </>
  );
}
