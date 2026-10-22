import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Bot, Calendar, CreditCard, Database, FileSignature, FileText, Headphones, Mail, MessagesSquare, Phone, Plug, Video,
  Webhook, Workflow,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  AskList, AskReport, Board, CallWindow, ChatWindow, EmailSuggestion, FlowGraph, HeroApp, LineChart, Orbit, PersonRecord, RiskList, RoutedLeads,
  Signals, StackedBars, TaskStack, TerminalWindow, CompaniesTable, QuotaList,
} from "@/components/marketing/mocks";
import { GlowCTA, Reveal, RevealGroup, RevealItem, TwoTone } from "@/components/marketing/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Eyebrow } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------- Hero */

function Hero() {
  const reduce = useReducedMotion();
  const appear = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, filter: "blur(2px)", y: 8 }, animate: { opacity: 1, filter: "blur(0px)", y: 0 }, transition: { duration: 0.7, ease, delay } };
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Hatched blue backdrop that fades in behind the product windows. */}
      <div aria-hidden className="vlines absolute inset-x-0 bottom-0 top-[42%] [mask-image:linear-gradient(to_bottom,transparent,#000_45%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 top-[42%] bg-[linear-gradient(to_bottom,transparent,rgb(198_212_255/0.55)_55%,rgb(160_182_255/0.75))]" />
      <div className="relative mx-auto flex max-w-[980px] flex-col items-center gap-9 px-5 pb-16 pt-[clamp(72px,10vw,124px)] text-center">
        <motion.div {...appear(0)}>
          <Link
            href="/platform/agents"
            className="group inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[14px] text-ink shadow-[0_1px_2px_rgb(16_17_26/0.05)] transition-colors hover:bg-soft"
          >
            How agents run a week of prospecting
            <ArrowRight aria-hidden className="size-3 text-subtle transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
        <motion.h1 {...appear(0.08)} className="display text-balance text-[clamp(44px,6.4vw,76px)] font-semibold leading-[0.95] tracking-[-0.02em]">
          Revenue that runs itself.
        </motion.h1>
        <motion.p {...appear(0.16)} className="max-w-[460px] text-[18px] leading-[1.4] text-subtle">
          Vult is the AI-native CRM that fills itself in, finds the next deal and follows up — around the clock.
        </motion.p>
        <motion.div {...appear(0.24)} className="flex flex-wrap justify-center gap-2.5">
          <Button href="/contact" variant="secondary" size="md">
            Talk to sales
          </Button>
          <Button href="/signup" size="md">
            Start for free
          </Button>
        </motion.div>
      </div>

      <div className="relative mx-auto h-[clamp(420px,46vw,620px)] max-w-[1392px] px-6">
        <motion.div
          className="absolute inset-x-[clamp(16px,13%,200px)] top-0"
          initial={reduce ? false : { opacity: 0, scale: 0.98, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.35 }}
        >
          <HeroApp />
        </motion.div>
        <motion.div
          className="absolute left-6 top-[-24px] hidden xl:block"
          initial={reduce ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.7 }}
        >
          <ChatWindow />
        </motion.div>
        <motion.div
          className="absolute right-6 top-[40px] hidden xl:block"
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.85 }}
        >
          <CallWindow />
        </motion.div>
        <motion.div
          className="absolute bottom-6 left-[clamp(24px,4%,64px)] hidden lg:block"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 1 }}
        >
          <TerminalWindow />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Logos */

const LOGOS: { name: string; shape: string; style: string; story?: boolean }[] = [
  { name: "kelvra", shape: "rotate-45 bg-current", style: "font-bold tracking-[-0.04em]", story: true },
  { name: "ORTIQ", shape: "rounded-full border-[2.5px] border-current", style: "font-semibold tracking-[0.08em]" },
  { name: "Solvane", shape: "rounded-md bg-current", style: "font-medium tracking-[-0.02em]", story: true },
  { name: "Maplewing", shape: "rounded-[50%_0_50%_50%] border-[2.5px] border-current", style: "font-bold italic tracking-[-0.03em]" },
  { name: "halbrook", shape: "rounded-full bg-current", style: "font-semibold tracking-[-0.03em]", story: true },
  { name: "nodeline", shape: "rotate-45 rounded-sm border-[2.5px] border-current", style: "font-medium", story: true },
  { name: "Brightvale", shape: "rounded-[50%_50%_0_50%] bg-current", style: "font-semibold tracking-[-0.035em]" },
  { name: "COBALT&FINCH", shape: "border-[2.5px] border-current", style: "font-bold tracking-[0.02em]", story: true },
  { name: "Tessaro", shape: "rounded-full border-[2.5px] border-current", style: "font-normal tracking-[-0.02em]" },
  { name: "wendell", shape: "rounded-[6px_0] bg-current", style: "font-bold tracking-[-0.05em]" },
];

