import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bot, Calendar, ChevronLeft, ChevronRight, CreditCard, Database, FileSignature, FileText, Headphones,
  Lock, Mail, MessagesSquare, Phone, ShieldCheck, Video, Webhook, Workflow,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { GlowCTA, Reveal, RevealGroup, RevealItem, SectionIntro, TwoTone } from "@/components/marketing/Section";
import { ProductWindow } from "@/components/marketing/ProductWindow";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Badge";
import { spring } from "@/lib/motion";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

const LOGOS: { name: string; shape: string; style: string }[] = [
  { name: "kelvra", shape: "rotate-45 bg-current", style: "font-bold tracking-[-0.04em]" },
  { name: "ORTIQ", shape: "rounded-full border-[2.5px] border-current", style: "font-semibold tracking-[0.08em]" },
  { name: "Solvane", shape: "rounded-md bg-current", style: "font-medium tracking-[-0.02em]" },
  { name: "Maplewing", shape: "rounded-[50%_0_50%_50%] border-[2.5px] border-current", style: "font-bold italic tracking-[-0.03em]" },
  { name: "halbrook", shape: "rounded-full bg-current", style: "font-semibold tracking-[-0.03em]" },
  { name: "nodeline", shape: "rotate-45 rounded-sm border-[2.5px] border-current", style: "font-medium" },
  { name: "Brightvale", shape: "rounded-[50%_50%_0_50%] bg-current", style: "font-semibold tracking-[-0.035em]" },
  { name: "COBALT&FINCH", shape: "border-[2.5px] border-current", style: "font-bold tracking-[0.02em]" },
  { name: "Tessaro", shape: "rounded-full border-[2.5px] border-current", style: "font-normal tracking-[-0.02em]" },
  { name: "wendell", shape: "rounded-[6px_0] bg-current", style: "font-bold tracking-[-0.05em]" },
];

const STATS = [
  ["3.2×", "faster pipeline reviews"],
  ["11 hrs", "saved per rep, per week"],
  ["99.99%", "uptime over the last year"],
  ["< 5 min", "from import to first report"],
];

const AGENTS = [
  {
    title: "Research accounts",
    desc: "Reads the record, the inbox and the open web, then writes a brief your rep can act on.",
    name: "Account research agent",
    meta: "Running on Solvane · started 12s ago",
    steps: [
      ["Read the Solvane company record", "14 fields · 3 open deals · last touch 6 days ago"],
      ["Researched recent news", "New Head of RevOps and an EU office opening"],
      ["Scored account fit", "ICP match 92 — moved to Tier 1"],
      ["Drafted a follow-up email", "Personalised to the new hire · waiting for your review"],
      ["Created a task for Jun Park", "Call before Thursday · linked to “Data warehouse sync”"],
    ],
  },
  {
    title: "Qualify inbound",
    desc: "Scores every form fill against your ideal customer profile and routes the good ones in seconds.",
    name: "Inbound qualifier",
    meta: "Triggered by a demo request · 3s ago",
    steps: [
      ["Matched the lead to Brightvale", "Existing company · 2 known contacts"],
      ["Enriched the contact", "Director of Operations · 9 years in role"],
      ["Checked buying signals", "Pricing page visited 4 times this week"],
      ["Assigned to Theo Lindqvist", "Round-robin · EMEA mid-market"],
      ["Suggested meeting times", "Sent two slots for Wednesday"],
    ],
  },
  {
    title: "Keep deals moving",
    desc: "Spots stalled deals, summarises what changed and proposes the next step.",
    name: "Pipeline guardian",
    meta: "Weekly run · 25 open deals checked",
    steps: [
      ["Scanned open pipeline", "25 deals · $1.2M weighted"],
      ["Flagged 3 stalled deals", "No reply in 10+ days"],
      ["Summarised the Halbrook thread", "Legal review pending on the DPA"],
      ["Proposed next steps", "Loop in their counsel · share security pack"],
      ["Posted a digest to #sales", "With links to every record"],
    ],
  },
];

