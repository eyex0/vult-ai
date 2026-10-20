import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { useState } from "react";
import { FAQ, GlowCTA, RevealGroup, RevealItem, Reveal, TwoTone } from "@/components/marketing/Section";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Badge";
import { spring } from "@/lib/motion";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

const PLANS = [
  { name: "Free", monthly: 0, blurb: "For individuals and tiny teams getting organised.", cta: "Start for free", includes: "Includes:", features: ["Up to 3 seats", "Unlimited contacts", "3 custom objects", "Email & calendar sync", "Basic reporting"] },
  { name: "Plus", monthly: 29, blurb: "For growing teams that need structure and sync.", cta: "Start trial", includes: "Everything in Free, plus:", features: ["Unlimited objects", "Sequences", "1,000 enrichment credits", "Private lists", "5 active workflows"] },
  { name: "Pro", monthly: 69, blurb: "For revenue teams running on agents and automations.", cta: "Start 14-day trial", includes: "Everything in Plus, plus:", features: ["Vult Agents", "Unlimited workflows", "Custom dashboards", "10,000 enrichment credits", "Priority support"], popular: true },
  { name: "Enterprise", monthly: null, blurb: "For organisations with security and scale needs.", cta: "Talk to sales", includes: "Everything in Pro, plus:", features: ["SSO & SCIM", "Audit logs", "Data residency", "Advanced permissions", "Dedicated success manager"] },
] as const;

type Cell = boolean | string;
const GROUPS: { name: string; rows: [string, Cell, Cell, Cell, Cell][] }[] = [
  { name: "Records & data", rows: [["Contacts and companies", "Unlimited", "Unlimited", "Unlimited", "Unlimited"], ["Custom objects", "3", "Unlimited", "Unlimited", "Unlimited"], ["Records per workspace", "50k", "250k", "1M", "Custom"], ["Enrichment credits / month", "100", "1,000", "10,000", "Custom"], ["CSV import & export", true, true, true, true]] },
  { name: "Productivity", rows: [["Email & calendar sync", true, true, true, true], ["Sequences", false, true, true, true], ["Kanban & table views", true, true, true, true], ["Private lists", false, true, true, true]] },
  { name: "AI & automation", rows: [["Ask Vult", "Limited", true, true, true], ["Vult Agents", false, false, true, true], ["Workflows", false, "5 active", "Unlimited", "Unlimited"], ["Run history", false, "7 days", "90 days", "1 year"]] },
  { name: "Reporting", rows: [["Standard reports", true, true, true, true], ["Custom dashboards", false, "3", "Unlimited", "Unlimited"], ["Forecasting", false, false, true, true]] },
  { name: "Security & admin", rows: [["Roles & permissions", "Basic", "Basic", "Advanced", "Advanced"], ["SSO & SCIM", false, false, false, true], ["Audit logs", false, false, false, true], ["Data residency", false, false, false, true]] },
];