function LogoGrid() {
  return (
    <section aria-label="Teams using Vult" className="border-y border-line bg-soft">
      <RevealGroup step={0.04} className="rail grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5">
        {LOGOS.map((l) => {
          const inner = (
            <>
              <span aria-hidden className={cn("size-[20px] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-110", l.shape)} />
              <span className={cn("text-[19px]", l.style)}>{l.name}</span>
              {l.story && <ArrowUpRight aria-hidden className="absolute right-3 top-3 size-3.5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
            </>
          );
          const cls = "group relative flex h-24 items-center justify-center gap-2.5 bg-soft text-[#2a2c31] transition-colors hover:bg-white";
          return (
            <RevealItem key={l.name} className="contents">
              {l.story ? (
                <Link href="/customers" className={cls} aria-label={`${l.name} customer story`}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}

/* ---------------------------------------------------------------- Platform use cases */

interface UseCase {
  id: string;
  label: string;
  lead: string;
  rest: string;
  band: ReactNode;
  cells: { title: string; copy: string; mock: ReactNode }[];
}

const USE_CASES: UseCase[] = [
  {
    id: "pipeline",
    label: "Build pipeline",
    lead: "Your team, amplified.",
    rest: "Agents find the accounts that are ready to buy and start the conversation for you.",
    band: (
      <div className="relative">
        <div className="max-w-[720px] overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <CompaniesTable rows={6} />
        </div>
        <div className="absolute -right-4 top-10 hidden xl:block">
          <EmailSuggestion />
        </div>
      </div>
    ),
    cells: [
      { title: "Free your reps to sell.", copy: "Agents handle the research and the busywork. Reps spend their day where deals are won.", mock: <AskList /> },
      { title: "Know who to call, and why.", copy: "Every account is enriched and scored, so reps know exactly when to reach out.", mock: <Orbit /> },
    ],
  },
  {
    id: "convert",
    label: "Convert leads",
    lead: "Speed to lead, every time.",
    rest: "New leads are researched, scored and routed to the right rep before they cool off.",
    band: <FlowGraph />,
    cells: [
      { title: "Inbound, qualified in seconds.", copy: "Score every form fill against your ideal customer profile and route the good ones instantly.", mock: <RoutedLeads /> },
      { title: "No more dropped hand-offs.", copy: "Every hand-off arrives with context, a task and a due date.", mock: <TaskStack /> },
    ],
  },
  {
    id: "motions",
    label: "Run sales motions",
    lead: "Run every motion, your way.",
    rest: "A pipeline built for how you sell, while agents prep the meetings and keep deals moving.",
    band: <Board />,
    cells: [
      { title: "See what changed in the deal.", copy: "New stakeholders, competitor mentions and stalls, surfaced before your next call.", mock: <StackedBars /> },
      { title: "Skip the review scramble.", copy: "Walk into pipeline review with risks already mapped and next steps drafted.", mock: <RiskList /> },
    ],
  },
  {
    id: "forecast",
    label: "Forecast revenue",
    lead: "For the people who own the number.",
    rest: "Ask any revenue question and get the answer — with the records behind it — in seconds.",
    band: (
      <div className="w-full max-w-[720px]">
        <AskReport />
      </div>
    ),
    cells: [
      { title: "A forecast you can defend.", copy: "Stage-weighted, rep-by-rep and updated the moment a deal moves.", mock: <LineChart title="Forecast vs. target" series={[[30, 34, 38, 41, 46, 52, 57, 63], [32, 36, 40, 44, 48, 52, 56, 60]]} /> },
      { title: "Every rep, one view.", copy: "Quota attainment and coverage side by side, without exporting a thing.", mock: <QuotaList /> },
    ],
  },
  {
    id: "retain",
    label: "Retain and expand",
    lead: "Keep more. Grow more.",
    rest: "Agents watch your whole book, so you save what's slipping and grow what's rising.",
    band: (
      <div className="grid w-full max-w-[760px] gap-4 sm:grid-cols-2">
        <LineChart />
        <RiskList />
      </div>
    ),
    cells: [
      { title: "Spot the shift early.", copy: "Role changes, new funding and usage drops show up weeks before renewal.", mock: <Signals /> },
      {
        title: "The next move, drafted.",
        copy: "Saves, upsells and renewals arrive as ready-to-send plays for you to approve.",
        mock: <EmailSuggestion to="Jun Park" subject="Ready to add more seats?" body="Usage at Halbrook grew 42% this month and the team is near its seat limit. Offer an upgrade before the renewal call." />,
      },
    ],
  },
];

function UseCaseNav({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <nav aria-label="Use cases" className="sticky top-[100px] hidden flex-col gap-1 py-[120px] lg:flex">
      {USE_CASES.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onPick(u.id)}
          aria-current={active === u.id ? "true" : undefined}
          className={cn("relative py-1.5 pl-[58px] text-left text-[18px] font-medium transition-colors", active === u.id ? "text-ink" : "text-[#b6bac3] hover:text-ink-2")}
        >
          {active === u.id && <motion.span layoutId="usecase-bar" className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          {u.label}
        </button>
      ))}
    </nav>
  );
}

function UseCaseBlock({ u }: { u: UseCase }) {
  return (
    <div id={`uc-${u.id}`} data-usecase={u.id} className="scroll-mt-[100px] border-b border-line last:border-b-0">
      <div className="px-[clamp(20px,4vw,58px)] py-[clamp(56px,7vw,110px)]">
        <p className="mb-4 text-[14px] font-medium text-accent lg:hidden">{u.label}</p>
        <Reveal>
          <TwoTone lead={u.lead} rest={u.rest} as="h3" className="max-w-[560px] text-[clamp(22px,2.2vw,26px)] leading-[1.25]" />
        </Reveal>
      </div>
      <div className="flex justify-center overflow-hidden border-y border-line bg-soft-2 px-[clamp(16px,4vw,58px)] py-[clamp(32px,5vw,64px)]">
        <Reveal className="w-full max-w-[860px]">{u.band}</Reveal>
      </div>
      <div className="grid md:grid-cols-2">
        {u.cells.map((c, i) => (
          <div key={c.title} className={cn("flex flex-col gap-8 px-[clamp(20px,3vw,32px)] py-12", i === 0 && "md:border-r", "border-line max-md:border-b")}>
            <Reveal>
              <h4 className="text-[18px] font-medium text-ink">{c.title}</h4>
              <p className="mt-1 max-w-[340px] text-[16px] leading-[1.4] text-tone">{c.copy}</p>
            </Reveal>
            <Reveal delay={0.1} className="flex min-h-[220px] items-center justify-center">
              {c.mock}
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}

function Platform() {
  const [active, setActive] = useState(USE_CASES[0]!.id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = ref.current?.querySelectorAll<HTMLElement>("[data-usecase]");
    if (!els?.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive((hit.target as HTMLElement).dataset.usecase!);
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);

  const pick = (id: string) => document.getElementById(`uc-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="bg-soft">
      <div className="rail px-[clamp(20px,4vw,58px)] pb-16 pt-[clamp(80px,10vw,150px)]">
        <Reveal className="flex flex-col gap-5">
          <Eyebrow className="self-start">Platform</Eyebrow>
          <h2 className="display max-w-[900px] text-[clamp(32px,3.2vw,40px)] font-medium leading-[1.1] tracking-[-0.01em]">
            <span className="text-ink">The CRM that never clocks off.</span>
            <br />
            <span className="text-tone">Works the leads at 2am. Flags the renewal before it slips.</span>
          </h2>
        </Reveal>
      </div>
      <div ref={ref} className="rail grid border-t border-line lg:grid-cols-[348px_1fr]">
        <div className="hidden border-r border-line lg:block">
          <UseCaseNav active={active} onPick={pick} />
        </div>
        <div className="min-w-0 bg-white">
          {USE_CASES.map((u) => (
            <UseCaseBlock key={u.id} u={u} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Self-building */

function SelfBuilding() {
  return (
    <section className="border-t border-line bg-white">
      <div className="rail flex flex-col items-center gap-6 px-6 pt-[clamp(80px,10vw,140px)] text-center">
        <Eyebrow>Self-building</Eyebrow>
        <TwoTone
          lead="Live on day one."
          rest="Connect your inbox and calendar. Vult learns your business and builds itself around it — before your first agent starts work."
          className="max-w-[860px] text-[clamp(30px,3.6vw,44px)] leading-[1.1]"
        />
        <Button href="/signup" variant="secondary" size="md">
          Start for free
        </Button>
      </div>
      <div className="rail relative mt-14">
        <div aria-hidden className="vlines absolute inset-x-0 top-0 h-28 opacity-60 [mask-image:linear-gradient(to_bottom,transparent,#000)]" />
        <Reveal className="relative mx-auto max-w-[1100px] px-4 pb-20 pt-24">
          <PersonRecord />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Dark: memory + signals */

const MEMORY_POINTS = [
  ["It logs itself.", "Email, calls, product and billing, captured automatically."],
  ["Your tools finally talk.", "Notes, chat and your whole stack, always in sync."],
  ["It learns your business.", "Every play is sharper than the last."],
  ["Ask, and it's there.", "Any record, any answer, in a second."],
  ["No agent left guessing.", "Agents work from the same facts as your team."],
];

function Memory() {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div className="rail-dark relative">
        <div className="relative flex flex-col items-center px-6 pb-0 pt-[clamp(90px,11vw,160px)] text-center">
          <p className="text-[15px] text-[#8a8f9a]">The only CRM with</p>
          <h2 className="display mt-2 text-[clamp(52px,8vw,96px)] font-semibold leading-none tracking-[-0.024em]">Shared Memory</h2>
          <div aria-hidden className="relative mt-10 h-[clamp(160px,22vw,300px)] w-full overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-0 aspect-square w-[min(1200px,140%)] -translate-x-1/2 rounded-full p-[1.5px] [background:conic-gradient(from_200deg,transparent_0deg,#f59e0b_40deg,#ef4444_70deg,#8b5cf6_110deg,#266df0_150deg,#06b6d4_175deg,transparent_200deg)]"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease }}
            >
              <div className="h-full w-full rounded-full bg-night shadow-[inset_0_40px_80px_-30px_rgb(38_109_240/0.35)]" />
            </motion.div>
          </div>
        </div>
        <RevealGroup className="grid border-t border-night-line sm:grid-cols-2 lg:grid-cols-5">
          {MEMORY_POINTS.map(([t, d], i) => (
            <RevealItem key={t} className={cn("px-6 py-7", i < 4 && "lg:border-r", "border-night-line max-lg:border-b")}>
              <p className="text-[14px] font-medium text-white">{t}</p>
              <p className="mt-1 text-[13px] text-[#8a8f9a]">{d}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <div className="grid border-t border-night-line md:grid-cols-[1fr_1fr]">
          <Reveal className="flex flex-col justify-between gap-10 px-[clamp(20px,4vw,58px)] py-[clamp(56px,7vw,100px)] md:border-r md:border-night-line">
            <div className="flex flex-col gap-5">
              <Eyebrow dark className="self-start">
                Signals
              </Eyebrow>
              <TwoTone dark lead="Every signal, none of the noise." rest="Ready to act on." className="max-w-[440px] text-[clamp(28px,3vw,40px)] leading-[1.1]" />
              <Button href="/platform/enrichment" variant="outline-inverse" size="md" className="self-start">
                See how it works <ArrowRight className="size-3.5" />
              </Button>
            </div>
            <div className="flex flex-col gap-3 border-t border-night-line pt-5 text-[13px]">
              <p className="font-medium text-white">Context</p>
              <p className="text-[#8a8f9a]">Emails, calls, records and product usage — joined on every account.</p>
            </div>
          </Reveal>
          <div className="flex items-center justify-center px-6 py-14">
            <div className="flex w-full max-w-[380px] flex-col gap-2.5">
              {[
                ["Halbrook raised a $40M Series B", "Funding", "#8b5cf6"],
                ["Ava Bennett is now Head of RevOps at Kelvra", "Role change", "#266df0"],
                ["Usage at Maplewing dropped 38% in 30 days", "Risk", "#ef4444"],
                ["Solvane viewed pricing four times this week", "Intent", "#f59e0b"],
              ].map(([t, tag, c], i) => (
                <motion.div
                  key={t}
                  className="flex items-center gap-3 rounded-xl border border-night-line bg-night-2 px-3.5 py-3 text-[13px]"
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease }}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 12px ${c}` }} />
                  <span className="flex-1 text-[#e9eaee]">{t}</span>
                  <span className="rounded-md border border-night-line px-1.5 py-0.5 text-[11.5px] text-[#a9acb6]">{tag}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Dark: connectivity */

const TILES = [Mail, Calendar, MessagesSquare, Video, CreditCard, Database, FileText, Headphones, Phone, FileSignature, Webhook, Workflow, Bot, Plug];

function Connectivity() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden border-t border-night-line bg-night text-white">
      <div aria-hidden className="vlines-dark absolute inset-0" />
      <div className="rail-dark relative flex flex-col items-center gap-6 px-6 pb-14 pt-[clamp(90px,10vw,150px)] text-center">
        <Eyebrow dark>Connectivity</Eyebrow>
        <h2 className="display text-[clamp(32px,3.4vw,44px)] font-medium leading-[1.1] tracking-[-0.01em]">Your whole stack, connected.</h2>
        <p className="max-w-[340px] text-[16px] text-[#8a8f9a]">Inbox, calendar, chat, billing and anything your team and agents run on.</p>
        <Button href="/platform/automations" variant="outline-inverse" size="md">
          Explore integrations <ArrowRight className="size-3.5" />
        </Button>
      </div>
      <div className="relative overflow-hidden pb-[clamp(90px,10vw,150px)] pt-8 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <motion.div className="flex w-max gap-8" animate={reduce ? undefined : { x: ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
          {[...TILES, ...TILES].map((Icon, i) => (
            <span key={i} className="flex size-24 shrink-0 items-center justify-center rounded-[22px] border border-white/5 bg-[linear-gradient(180deg,#1f2023,#161618)] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
              <Icon aria-hidden className="size-8 text-[#c9cbd2]" strokeWidth={1.5} />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Dark: developers */

const CODE = `import { Vult } from "@vult/sdk";

const vult = new Vult({ apiKey: process.env.VULT_API_KEY });

await vult.records.create("deals", {
  name: "Platform rollout",
  company: "kelvra.example",
  value: 84000,
  stage: "Negotiation",
});`;

function Developers() {
  const [tab, setTab] = useState<"sdk" | "api" | "mcp">("sdk");
  const snippets = {
    sdk: CODE,
    api: `curl https://api.vult.example/v1/records/deals \\
  -H "Authorization: Bearer $VULT_API_KEY" \\
  -d '{ "name": "Platform rollout", "value": 84000 }'`,
    mcp: `{
  "mcpServers": {
    "vult": { "url": "https://mcp.vult.example", "auth": "oauth" }
  }
}`,
  };
  return (
    <section className="border-t border-night-line bg-night text-white">
      <div className="rail-dark grid md:grid-cols-2">
        <Reveal className="flex flex-col gap-6 px-[clamp(20px,4vw,58px)] py-[clamp(64px,8vw,120px)] md:border-r md:border-night-line">
          <TwoTone dark lead="SDK. API. MCP." rest="Build anything on Vult." className="text-[clamp(30px,3.2vw,40px)] leading-[1.1]" />
          <p className="max-w-[380px] text-[15px] text-[#8a8f9a]">Typed SDKs, a REST API, webhooks and an MCP server, so your code and your agents work from the same records.</p>
          <Button href="/about" variant="outline-inverse" size="md" className="self-start">
            View docs <ArrowRight className="size-3.5" />
          </Button>
        </Reveal>
        <div className="flex items-center px-[clamp(16px,3vw,40px)] py-12">
          <div className="w-full overflow-hidden rounded-xl border border-night-line bg-night-2">
            <div role="tablist" aria-label="Code examples" className="flex gap-1 border-b border-night-line px-2 pt-2">
              {(["sdk", "api", "mcp"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn("relative px-3 pb-2 pt-1 text-[12.5px] font-medium uppercase tracking-wide transition-colors", tab === t ? "text-white" : "text-[#8a8f9a] hover:text-white")}
                >
                  {t}
                  {tab === t && <motion.span layoutId="code-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={tab}
                role="tabpanel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#c9cbd2]"
              >
                {snippets[tab]}
              </motion.pre>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Scale */

const STATS = [
  ["40M", "agent actions / month"],
  ["1.8B", "API requests / month"],
  ["52k", "active workspaces"],
  ["12M", "emails synced / day"],
];

function Scale() {
  const W = 1000;
  const H = 520;
  const curve = Array.from({ length: 101 }, (_, i) => {
    const x = (i / 100) * W;
    const y = H - 40 - Math.pow(i / 100, 2.6) * (H - 40);
    return [x, y] as const;
  });
  const d = curve.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <section className="border-t border-line bg-white">
      <div className="rail relative grid min-h-[600px] overflow-hidden lg:grid-cols-[1fr_1.3fr]">
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full max-lg:opacity-40">
          <defs>
            <pattern id="scale-lines" width="7" height="10" patternUnits="userSpaceOnUse">
              <rect width="1" height="10" fill="rgb(38 109 240 / 0.14)" />
            </pattern>
            <clipPath id="under-curve">
              <path d={`${d} L ${W} ${H} L 0 ${H} Z`} />
            </clipPath>
          </defs>
          <rect width={W} height={H} fill="url(#scale-lines)" clipPath="url(#under-curve)" />
          <motion.path d={d} fill="none" stroke="#266df0" strokeWidth="2" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, ease }} />
        </svg>
        <Reveal className="relative flex flex-col gap-10 px-[clamp(20px,4vw,58px)] py-[clamp(72px,9vw,130px)]">
          <div className="flex flex-col gap-5">
            <Eyebrow className="self-start">Built to scale</Eyebrow>
            <h2 className="display text-[clamp(32px,3.2vw,40px)] font-medium leading-[1.1] tracking-[-0.01em]">
              <span className="text-ink">Run at any scale.</span>
              <br />
              <span className="text-tone">Production-grade for your team and your agents.</span>
            </h2>
          </div>
          <dl className="grid max-w-[480px] grid-cols-2 gap-x-8 gap-y-7">
            {STATS.map(([v, l]) => (
              <div key={l} className="border-l-2 border-accent pl-5">
                <dt className="sr-only">{l}</dt>
                <dd className="display text-[30px] font-medium leading-none tracking-[-0.01em]">{v}</dd>
                <dd className="mt-1.5 text-[14px] text-ink-2">{l}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[12px] text-subtle">Illustrative figures for a fictional product.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Stories + quote */

function Stories() {
  return (
    <section className="border-t border-line bg-white">
      <div className="rail grid md:grid-cols-2">
        <Reveal className="flex flex-col justify-end gap-3 border-line px-[clamp(20px,4vw,58px)] py-[clamp(56px,7vw,100px)] md:border-r">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-subtle">Artificial intelligence</p>
          <TwoTone lead="83% faster lead triage." rest="How Kelvra turned product signals into pipeline." className="max-w-[420px] text-[clamp(24px,2.4vw,30px)] leading-[1.15]" />
          <Link href="/customers" className="group mt-2 inline-flex w-fit items-center gap-1 text-[14px] font-medium text-ink">
            Read the story <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
        <div className="relative min-h-[320px] overflow-hidden bg-[linear-gradient(135deg,#dfe7ff,#f3f0ff_60%,#fff4e6)]">
          <div aria-hidden className="vlines absolute inset-0 opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-3 rounded-2xl bg-white/80 px-6 py-4 shadow-card backdrop-blur">
              <span className="size-7 rotate-45 bg-ink" />
              <span className="text-[28px] font-bold tracking-[-0.04em]">kelvra</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

const QUOTES = [
  { q: "The first time I opened Vult, it felt like the next generation of CRM.", n: "Margot Lindell", r: "Head of Business Operations · Kelvra" },
  { q: "Our reps open Vult before they open their inbox. That never happened with our old CRM.", n: "Daniel Osei", r: "VP Sales · Ortiq" },
  { q: "We modeled partners, funds and portfolio companies without a single workaround.", n: "Elena Brandt", r: "Partner · Halbrook Capital" },
];

function Quote() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % QUOTES.length), 7000);
    return () => clearInterval(t);
  }, [reduce]);
  const q = QUOTES[i]!;
  return (
    <section aria-label="Testimonials" className="dot-grid border-t border-line bg-soft">
      <div className="rail flex min-h-[460px] flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <AnimatePresence mode="wait">
          <motion.figure key={q.n} className="flex flex-col items-center gap-6" initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease }}>
            <blockquote className="display max-w-[760px] text-balance text-[clamp(26px,3vw,36px)] font-medium leading-[1.2] tracking-[-0.01em] text-[#5f6572]">“{q.q}”</blockquote>
            <figcaption className="flex items-center gap-3 text-left text-[13px]">
              <Avatar name={q.n} size={36} />
              <span>
                <b className="block font-semibold text-ink">{q.n}</b>
                <span className="text-subtle">{q.r}</span>
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
        <div className="flex gap-1.5">
          {QUOTES.map((x, n) => (
            <button key={x.n} type="button" aria-label={`Show quote ${n + 1}`} aria-current={n === i} onClick={() => setI(n)} className="flex h-6 items-center">
              <motion.span className="block h-1.5 rounded-full" animate={{ width: n === i ? 20 : 6, backgroundColor: n === i ? "#1b1c1e" : "#cfd2d8" }} />
            </button>
          ))}
        </div>
        <p className="text-[12px] text-subtle">Illustrative quotes from fictional customers.</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Changelog + newsletter */

const UPDATES = [
  ["Oct 14, 2026", "Kanban swimlanes", "Group any board by owner or segment."],
  ["Oct 2, 2026", "Agents, generally available", "Approvals and a full run log for every agent."],
  ["Sep 18, 2026", "Forecast dashboards", "Weighted pipeline with week-over-week change."],
  ["Sep 3, 2026", "Inline editing everywhere", "Edit any cell in place, keyboard first."],
];

function ChangelogStrip() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  return (
    <section className="border-t border-line bg-white">
      <div className="rail grid lg:grid-cols-[1fr_2fr]">
        <Reveal className="flex flex-col gap-5 px-[clamp(20px,4vw,58px)] py-[clamp(56px,7vw,100px)] lg:border-r lg:border-line">
          <Eyebrow className="self-start">Changelog</Eyebrow>
          <TwoTone lead="Better as you grow." rest="New features every week to keep pace with you." className="max-w-[340px] text-[clamp(26px,2.6vw,32px)] leading-[1.15]" />
        </Reveal>
        <RevealGroup className="grid border-line sm:grid-cols-2 xl:grid-cols-4">
          {UPDATES.map(([date, t, d], i) => (
            <RevealItem key={t} className={cn("flex flex-col gap-1.5 border-line px-6 py-10", i < 3 && "xl:border-r", i % 2 === 0 && "sm:max-xl:border-r", "max-xl:border-b")}>
              <Link href="/changelog" className="group flex h-full flex-col gap-1.5">
                <span className="text-[12px] text-subtle">{date}</span>
                <span className="text-[15px] font-semibold text-ink group-hover:underline">{t}</span>
                <span className="text-[13.5px] text-subtle">{d}</span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
      <div className="rail flex flex-wrap items-center justify-between gap-6 border-t border-line px-[clamp(20px,4vw,58px)] py-12">
        <TwoTone as="h3" lead="Stay ahead of revenue." rest="Product updates in your inbox." className="text-[22px] leading-[1.2]" />
        {done ? (
          <p role="status" className="text-[14px] font-medium text-[#16753f]">
            Thanks — you&apos;re subscribed (demo).
          </p>
        ) : (
          <form
            noValidate
            className="flex flex-wrap items-start gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Enter a valid email address.");
              setDone(true);
            }}
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErr("");
                }}
                aria-invalid={!!err}
                aria-describedby={err ? "newsletter-err" : undefined}
                placeholder="Your email address"
                className="h-9 w-[260px] rounded-[10px] border border-line-strong bg-white px-3 text-[14px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgb(38_109_240/0.15)] aria-[invalid=true]:border-danger"
              />
              {err && (
                <span id="newsletter-err" role="alert" className="text-[12.5px] text-danger">
                  {err}
                </span>
              )}
            </div>
            <Button type="submit" size="md">
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle("");
  return (
    <>
      <Hero />
      <LogoGrid />
      <Platform />
      <SelfBuilding />
      <Memory />
      <Connectivity />
      <Developers />
      <Scale />
      <Stories />
      <Quote />
      <ChangelogStrip />
      <GlowCTA title="Revenue runs on Vult." secondary="Talk to sales" />
    </>
  );
}
