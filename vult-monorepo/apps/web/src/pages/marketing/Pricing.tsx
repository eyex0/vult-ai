import { PLANS, TRIAL_DAYS } from "@vult/shared-types";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { useState } from "react";
import { FAQ, GlowCTA, Reveal, RevealGroup, RevealItem, TwoTone } from "@/components/marketing/Section";
import { Eyebrow } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { spring } from "@/lib/motion";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

/** Yearly billing: two months free. */
const yearlyMonthly = (monthly: number) => Math.round((monthly * 10) / 12);

type Cell = boolean | string;
const ROWS: [string, Cell, Cell, Cell][] = [
  ["Invoices per month", "200", "1,000", "Unlimited"],
  ["Users", "3", "10", "Unlimited"],
  ["E-invoice import (XML, signed .p7m, AdE ZIP)", true, true, true],
  ["Bank statements (camt.053, CSV)", true, true, true],
  ["Automatic payment matching, learns from you", true, true, true],
  ["Customer balances, overdue and payment habits", true, true, true],
  ["Commissions on collected revenue", false, true, true],
  ["API access", false, false, true],
  ["Priority support", false, false, true],
];

const FAQS = [
  { q: "How does the free pilot work?", a: `Every workspace starts with ${TRIAL_DAYS} days on Growth limits, free and without a card. We set it up with your real invoices and bank statements. At the end you choose a plan, or stop and we delete your data.` },
  { q: "What counts as an invoice?", a: "Each invoice or credit note you import in a calendar month. Bank movements, matches and customers are not counted." },
  { q: "Can I change plan later?", a: "Yes, at any time. Upgrades apply immediately; downgrades apply from the next billing period." },
  { q: "Are prices with VAT?", a: "Prices are in euros, VAT excluded. You receive a regular electronic invoice." },
  { q: "Do you work with accountants?", a: "Yes. Accountants (commercialisti) get a partner plan to follow their clients and a recurring share of what their clients pay. Write to us." },
];

function Price({ monthly, yearly }: { monthly: number; yearly: boolean }) {
  const value = yearly ? yearlyMonthly(monthly) : monthly;
  return (
    <span className="relative inline-flex h-11 overflow-hidden text-[44px] font-semibold leading-none tracking-[-0.045em]">
      €
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
  const [yearly, setYearly] = useState(false);
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="rail flex flex-col items-center gap-[18px] px-5 pb-14 pt-[clamp(64px,9vw,112px)] text-center">
          <Eyebrow>Pricing</Eyebrow>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-balance text-[clamp(38px,5.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.045em]">
            Pay for invoices, not seats.
          </motion.h1>
          <p className="max-w-[560px] text-lg leading-[1.45] text-subtle">
            Your whole team uses Vult. You pay by how many invoices you issue. Every plan starts with a free {TRIAL_DAYS}-day pilot on your real data.
          </p>
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
                {v && <span className="relative rounded-full bg-success-soft px-2 py-0.5 text-[11.5px] font-semibold text-success">2 months free</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <RevealGroup className="rail grid gap-px bg-line md:grid-cols-3">
          {PLANS.map((p) => {
            const dark = p.id === "GROWTH";
            return (
              <RevealItem key={p.id} className={cn("relative flex flex-col gap-5 px-7 py-8", dark ? "bg-night text-white" : "bg-white")}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">{p.name}</h2>
                  {dark && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">Most popular</span>}
                </div>
                <p className={cn("min-h-11 text-sm", dark ? "text-[#a9acb6]" : "text-subtle")}>{p.blurb}</p>
                <div className="flex min-h-[52px] items-baseline gap-1.5">
                  <Price monthly={p.monthly} yearly={yearly} />
                  <span className={cn("text-[13px]", dark ? "text-[#a9acb6]" : "text-subtle")}>{yearly ? "per month, billed yearly" : "per month"} · VAT excl.</span>
                </div>
                <Button href="/early-access" variant={dark ? "inverse" : "secondary"} size="lg">
                  Start the free pilot
                </Button>
                <ul className={cn("flex flex-col gap-2.5 border-t pt-[18px] text-sm", dark ? "border-[#26272b]" : "border-line")}>
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
            <TwoTone lead="Compare the plans." rest="Same engine on every plan; the difference is volume." className="mb-8 text-[clamp(28px,3.4vw,40px)] leading-[1.12]" />
          </Reveal>
          <div tabIndex={0} role="region" aria-label="Plan comparison table" className="overflow-auto rounded-[14px] border border-line">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">Feature comparison across Start, Growth and Scale</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[40%] border-b border-line bg-white px-5 py-4 text-left font-medium text-subtle">Features</th>
                  {PLANS.map((p) => (
                    <th key={p.id} scope="col" className={cn("border-b border-line px-3 py-4 text-center", p.id === "GROWTH" ? "bg-[#f7f8ff]" : "bg-white")}>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="block text-[12.5px] font-normal text-subtle">€{yearly ? yearlyMonthly(p.monthly) : p.monthly} / month</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, ...cells]) => (
                  <tr key={label}>
                    <th scope="row" className="border-b border-line px-5 py-3.5 text-left font-normal text-ink-2">{label}</th>
                    {cells.map((c, i) => (
                      <td key={i} className={cn("border-b border-line px-3 py-3.5 text-center", i === 1 && "bg-[#f7f8ff]")}>
                        <CellView v={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FAQ items={FAQS} />
      <GlowCTA title={`Try it free for ${TRIAL_DAYS} days.`} primary="Start the free pilot" />
    </>
  );
}