const FLOW = [
  { kind: "Trigger", title: "Deal stage changes to Won", glyph: "T", cls: "bg-accent-soft text-accent-ink" },
  { kind: "Condition", title: "Value is over $50,000", glyph: "IF", cls: "bg-warning-soft text-warning" },
  { kind: "Agent", title: "Draft a kickoff plan", glyph: "AI", cls: "bg-ink text-white" },
  { kind: "Action", title: "Notify #wins, create onboarding task", glyph: "A", cls: "bg-success-soft text-success" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const VALUES = [38, 44, 41, 52, 58, 55, 66, 72, 80, 92];

const INTEGRATIONS = [
  [Mail, "Email", "Two-way sync", "#3b5bfd"],
  [Calendar, "Calendar", "Meetings", "#16a34a"],
  [MessagesSquare, "Team chat", "Alerts", "#7048e8"],
  [Video, "Video calls", "Call notes", "#0b7285"],
  [CreditCard, "Billing", "Invoices & MRR", "#d9480f"],
  [Database, "Warehouse", "Data sync", "#16171a"],
  [FileText, "Forms", "Inbound leads", "#c2255c"],
  [Headphones, "Support desk", "Tickets", "#4c6ef5"],
  [Phone, "Telephony", "Dialer", "#2f9e44"],
  [FileSignature, "E-signature", "Contracts", "#b35c00"],
  [Webhook, "Webhooks", "Custom events", "#495057"],
  [Workflow, "REST API", "Build anything", "#3b5bfd"],
] as const;

const TESTIMONIALS = [
  { quote: "We replaced three tools and a weekly spreadsheet ritual. Our reps now open Vult before they open their inbox.", name: "Priya Venkataraman", role: "VP Sales, Kelvra" },
  { quote: "The research agent does in two minutes what used to take an SDR half a morning — and it cites every source.", name: "Marcus Oyelaran", role: "Head of Growth, Ortiq" },
  { quote: "Custom objects let us model investors, funds and portfolio companies without a single workaround.", name: "Elena Brandt", role: "Partner, Halbrook Capital" },
];

const SECURITY = [
  ["SOC 2 Type II", "Audited annually"],
  ["GDPR ready", "EU data residency"],
  ["SSO & SCIM", "SAML provisioning"],
  ["Audit logs", "Every change, streamed"],
];

function Hero() {
  const words = ["The", "CRM", "that", "thinks", "\n", "ahead", "of", "your", "team."];
  return (
    <section className="hatch relative px-[clamp(12px,7vw,120px)] pt-[clamp(96px,11vw,150px)]">
      <div className="relative bg-white px-5 text-center">
        <div className="absolute left-1/2 top-0 z-[2] -translate-x-1/2 -translate-y-1/2">
          <Link
            href="/platform/agents"
            className="group inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#dcdfe6] bg-white pl-1 pr-3 text-[13.5px] text-ink shadow-soft transition-colors hover:bg-soft"
          >
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink">New</span>
            How agents run a week of prospecting
            <ChevronRight aria-hidden className="size-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-[22px] pt-11">
          <h1 aria-label="The CRM that thinks ahead of your team." className="text-[clamp(40px,6.6vw,76px)] font-semibold leading-[1.04] tracking-[-0.045em]">
            {words.map((w, i) =>
              w === "\n" ? (
                <br key={i} />
              ) : (
                <motion.span
                  key={i}
                  aria-hidden
                  className="inline-block"
                  initial={{ opacity: 0, y: "0.5em", filter: "blur(10px)", rotate: 2 }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", rotate: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 + i * 0.05 }}
                >
                  {w}
                  {i < words.length - 1 && words[i + 1] !== "\n" ? " " : ""}
                </motion.span>
              ),
            )}
          </h1>
          <motion.div
            className="flex flex-col items-center gap-[22px]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
          >
            <p className="max-w-[470px] text-[19px] leading-[1.4] text-subtle">
              Vult fills itself in from every email and meeting, then puts agents on the busywork — so reps spend the day selling.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button href="/contact" variant="secondary" size="lg">
                Talk to sales
              </Button>
              <Button href="/signup" size="lg" arrow>
                Start for free
              </Button>
            </div>
            <p className="text-[13px] text-subtle">Free for up to 3 seats · No credit card required</p>
          </motion.div>
        </div>
        <motion.div
          id="demo"
          className="relative mx-auto mt-[72px] max-w-[1160px] text-left [perspective:1600px]"
          initial={{ opacity: 0.3, rotateX: 24, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          style={{ transformOrigin: "50% 0" }}
        >
          <ProductWindow />
        </motion.div>
      </div>
    </section>
  );
}

function LogoGrid() {
  return (
    <section aria-label="Teams using Vult" className="border-y border-line bg-soft">
      <RevealGroup step={0.04} className="rail grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
        {LOGOS.map((l) => (
          <RevealItem key={l.name} className="group flex h-[100px] items-center justify-center gap-2.5 bg-soft text-[#2a2c31] transition-colors hover:bg-white">
            <span aria-hidden className={cn("size-[22px] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:-rotate-12", l.shape)} />
            <span className={cn("text-xl", l.style)}>{l.name}</span>
          </RevealItem>
        ))}
      </RevealGroup>
      <p className="sr-only">Placeholder logos of fictional companies.</p>
    </section>
  );
}

function PlatformIntro() {
  return (
    <section className="bg-soft">
      <div className="rail px-[clamp(20px,5vw,60px)] pb-[clamp(48px,6vw,80px)] pt-[clamp(64px,9vw,120px)]">
        <SectionIntro
          eyebrow="Platform"
          lead="The system of record that keeps itself current."
          rest="Every email logged. Every contact enriched. Every deal scored before your Monday standup."
        />
      </div>
      <RevealGroup className="rail grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(([v, l]) => (
          <RevealItem key={l} className="flex flex-col gap-1.5 bg-soft px-[clamp(20px,3vw,32px)] py-7">
            <span className="text-[40px] font-[550] leading-none tracking-[-0.045em]">{v}</span>
            <span className="text-sm text-ink-2">{l}</span>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

function BentoCell({ lead, rest, children, className }: { lead: string; rest: string; children: React.ReactNode; className?: string }) {
  return (
    <RevealItem className={cn("group flex min-w-0 flex-col gap-6 bg-white p-8 transition-colors hover:bg-[#fbfbfc]", className)}>
      <TwoTone as="h3" lead={lead} rest={rest} className="text-[19px] leading-[1.35] tracking-[-0.025em]" />
      <div className="transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-1">{children}</div>
    </RevealItem>
  );
}

function Bento() {
  return (
    <section className="border-y border-line bg-soft">
      <RevealGroup className="rail grid grid-cols-1 gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
        <BentoCell lead="Flexible data model." rest="Custom objects, typed fields and relationships for how your business actually works." className="md:col-span-2 lg:col-span-2">
          <div className="dot-grid flex min-h-[220px] flex-wrap items-center justify-center gap-3.5 rounded-xl border border-line bg-soft-2 p-6">
            {[
              ["Company", "#3b5bfd", ["Domain · text", "ARR · currency", "Segment · select"]],
              ["Deal", "#f2994a", ["Value · currency", "Stage · status", "Company · relation"]],
            ].map(([t, c, fields], i) => (
              <div key={t as string} className="contents">
                {i > 0 && <span aria-hidden className="w-9 border-t-[1.5px] border-dashed border-[#a9acb6]" />}
                <div className="w-[170px] rounded-xl border border-line bg-white shadow-soft">
                  <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-[13px] font-semibold">
                    <span className="size-3.5 rounded" style={{ background: c as string }} /> {t as string}
                  </div>
                  <div className="flex flex-col gap-1 px-3 py-2 text-xs text-ink-2">
                    {(fields as string[]).map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <span aria-hidden className="w-9 border-t-[1.5px] border-dashed border-[#a9acb6]" />
            <div className="w-[170px] rounded-xl border-[1.5px] border-dashed border-[#a9acb6] bg-white p-3.5 text-center text-xs text-subtle">
              + New object
              <br />
              <span className="font-semibold text-ink">Partner</span>
            </div>
          </div>
        </BentoCell>
        <BentoCell lead="Automatic enrichment." rest="Add a domain. Vult fills in the rest.">
          <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-3.5 text-[13px] shadow-soft">
            <div className="flex items-center gap-2.5">
              <Avatar name="Halbrook" square size={32} className="!bg-ink" />
              <span className="flex flex-col">
                <b className="font-semibold">Halbrook</b>
                <span className="text-xs text-subtle">halbrook.example</span>
              </span>
              <span className="ml-auto rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-ink">Enriched</span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-ink-2">
              {[
                ["Industry", "Logistics software"],
                ["Employees", "201–500"],
                ["HQ", "Rotterdam, NL"],
                ["Funding", "Series B"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-subtle">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </BentoCell>
        <BentoCell lead="Live reporting." rest="Pipeline and forecast, built from records as they change.">
          <div aria-hidden className="flex h-[130px] items-end gap-2 border-b border-line px-1">
            {[40, 62, 48, 75, 58, 84, 70, 96].map((h, i) => (
              <motion.span
                key={i}
                className="flex-1 origin-bottom rounded-t-[5px]"
                style={{ height: `${h}%`, background: ["#dde3ff", "#c9d3ff", "#b3c1ff", "#9aadff", "#8199ff", "#6b86ff", "#5672fe", "#3b5bfd"][i] }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
              />
            ))}
          </div>
        </BentoCell>
        <BentoCell lead="Email & calendar sync." rest="Every thread and meeting, on the right record.">
          <div className="flex flex-col gap-2 text-[13px]">
            {[
              ["Kelvra · Pricing review", "10:30 – 11:00 · 3 attendees", "#3b5bfd"],
              ["Re: Security questionnaire", "Ortiq · 4 messages · 2h ago", "#f2994a"],
            ].map(([t, m, c]) => (
              <div key={t} className="flex items-center gap-2.5 rounded-[10px] border border-line px-3 py-2.5">
                <span className="w-[3px] self-stretch rounded-sm" style={{ background: c }} />
                <span className="flex flex-col">
                  <b className="font-semibold">{t}</b>
                  <span className="text-xs text-subtle">{m}</span>
                </span>
              </div>
            ))}
          </div>
        </BentoCell>
        <BentoCell lead="Granular permissions." rest="Who sees, edits and exports — down to the field.">
          <div className="flex flex-col rounded-xl border border-line text-[13px]">
            {[
              ["Admins", "Full access"],
              ["Sales", "Read & write"],
              ["Contractors", "Read only · no export"],
            ].map(([a, b], i) => (
              <div key={a} className={cn("flex justify-between px-3 py-2.5", i < 2 && "border-b border-line")}>
                <span>{a}</span>
                <span className="text-ink-2">{b}</span>
              </div>
            ))}
          </div>
        </BentoCell>
      </RevealGroup>
    </section>
  );
}

function Agents() {
  const [idx, setIdx] = useState(0);
  const reduce = useReducedMotion();
  const agent = AGENTS[idx]!;
  return (
    <section className="relative overflow-hidden bg-night text-white">
      <motion.div
        aria-hidden
        className="absolute -right-[10%] -top-[20%] size-[760px] rounded-full bg-[radial-gradient(circle,rgb(59_91_253/0.24),transparent_65%)]"
        animate={{ scale: [1, 1.14, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="rail-dark relative px-[clamp(20px,5vw,60px)] pb-14 pt-[clamp(64px,9vw,120px)]">
        <SectionIntro
          dark
          eyebrow="Vult Agents"
          lead="Hand off the busywork. Keep the judgment."
          rest="Agents research, qualify and follow up — every step logged, every change yours to approve."
        />
      </div>
      <div className="rail-dark relative grid border-t border-night-line md:grid-cols-2">
        <div role="tablist" aria-label="Agent examples" className="flex flex-col border-night-line px-[clamp(20px,5vw,60px)] py-10 md:border-r">
          {AGENTS.map((a, i) => {
            const active = i === idx;
            return (
              <button
                key={a.title}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setIdx(i)}
                className={cn(
                  "relative flex flex-col gap-1.5 border-b border-night-line py-[18px] text-left transition-colors",
                  active ? "text-white" : "text-[#8a8d96] hover:text-white",
                )}
              >
                {active && <motion.span layoutId="agent-tab" transition={spring} className="absolute -left-[clamp(20px,5vw,60px)] inset-y-3 w-0.5 rounded-full bg-accent" />}
                <span className="text-[17px] font-medium">{a.title}</span>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="max-w-[360px] overflow-hidden text-sm text-[#8a8d96]"
                    >
                      {a.desc}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
        <div className="p-[clamp(20px,4vw,48px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={agent.name}
              role="tabpanel"
              initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-panel border border-[#26272b] bg-[#16171a] p-5 shadow-dark-pop"
            >
              <div className="flex items-center gap-2.5 border-b border-[#242526] pb-3.5">
                <span className="flex size-[30px] items-center justify-center rounded-lg bg-accent">
                  <Bot className="size-4" />
                </span>
                <span className="flex flex-col">
                  <b className="text-sm font-semibold">{agent.name}</b>
                  <span className="text-xs text-[#8a8d96]">{agent.meta}</span>
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[#7fe0a8]">
                  <span className="size-[7px] animate-pulse-soft rounded-full bg-[#3ddc84]" /> Live
                </span>
              </div>
              <ol className="flex flex-col gap-1 pt-3.5">
                {agent.steps.map(([t, d], i) => (
                  <motion.li
                    key={t}
                    className="flex gap-3 rounded-[10px] p-2.5"
                    initial={reduce ? false : { opacity: 0.45 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.5, duration: 0.3 }}
                  >
                    <motion.span
                      className="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]"
                      initial={reduce ? false : { backgroundColor: "#242526", borderColor: "#3a3c40" }}
                      animate={{ backgroundColor: "#3b5bfd", borderColor: "#3b5bfd" }}
                      transition={{ delay: 0.3 + i * 0.5, duration: 0.25 }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    </motion.span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-[550]">{t}</span>
                      <span className="text-[12.5px] text-[#8a8d96]">{d}</span>
                    </span>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="rail-dark h-[72px] border-t border-night-line" />
    </section>
  );
}

function SplitSection({ eyebrow, lead, rest, children, points, reverse }: { eyebrow: string; lead: string; rest: string; children: React.ReactNode; points?: string[]; reverse?: boolean }) {
  return (
    <section className="border-b border-line bg-soft">
      <div className={cn("rail grid md:grid-cols-2", reverse && "md:[&>*:first-child]:order-2")}>
        <div className={cn("flex flex-col gap-5 px-[clamp(20px,5vw,60px)] py-[clamp(56px,8vw,104px)]", reverse ? "md:border-l" : "md:border-r", "border-line")}>
          <Reveal className="flex flex-col gap-5">
            <Eyebrow className="self-start">{eyebrow}</Eyebrow>
            <TwoTone lead={lead} rest={rest} className="text-[clamp(26px,2.8vw,34px)] leading-[1.18] tracking-[-0.03em]" />
          </Reveal>
          {points && (
            <RevealGroup className="mt-1 flex flex-col gap-2.5 text-[15px] text-ink-2">
              {points.map((p) => (
                <RevealItem key={p} className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b5bfd" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {p}
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function Automations() {
  return (
    <SplitSection
      eyebrow="Automations"
      lead="Workflows that run while you sell."
      rest="Trigger on any change, branch on conditions, call an agent, tell the team."
      points={["40+ triggers and actions", "Step-by-step run history", "Versions with one-click rollback"]}
    >
      <RevealGroup step={0.15} className="dot-grid flex flex-col items-center justify-center bg-soft-2 px-6 py-12">
        {FLOW.map((n, i) => (
          <RevealItem key={n.title} className="flex w-full flex-col items-center">
            {i > 0 && (
              <motion.span
                aria-hidden
                className="h-7 w-[1.5px] origin-top bg-[#a9acb6]"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
              />
            )}
            <div className="flex w-[300px] max-w-full items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 shadow-soft transition-transform duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-card">
              <span className={cn("flex size-[30px] shrink-0 items-center justify-center rounded-lg text-xs font-bold", n.cls)}>{n.glyph}</span>
              <span className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-subtle">{n.kind}</span>
                <span className="text-sm font-semibold">{n.title}</span>
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </SplitSection>
  );
}

function Reporting() {
  return (
    <SplitSection eyebrow="Reporting" lead="Answers, not exports." rest="Ask in plain language or build a chart in a few clicks. Dashboards move when deals do." reverse>
      <div className="flex items-center bg-soft-2 p-[clamp(24px,4vw,48px)]">
        <Reveal className="w-full rounded-card border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="flex flex-col">
              <span className="text-[13px] text-subtle">Closed won · 2026</span>
              <span className="text-[30px] font-semibold tracking-[-0.04em]">$2.48M</span>
            </span>
            <span className="rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">+18.4% vs 2025</span>
          </div>
          <div role="img" aria-label="Monthly closed-won revenue, January to October, trending upward" className="mt-5 flex h-[190px] items-end gap-2.5 border-b border-line">
            {VALUES.map((v, i) => (
              <motion.span
                key={i}
                className="flex-1 origin-bottom rounded-t-md"
                style={{ height: `${v}%`, background: i === VALUES.length - 1 ? "#3b5bfd" : "#c9d3ff" }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
              />
            ))}
          </div>
          <div aria-hidden className="mt-2 flex gap-2.5">
            {MONTHS.map((m) => (
              <span key={m} className="flex-1 text-center text-[11px] text-subtle">
                {m}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </SplitSection>
  );
}

function Integrations() {
  return (
    <section className="bg-soft">
      <div className="rail px-[clamp(20px,5vw,60px)] pb-12 pt-[clamp(64px,9vw,112px)]">
        <SectionIntro eyebrow="Ecosystem" lead="Connected from day one." rest="Two-way sync with your inbox, calendar and stack, plus webhooks and a typed REST API." />
      </div>
      <RevealGroup step={0.03} className="rail grid grid-cols-1 gap-px border-y border-line bg-line min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {INTEGRATIONS.map(([Icon, name, kind, color]) => (
          <RevealItem key={name} className="group flex items-center gap-3 bg-soft p-5 transition-colors hover:bg-white">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-[8deg] group-hover:scale-110"
              style={{ background: color }}
            >
              <Icon className="size-[18px]" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{name}</span>
              <span className="text-xs text-subtle">{kind}</span>
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

function Testimonials() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i]!;
  const go = (d: number) => setI((i + d + TESTIMONIALS.length) % TESTIMONIALS.length);
  return (
    <section aria-label="Testimonials" aria-roledescription="carousel" className="border-b border-line bg-white">
      <div className="rail px-[clamp(20px,5vw,60px)] py-[clamp(64px,9vw,112px)] text-center">
        <div className="mx-auto min-h-[230px] max-w-[860px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure
              key={t.name}
              className="flex flex-col items-center gap-7"
              initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <blockquote className="text-balance text-[clamp(22px,2.8vw,32px)] font-medium leading-[1.3] tracking-[-0.03em]">“{t.quote}”</blockquote>
              <figcaption className="flex items-center gap-3 text-left">
                <Avatar name={t.name} size={44} />
                <span className="flex flex-col">
                  <b className="font-semibold">{t.name}</b>
                  <span className="text-[13px] text-subtle">{t.role}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3.5">
          <Button variant="secondary" size="icon" className="size-11 rounded-full" aria-label="Previous testimonial" onClick={() => go(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="flex gap-1.5">
            {TESTIMONIALS.map((x, n) => (
              <button
                key={x.name}
                type="button"
                aria-label={`Show testimonial ${n + 1}`}
                aria-current={n === i}
                onClick={() => setI(n)}
                className="flex h-6 items-center"
              >
                <motion.span className="block h-1.5 rounded-full" animate={{ width: n === i ? 22 : 6, backgroundColor: n === i ? "#16171a" : "#d6d8de" }} transition={spring} />
              </button>
            ))}
          </span>
          <Button variant="secondary" size="icon" className="size-11 rounded-full" aria-label="Next testimonial" onClick={() => go(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <p className="mt-4 text-xs text-subtle">Illustrative quotes from fictional customers.</p>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="rail relative grid md:grid-cols-2">
        <svg aria-hidden width="900" height="700" viewBox="0 0 900 700" className="pointer-events-none absolute -right-px top-0 max-w-[75%]">
          <motion.path
            d="M900 0 C 760 260, 520 520, 0 700"
            fill="none"
            stroke="#c9ccd3"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <Reveal className="relative flex flex-col gap-5 px-[clamp(20px,5vw,60px)] py-[clamp(56px,8vw,112px)]">
          <Eyebrow className="self-start">Enterprise</Eyebrow>
          <h2 className="text-[clamp(30px,3.6vw,44px)] font-medium leading-[1.12] tracking-[-0.035em]">
            <span>Secure by default.</span>
            <br />
            <span className="text-subtle">
              Ready for every team
              <br />
              and every agent.
            </span>
          </h2>
          <Button href="/legal/privacy" variant="secondary" className="self-start" arrow>
            Visit the trust center
          </Button>
        </Reveal>
        <RevealGroup className="relative grid grid-cols-2 content-center gap-3 px-[clamp(20px,5vw,60px)] pb-14 md:py-[clamp(24px,6vw,112px)]">
          {SECURITY.map(([t, d], i) => (
            <RevealItem
              key={t}
              className="flex flex-col gap-2 rounded-[14px] border border-line bg-white/90 p-[18px] transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-card"
            >
              {i % 2 ? <Lock className="size-5" strokeWidth={1.8} /> : <ShieldCheck className="size-5" strokeWidth={1.8} />}
              <span className="text-sm font-semibold">{t}</span>
              <span className="text-[12.5px] text-ink-2">{d}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
      <div className="rail h-16" />
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle("");
  return (
    <>
      <Hero />
      <LogoGrid />
      <PlatformIntro />
      <Bento />
      <Agents />
      <Automations />
      <Reporting />
      <Integrations />
      <Testimonials />
      <Security />
      <GlowCTA
        title={
          <>
            Your pipeline,
            <br />
            finally in sync.
          </>
        }
      />
    </>
  );
}

