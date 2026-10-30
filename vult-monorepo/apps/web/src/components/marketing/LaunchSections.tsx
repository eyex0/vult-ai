import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, Brain, Building2, Check, Database, FileCheck2, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { BrowserFrame, Reveal, RevealGroup, RevealItem, SectionIntro } from "@/components/marketing/Section";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Lang = "en" | "it";

const COPY = {
  en: {
    sources: "Works with the files you already have",
    sourceList: ["FatturaPA XML", "Signed .p7m", "Agenzia delle Entrate ZIP", "camt.053", "CSV from any bank", "Ri.Ba. batches", "Credit notes"],
    tourEyebrow: "The product",
    tourLead: "One place for every euro you are owed.",
    tourRest: "Matched, explained and ready to chase.",
    tabs: [
      { id: "match", label: "Match", title: "Every transfer finds its invoice", body: "Partial payments, one transfer for several invoices, credit notes, bank fees and Ri.Ba. batches. You confirm only what the engine is unsure about." },
      { id: "customers", label: "Customers", title: "Who owes you, and how they pay", body: "Open balance, overdue amount and the average delay of every customer, built from the payments themselves, not from guesses." },
      { id: "learns", label: "Learns", title: "It learns how your customers pay", body: "Confirm a match once and SILA remembers it: the next payment from that customer is matched by itself." },
    ],
    trustEyebrow: "Your data",
    trustLead: "Built for financial data.",
    trustRest: "From the first file you send us.",
    trust: [
      [Database, "Stored in the EU", "Servers in the European Union, under GDPR."],
      [ShieldCheck, "Isolated by the database", "Each company's data is separated by row-level security, not only by application code."],
      [KeyRound, "Read-only by design", "SILA reads statement files. It cannot move money and needs no bank login."],
      [Trash2, "Yours to delete", "Stop at any time and we delete your workspace and files."],
    ],
    cols: { bank: "Bank movement", invoice: "Invoice", status: "Status", customer: "Customer", balance: "Open", overdue: "Overdue", delay: "Avg. delay" },
    matched: "Matched",
    review: "Review",
    auto: "Auto-matched",
    remembered: "Remembered",
    days: "days",
  },
  it: {
    sources: "Funziona con i file che hai già",
    sourceList: ["XML FatturaPA", ".p7m firmati", "ZIP dell'Agenzia delle Entrate", "camt.053", "CSV di qualsiasi banca", "Distinte Ri.Ba.", "Note di credito"],
    tourEyebrow: "Il prodotto",
    tourLead: "Un solo posto per ogni euro che ti devono.",
    tourRest: "Abbinato, spiegato e pronto da sollecitare.",
    tabs: [
      { id: "match", label: "Abbinamenti", title: "Ogni bonifico trova la sua fattura", body: "Pagamenti parziali, un bonifico per più fatture, note di credito, commissioni e distinte Ri.Ba. Confermi solo i casi dubbi." },
      { id: "customers", label: "Clienti", title: "Chi ti deve soldi, e come paga", body: "Saldo aperto, scaduto e ritardo medio di ogni cliente, calcolati dai pagamenti reali, non da stime." },
      { id: "learns", label: "Impara", title: "Impara come pagano i tuoi clienti", body: "Confermi un abbinamento una volta e SILA lo ricorda: il pagamento successivo di quel cliente si abbina da solo." },
    ],
    trustEyebrow: "I tuoi dati",
    trustLead: "Pensato per dati finanziari.",
    trustRest: "Dal primo file che ci invii.",
    trust: [
      [Database, "Conservati nell'UE", "Server nell'Unione Europea, nel rispetto del GDPR."],
      [ShieldCheck, "Isolati dal database", "I dati di ogni azienda sono separati dalla sicurezza a livello di riga, non solo dal codice."],
      [KeyRound, "Solo lettura", "SILA legge gli estratti conto. Non può muovere denaro e non chiede l'accesso alla banca."],
      [Trash2, "Li cancelli quando vuoi", "Ti fermi quando vuoi e cancelliamo spazio di lavoro e file."],
    ],
    cols: { bank: "Movimento bancario", invoice: "Fattura", status: "Stato", customer: "Cliente", balance: "Aperto", overdue: "Scaduto", delay: "Ritardo medio" },
    matched: "Abbinato",
    review: "Da verificare",
    auto: "Abbinato in automatico",
    remembered: "Ricordato",
    days: "giorni",
  },
} as const;