const FAQS = [
  { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade at any time — changes are prorated to the day." },
  { q: "What counts as a seat?", a: "Anyone who can sign in and edit records. Read-only guests are free on Pro and Enterprise." },
  { q: "How do enrichment credits work?", a: "One credit enriches one company or person. Unused credits roll over for one month." },
  { q: "Do agents cost extra?", a: "Agents are included on Pro and Enterprise with a generous monthly run allowance. Heavy usage is billed at cost." },
  { q: "Is there a discount for startups or non-profits?", a: "Yes — eligible teams get 50% off Plus or Pro for the first year. Contact sales to apply." },
];

function Price({ monthly, yearly }: { monthly: number | null; yearly: boolean }) {
  if (monthly == null) return <span className="text-[44px] font-semibold leading-none tracking-[-0.045em]">Custom</span>;
  const value = yearly ? Math.round(monthly * 0.8) : monthly;
  return (
    <span className="relative inline-flex h-11 overflow-hidden text-[44px] font-semibold leading-none tracking-[-0.045em]">
      $
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={value} initial={{ y: 24, opacity: 0, filter: "blur(4px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -24, opacity: 0, filter: "blur(4px)" }} transition={spring} className="tabular inline-block">
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check role="img" aria-label="Included" className="mx-auto size-4 text-accent" strokeWidth={2.4} />;
  if (v === false) return <Minus role="img" aria-label="Not included" className="mx-auto size-4 text-[#b9bcc6]" />;
  return <span>{v}</span>;
}

export default function PricingPage() {
  useDocumentTitle("Pricing");
  const [yearly, setYearly] = useState(true);
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="rail flex flex-col items-center gap-[18px] px-5 pb-14 pt-[clamp(64px,9vw,112px)] text-center">
          <Eyebrow>Pricing</Eyebrow>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-[clamp(38px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.045em]">
            Start free. Scale when it works.
          </motion.h1>
          <p className="max-w-[520px] text-lg leading-[1.45] text-subtle">Simple per-seat pricing. Agents and enrichment credits included on every paid plan.</p>
          <div role="group" aria-label="Billing period" className="mt-2.5 inline-flex items-center gap-1 rounded-[10px] border border-line bg-soft-2 p-1">
            {[
              [false, "Monthly"],
              [true, "Yearly"],
            ].map(([v, label]) => (
              <button
                key={String(label)}
                type="button"
                aria-pressed={yearly === v}
                onClick={() => setYearly(v as boolean)}
                className={cn("relative inline-flex h-[34px] items-center gap-2 rounded-[7px] px-4 text-sm font-[550] transition-colors", yearly === v ? "text-ink" : "text-ink-2 hover:text-ink")}
              >
                {yearly === v && <motion.span layoutId="billing-pill" transition={spring} className="absolute inset-0 rounded-[7px] bg-white shadow-[0_1px_2px_rgb(16_17_26/0.1),0_0_0_1px_var(--color-line)]" />}
                <span className="relative">{label}</span>
                {v && <span className="relative rounded-full bg-success-soft px-2 py-0.5 text-[11.5px] font-semibold text-success">Save 20%</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <RevealGroup className="rail grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const dark = "popular" in p && p.popular;
            return (
              <RevealItem key={p.name} className={cn("relative flex flex-col gap-5 px-7 py-8", dark ? "bg-night text-white" : "bg-white")}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">{p.name}</h2>
                  {dark && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">Most popular</span>}
                </div>
                <p className={cn("min-h-11 text-sm", dark ? "text-[#a9acb6]" : "text-subtle")}>{p.blurb}</p>
                <div className="flex min-h-[52px] items-baseline gap-1.5">
                  <Price monthly={p.monthly} yearly={yearly} />
                  <span className={cn("text-[13px]", dark ? "text-[#a9acb6]" : "text-subtle")}>
                    {p.monthly === 0 ? "forever" : p.monthly == null ? "" : yearly ? "per seat / mo, billed yearly" : "per seat / month"}
                  </span>
                </div>
                <Button href={p.name === "Enterprise" ? "/contact" : "/signup"} variant={dark ? "inverse" : p.name === "Free" ? "primary" : "secondary"} size="lg">
                  {p.cta}
                </Button>
                <ul className={cn("flex flex-col gap-2.5 border-t pt-[18px] text-sm", dark ? "border-[#26272b]" : "border-line")}>
                  <li className={cn("text-[13px]", dark ? "text-[#a9acb6]" : "text-subtle")}>{p.includes}</li>
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check aria-hidden className={cn("mt-0.5 size-4 shrink-0", dark ? "text-[#8ea2ff]" : "text-accent")} strokeWidth={2.4} />
                      {f}
                    </li>
                  ))}
                </ul>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(16px,4vw,40px)] pb-6 pt-[clamp(56px,8vw,96px)]">
          <Reveal>
            <TwoTone lead="Compare every plan." rest="The full list, side by side." className="mb-8 text-[clamp(28px,3.4vw,40px)] leading-[1.12]" />
          </Reveal>
          <div tabIndex={0} role="region" aria-label="Plan comparison table" className="max-h-[760px] overflow-auto rounded-[14px] border border-line">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">Feature comparison across Free, Plus, Pro and Enterprise</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 top-0 z-20 w-[32%] border-b border-line bg-white px-5 py-4 text-left font-medium text-subtle">
                    Features
                  </th>
                  {PLANS.map((p) => (
                    <th key={p.name} scope="col" className={cn("sticky top-0 z-10 border-b border-line px-3 py-4 text-center", p.name === "Pro" ? "bg-[#f7f8ff]" : "bg-white")}>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="block text-[12.5px] font-normal text-subtle">{p.monthly == null ? "Custom" : p.monthly === 0 ? "Free" : `$${yearly ? Math.round(p.monthly * 0.8) : p.monthly} / seat`}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUPS.map((g) => (
                  <GroupRows key={g.name} group={g} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FAQ items={FAQS} />
      <GlowCTA title="Try Pro free for 14 days." />
    </>
  );
}

function GroupRows({ group }: { group: (typeof GROUPS)[number] }) {
  return (
    <>
      <tr>
        <th scope="colgroup" colSpan={5} className="border-b border-line bg-[#fafafb] px-5 pb-2 pt-5 text-left text-xs font-semibold uppercase tracking-[0.06em] text-subtle">
          {group.name}
        </th>
      </tr>
      {group.rows.map(([label, ...cells]) => (
        <tr key={label} className="transition-colors hover:bg-soft">
          <th scope="row" className="sticky left-0 border-b border-[#f0f1f3] bg-inherit px-5 py-3 text-left font-normal">
            {label}
          </th>
          {cells.map((c, i) => (
            <td key={i} className={cn("border-b border-[#f0f1f3] px-3 py-3 text-center text-ink-2", i === 2 && "bg-[#f7f8ff]")}>
              <CellView v={c} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
