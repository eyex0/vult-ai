import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { GlowCTA, Reveal, SectionIntro } from "@/components/marketing/Section";
import { Avatar } from "@/components/ui/Avatar";
import { spring } from "@/lib/motion";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

const INDUSTRIES = ["All", "Software", "Fintech", "Healthcare", "Logistics", "Retail", "Media"] as const;

const STORIES = [
  { company: "Kelvra", industry: "Software", metric: "3.2×", metricLabel: "faster pipeline reviews", quote: "Our Friday forecast went from half a day to twenty minutes.", person: "Priya Venkataraman", role: "VP Sales" },
  { company: "Ortiq", industry: "Fintech", metric: "41%", metricLabel: "more qualified meetings", quote: "The research agent writes better briefs than our old playbook.", person: "Marcus Oyelaran", role: "Head of Growth" },
  { company: "Halbrook", industry: "Logistics", metric: "11 hrs", metricLabel: "saved per rep, per week", quote: "Every email and meeting lands on the right record without anyone thinking about it.", person: "Elena Brandt", role: "COO" },
  { company: "Brightvale", industry: "Healthcare", metric: "2 weeks", metricLabel: "to full rollout", quote: "We modeled clinics, referrers and contracts without a consultant.", person: "Tomás Ferrer", role: "Director of Operations" },
  { company: "Maplewing", industry: "Retail", metric: "+18%", metricLabel: "win rate year over year", quote: "Stalled deals get a nudge before they go cold.", person: "Grace Okonkwo", role: "Head of Partnerships" },
  { company: "Fernhollow", industry: "Media", metric: "60%", metricLabel: "less manual data entry", quote: "Enrichment fills in the boring parts so producers can focus on clients.", person: "Ilse Marten", role: "Managing Director" },
  { company: "Gridmark", industry: "Software", metric: "99.9%", metricLabel: "workflow success rate", quote: "Routing used to break weekly. Now we just look at the run history.", person: "Dev Raman", role: "RevOps Lead" },
  { company: "Pelican Ledger", industry: "Fintech", metric: "5 min", metricLabel: "from import to first report", quote: "We imported our spreadsheet on Monday and presented from Vult on Tuesday.", person: "Hannah Lowe", role: "CFO" },
];

export default function CustomersPage() {
  useDocumentTitle("Customers");
  const [filter, setFilter] = useState<(typeof INDUSTRIES)[number]>("All");
  const shown = STORIES.filter((s) => filter === "All" || s.industry === filter);
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="rail px-[clamp(20px,5vw,60px)] pb-12 pt-[clamp(64px,9vw,112px)]">
          <SectionIntro eyebrow="Customers" lead="Teams that run on Vult." rest="How revenue teams model, automate and close with an AI-native CRM." />
          <Reveal delay={0.1} className="mt-8">
            <div role="group" aria-label="Filter by industry" className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={filter === i}
                  onClick={() => setFilter(i)}
                  className={cn("relative h-8 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors", filter === i ? "border-ink text-white" : "border-line text-ink-2 hover:border-line-strong hover:text-ink")}
                >
                  {filter === i && <motion.span layoutId="ind-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" />}
                  <span className="relative">{i}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="border-b border-line bg-soft">
        <motion.ul layout className="rail grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          <AnimatePresence mode="popLayout">
            {shown.map((s) => (
              <motion.li
                key={s.company}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={spring}
                className="group flex flex-col gap-5 bg-white p-7 transition-colors hover:bg-[#fbfbfc]"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={s.company} square size={28} />
                  <span className="font-semibold tracking-[-0.02em]">{s.company}</span>
                  <span className="ml-auto rounded-full border border-line px-2.5 py-0.5 text-xs text-subtle">{s.industry}</span>
                </div>
                <div>
                  <p className="text-[40px] font-semibold leading-none tracking-[-0.045em]">{s.metric}</p>
                  <p className="mt-1 text-sm text-subtle">{s.metricLabel}</p>
                </div>
                <blockquote className="text-[15px] leading-[1.5] text-ink">“{s.quote}”</blockquote>
                <div className="mt-auto flex items-center gap-2.5 text-[13px]">
                  <Avatar name={s.person} size={28} />
                  <span className="flex flex-col">
                    <b className="font-semibold">{s.person}</b>
                    <span className="text-subtle">{s.role}</span>
                  </span>
                  <ArrowUpRight aria-hidden className="ml-auto size-4 text-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        <p className="rail px-[clamp(20px,5vw,60px)] py-4 text-xs text-subtle">Placeholder case studies about fictional companies.</p>
      </section>
      <GlowCTA title="Join them." />
    </>
  );
}