/** Honest trust strip: the formats SILA reads, instead of customer logos we do not have yet. */
export function SourcesStrip({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <section className="border-b border-line bg-white">
      <div className="rail flex flex-col items-center gap-5 px-[clamp(20px,5vw,60px)] py-10">
        <p className="text-sm font-medium text-subtle">{t.sources}</p>
        <RevealGroup className="flex flex-wrap justify-center gap-2" step={0.04}>
          {t.sourceList.map((s) => (
            <RevealItem key={s} className="inline-flex items-center gap-2 rounded-full border border-line bg-soft px-3.5 py-1.5 text-[13px] font-medium text-ink-2">
              <FileCheck2 aria-hidden className="size-3.5 text-accent" /> {s}
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

function Pill({ tone, children }: { tone: "ok" | "warn" | "info"; children: string }) {
  const cls = { ok: "bg-success-soft text-success", warn: "bg-warning-soft text-warning", info: "bg-accent-soft text-accent-ink" }[tone];
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold", cls)}>{children}</span>;
}

function MatchPanel({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const rows: [string, string, string, "ok" | "warn"][] = [
    ["BONIFICO PASTIFICIO AURORA", "FT 2026/118", "€3,050.00", "ok"],
    ["SALDO FT 120 125 OFFICINE BRENTA", "FT 120 + 125 − NC 7", "€6,200.00", "ok"],
    ["ACCREDITO DISTINTA RIBA", "3 Ri.Ba.", "€4,160.50", "ok"],
    ["BONIFICO ROSSI SRL ACCONTO", "FT 2026/131 ?", "€1,000.00", "warn"],
  ];
  return (
    <table className="w-full text-left text-[13px]">
      <thead className="text-xs text-subtle">
        <tr>
          <th className="px-4 py-2.5 font-medium">{t.cols.bank}</th>
          <th className="px-4 py-2.5 font-medium">{t.cols.invoice}</th>
          <th className="px-4 py-2.5 text-right font-medium">€</th>
          <th className="px-4 py-2.5 font-medium">{t.cols.status}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([bank, inv, amt, s], i) => (
          <motion.tr key={bank} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="border-t border-line">
            <td className="max-w-[180px] truncate px-4 py-3 font-mono text-[12px] text-ink-2">{bank}</td>
            <td className="px-4 py-3 font-medium text-ink">{inv}</td>
            <td className="tabular px-4 py-3 text-right text-ink-2">{amt}</td>
            <td className="px-4 py-3"><Pill tone={s}>{s === "ok" ? t.matched : t.review}</Pill></td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

function CustomersPanel({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const rows: [string, string, string, number][] = [
    ["Officine Brenta Srl", "€18,400", "€4,200", 34],
    ["Pastificio Aurora", "€6,050", "€0", 4],
    ["Rossi Srl", "€12,900", "€9,750", 61],
    ["Studio Lago Associati", "€2,300", "€0", 9],
  ];
  return (
    <table className="w-full text-left text-[13px]">
      <thead className="text-xs text-subtle">
        <tr>
          <th className="px-4 py-2.5 font-medium">{t.cols.customer}</th>
          <th className="px-4 py-2.5 text-right font-medium">{t.cols.balance}</th>
          <th className="px-4 py-2.5 text-right font-medium">{t.cols.overdue}</th>
          <th className="w-[34%] px-4 py-2.5 font-medium">{t.cols.delay}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, open, overdue, delay], i) => (
          <tr key={name} className="border-t border-line">
            <td className="px-4 py-3 font-medium text-ink"><Building2 aria-hidden className="mr-2 inline size-3.5 text-subtle" />{name}</td>
            <td className="tabular px-4 py-3 text-right text-ink-2">{open}</td>
            <td className={cn("tabular px-4 py-3 text-right", overdue === "€0" ? "text-subtle" : "font-medium text-danger")}>{overdue}</td>
            <td className="px-4 py-3">
              <span className="flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft-2">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (delay / 70) * 100)}%` }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("block h-full rounded-full", delay > 45 ? "bg-danger" : delay > 20 ? "bg-[#f2994a]" : "bg-[#2bb673]")}
                  />
                </span>
                <span className="tabular w-16 text-right text-xs text-subtle">{delay} {t.days}</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LearnsPanel({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const reduce = useReducedMotion();
  const steps: [string, string, "info" | "ok"][] = [
    ["BONIFICO ROSSI SRL ACCONTO → FT 2026/131", lang === "it" ? "Confermato da Giulia, 3 mar" : "Confirmed by Giulia, Mar 3", "info"],
    ["BONIFICO ROSSI SRL SALDO → FT 2026/131", t.auto, "ok"],
    ["BONIFICO ROSSI SRL → FT 2026/140", t.auto, "ok"],
  ];
  return (
    <div className="flex flex-col gap-2.5 p-4">
      {steps.map(([line, note, tone], i) => (
        <motion.div
          key={line}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.35 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {i === 0 ? <Brain aria-hidden className="size-4 shrink-0 text-accent" /> : <Check aria-hidden className="size-4 shrink-0 text-success" />}
            <span className="truncate font-mono text-[12px] text-ink-2">{line}</span>
          </span>
          <Pill tone={tone}>{i === 0 ? t.remembered : note}</Pill>
        </motion.div>
      ))}
      <p className="px-1 pt-1 text-xs text-subtle">{steps[0][1]}</p>
    </div>
  );
}

/** Tabbed product tour: each tab is a small, live-looking view of a real SILA screen. */
export function ProductTour({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [tab, setTab] = useState<(typeof t.tabs)[number]["id"]>("match");
  const active = t.tabs.find((x) => x.id === tab)!;
  return (
    <section className="border-b border-line bg-white">
      <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(56px,7vw,96px)]">
        <SectionIntro eyebrow={t.tourEyebrow} lead={t.tourLead} rest={t.tourRest} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.4fr]">
          <div role="tablist" aria-label={t.tourEyebrow} className="flex min-w-0 flex-col gap-2">
            {t.tabs.map((x) => {
              const on = x.id === tab;
              return (
                <button
                  key={x.id}
                  role="tab"
                  id={`tour-tab-${x.id}`}
                  aria-selected={on}
                  aria-controls="tour-panel"
                  onClick={() => setTab(x.id)}
                  className={cn("relative rounded-2xl border p-5 text-left transition-colors", on ? "border-line-strong bg-white" : "border-transparent hover:bg-soft")}
                >
                  {on && <motion.span layoutId="tour-bar" transition={spring} className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-accent" />}
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-subtle">
                    <ArrowLeftRight aria-hidden className={cn("size-3.5", on && "text-accent")} /> {x.label}
                  </span>
                  <span className="mt-2 block text-[17px] font-semibold text-ink">{x.title}</span>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden">
                        <span className="block pt-2 text-[15px] leading-[1.5] text-ink-2">{x.body}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
          <Reveal className="min-w-0">
            <BrowserFrame url="app.vult.ai/match" className="rounded-b-card border-b">
              <div id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${active.id}`} className="min-h-[300px] overflow-x-auto rounded-t-lg border border-b-0 border-line bg-white">
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {tab === "match" && <MatchPanel lang={lang} />}
                    {tab === "customers" && <CustomersPanel lang={lang} />}
                    {tab === "learns" && <LearnsPanel lang={lang} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </BrowserFrame>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function TrustSection({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <section className="border-b border-line bg-night text-white">
      <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(56px,7vw,96px)]">
        <SectionIntro eyebrow={t.trustEyebrow} lead={t.trustLead} rest={t.trustRest} dark />
        <RevealGroup className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-night-line bg-night-line sm:grid-cols-2 lg:grid-cols-4">
          {t.trust.map(([Icon, title, body]) => (
            <RevealItem key={title} className="flex flex-col gap-3 bg-night-2 p-6">
              <Icon aria-hidden className="size-5 text-[#eba58a]" />
              <p className="text-[16px] font-semibold">{title}</p>
              <p className="text-sm leading-[1.5] text-[#a9acb6]">{body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
