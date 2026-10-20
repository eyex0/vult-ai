import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { FAQ, GlowCTA, Reveal, RevealGroup, RevealItem, TwoTone } from "@/components/marketing/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Badge";
import { PLATFORM, type PlatformSection } from "@/content/platform";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";
import NotFoundPage from "./NotFound";

const PILL = {
  done: "bg-success-soft text-success",
  wait: "bg-warning-soft text-warning",
  run: "bg-accent-soft text-accent-ink",
};

function Mock({ s }: { s: PlatformSection }) {
  if (s.mock === "chart") {
    const vals = [38, 44, 41, 52, 58, 55, 66, 72, 80, 92];
    return (
      <div className="w-full max-w-[460px] rounded-card border border-line bg-white p-5 shadow-card">
        <p className="text-[13px] text-subtle">{s.mockTitle}</p>
        <p className="text-2xl font-semibold tracking-[-0.04em]">$2.48M</p>
        <div role="img" aria-label="Bar chart trending upward over ten months" className="mt-4 flex h-[160px] items-end gap-2 border-b border-line">
          {vals.map((v, i) => (
            <motion.span
              key={i}
              className="flex-1 origin-bottom rounded-t-[4px]"
              style={{ height: `${v}%`, background: i === vals.length - 1 ? "#3b5bfd" : "#c9d3ff" }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
      </div>
    );
  }
  const isFlow = s.mock === "workflow";
  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-card border border-line bg-white shadow-card transition-transform duration-500 ease-[var(--ease-spring)] hover:-translate-y-1">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-[13px] font-semibold">
        {s.mock === "agent" || s.mock === "chat" ? <Bot className="size-4 text-accent" /> : <span className="size-2 rounded-full bg-accent" />}
        {s.mockTitle}
        {s.mock === "agent" && <span className="ml-auto text-xs font-normal text-subtle">1m 48s</span>}
      </div>
      <RevealGroup step={0.1} className={cn(isFlow && "flex flex-col items-center gap-0 p-5")}>
        {s.rows.map((r, i) =>
          isFlow ? (
            <RevealItem key={r.title} className="flex w-full flex-col items-center">
              {i > 0 && <span aria-hidden className="h-5 w-[1.5px] bg-line-strong" />}
              <div className="flex w-full items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-[13px]">
                <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", PILL[r.tone])}>{r.pill}</span>
                <span className="font-semibold">{r.title}</span>
              </div>
            </RevealItem>
          ) : (
            <RevealItem key={r.title} className="flex items-start gap-3 border-b border-[#f0f1f3] px-4 py-3 text-[13px] last:border-b-0">
              {s.mock === "chat" ? (
                r.detail === "Vult" ? (
                  <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent">
                    <Sparkles className="size-3.5 text-white" />
                  </span>
                ) : (
                  <Avatar name="Dani Rossi" size={26} />
                )
              ) : (
                <Avatar name={r.title} square size={26} />
              )}
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{r.title}</span>
                <span className="text-subtle">{r.detail}</span>
              </span>
              {s.mock !== "chat" && <span className={cn("ml-auto whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold", PILL[r.tone])}>{r.pill}</span>}
            </RevealItem>
          ),
        )}
      </RevealGroup>
    </div>
  );
}

export default function PlatformPage({ slug }: { slug: string }) {
  const page = PLATFORM[slug];
  useDocumentTitle(page?.name ?? "Not found");
  if (!page) return <NotFoundPage />;

  return (
    <>
      <section className="relative overflow-hidden bg-night text-white">
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[30%] h-[700px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(59_91_253/0.32),transparent_62%)]"
          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="rail-dark relative flex flex-col items-center gap-5 px-5 py-[clamp(72px,10vw,128px)] text-center">
          <motion.nav aria-label="Breadcrumb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-[#8a8d96]">
            Platform <span aria-hidden>/</span> <span className="text-white">{page.name}</span>
          </motion.nav>
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(40px,6vw,72px)] font-semibold leading-[1.02] tracking-[-0.045em]"
          >
            {page.title[0]}
            <br />
            <span className="text-[#a9acb6]">{page.title[1]}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="max-w-[560px] text-lg leading-[1.45] text-[#a9acb6]">
            {page.subtitle}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="flex flex-wrap justify-center gap-2.5">
            <Button href="/contact" variant="outline-inverse" size="lg">
              Talk to sales
            </Button>
            <Button href="/signup" variant="inverse" size="lg" arrow>
              Start for free
            </Button>
          </motion.div>
        </div>
      </section>

      {page.sections.map((s, i) => (
        <section key={s.lead} className={cn("border-b border-line", i % 2 ? "bg-white" : "bg-soft")}>
          <div className={cn("rail flex flex-wrap", i % 2 && "flex-row-reverse")}>
            <div className="flex min-w-0 flex-[1_1_380px] flex-col justify-center gap-[18px] px-[clamp(20px,5vw,60px)] py-[clamp(48px,7vw,96px)]">
              <Reveal className="flex flex-col gap-[18px]">
                <Eyebrow className="self-start">{s.eyebrow}</Eyebrow>
                <TwoTone lead={s.lead} rest={s.rest} className="text-[clamp(26px,2.8vw,34px)] leading-[1.18] tracking-[-0.03em]" />
              </Reveal>
              <RevealGroup className="flex flex-col gap-2.5 text-ink-2">
                {s.points.map((p) => (
                  <RevealItem key={p} className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b5bfd" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    {p}
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
            <div className={cn("dot-grid flex min-w-0 flex-[1_1_420px] items-center justify-center bg-soft-2 p-[clamp(28px,5vw,56px)]", i % 2 ? "md:border-r" : "md:border-l", "border-line")}>
              <Reveal className="flex w-full justify-center">
                <Mock s={s} />
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <FAQ items={page.faqs} title={`About ${page.name.toLowerCase()}.`} subtitle="What teams ask first." />
      <GlowCTA title={page.cta} />
    </>
  );
}

