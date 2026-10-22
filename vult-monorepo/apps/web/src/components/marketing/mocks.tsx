import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp, Bot, Building2, CalendarDays, Check, CheckSquare, ChevronDown, CircleDollarSign, Clock3, FileText, Filter, GitBranch, Globe,
  Mail, MessageSquare, Mic, MoreHorizontal, Play, Search, Send, Sparkles, Star, Table2, User, Users, Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

/* All names, companies and numbers in these mockups are fictional. */

const ease = [0.16, 1, 0.3, 1] as const;

/** Types `text` out character by character (instant when reduced motion is on). */
function Typewriter({ text, delay = 0, speed = 28, onDone }: { text: string; delay?: number; speed?: number; onDone?: () => void }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) {
      onDone?.();
      return;
    }
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < text.length) t = setTimeout(tick, speed);
      else onDone?.();
    };
    t = setTimeout(tick, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reduce]);
  return (
    <>
      <span aria-hidden>{text.slice(0, n)}</span>
      {n < text.length && <span aria-hidden className="caret ml-px inline-block h-[1em] w-px translate-y-[2px] bg-current" />}
      <span className="sr-only">{text}</span>
    </>
  );
}

export function Window({ children, dark, title, className, bodyClassName }: { children: ReactNode; dark?: boolean; title?: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border p-1.5 shadow-[0_24px_60px_-28px_rgb(16_17_26/0.35)]", dark ? "border-[#2a2b2f] bg-[#1b1c1f]" : "border-[#e2e4e9] bg-[#f3f4f6]", className)}>
      <div className="flex h-7 items-center gap-2 px-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-[10px] rounded-full bg-[#ff5f57]" />
          <span className="size-[10px] rounded-full bg-[#febc2e]" />
          <span className="size-[10px] rounded-full bg-[#28c840]" />
        </span>
        {title && <span className={cn("ml-1 truncate text-[12px] font-medium", dark ? "text-[#a9acb6]" : "text-subtle")}>{title}</span>}
      </div>
      <div className={cn("overflow-hidden rounded-[10px] border", dark ? "border-[#2a2b2f] bg-[#111214] text-[#e9eaee]" : "border-[#e6e8ec] bg-white", bodyClassName)}>{children}</div>
    </div>
  );
}

export function Card({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-[#e6e8ec] bg-white shadow-[0_1px_2px_rgb(16_17_26/0.05),0_8px_24px_-16px_rgb(16_17_26/0.18)]", className)}>{children}</div>;
}

function Pill({ children, tone = "gray", className }: { children: ReactNode; tone?: "gray" | "green" | "blue" | "amber" | "violet" | "red"; className?: string }) {
  const t = {
    gray: "bg-[#f1f2f4] text-[#4b4f5c]",
    green: "bg-[#e3f7ec] text-[#16753f]",
    blue: "bg-[#e5eeff] text-[#1d56c4]",
    amber: "bg-[#fff3d6] text-[#8a5a00]",
    violet: "bg-[#efe8ff] text-[#5b3cc4]",
    red: "bg-[#fdecec] text-[#b42323]",
  }[tone];
  return <span className={cn("inline-flex h-[22px] items-center rounded-md px-1.5 text-[12px] font-medium", t, className)}>{children}</span>;
}

/* ---------- Hero ---------- */

const COMPANIES = [
  ["Kelvra", 98, "Ava Bennett", "Opened 4 AE roles this month"],
  ["Ortiq", 97, "Theo Lindqvist", "New VP Sales from a scale-up"],
  ["Halbrook", 96, "Maya Ruiz", "Raised a Series B last week"],
  ["Solvane", 95, "Ines Okafor", "Expanding into the EU"],
  ["Brightvale", 93, "Jun Park", "Evaluating CRM vendors"],
  ["Maplewing", 91, "Dani Rossi", "Doubling the sales team"],
  ["Nodeline", 90, "Maya Ruiz", "Launched a self-serve plan"],
  ["Tessaro", 88, "Theo Lindqvist", "Hiring a Head of RevOps"],
] as const;

export function CompaniesTable({ rows = 8, compact }: { rows?: number; compact?: boolean }) {
  return (
    <div className="text-[13px]">
      <div className="flex items-center gap-2 border-b border-[#eef0f2] px-3 py-2.5">
        <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-accent text-white">
          <Building2 className="size-3" />
        </span>
        <span className="font-semibold">Companies to work</span>
        <span className="ml-auto flex -space-x-1.5">
          {["Ava Bennett", "Jun Park", "Maya Ruiz"].map((n) => (
            <Avatar key={n} name={n} size={20} className="ring-2 ring-white" />
          ))}
        </span>
        {!compact && (
          <span className="ml-2 inline-flex h-7 items-center gap-1 rounded-lg border border-[#e6e8ec] px-2 text-[12px]">
            <Sparkles className="size-3" /> Ask Vult
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 border-b border-[#eef0f2] px-3 py-2">
        <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#e6e8ec] px-2 text-[12px]">
          <Table2 className="size-3 text-[#16a34a]" /> All companies <ChevronDown className="size-3 text-muted" />
        </span>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#e6e8ec] px-2 text-[12px] text-ink-2">
          <Filter className="size-3" /> ICP score ≥ 85
        </span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-[12px] text-subtle">
            <th className="w-8 border-b border-[#eef0f2] py-2 pl-3 font-medium" />
            <th className="border-b border-r border-[#eef0f2] px-3 py-2 font-medium">Company</th>
            <th className="border-b border-r border-[#eef0f2] px-3 py-2 font-medium">ICP score</th>
            <th className="border-b border-r border-[#eef0f2] px-3 py-2 font-medium">Owner</th>
            {!compact && <th className="border-b border-[#eef0f2] px-3 py-2 font-medium">Research</th>}
          </tr>
        </thead>
        <tbody>
          {COMPANIES.slice(0, rows).map(([name, score, owner, note], i) => (
            <motion.tr key={name} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.05 }}>
              <td className="border-b border-[#f1f2f4] py-2 pl-3">
                <span className="block size-3.5 rounded border border-[#d6d8de]" />
              </td>
              <td className="border-b border-r border-[#f1f2f4] px-3 py-2">
                <span className="inline-flex items-center gap-2 font-medium underline decoration-[#d6d8de] underline-offset-2">
                  <Avatar name={name} square size={16} /> {name}
                </span>
              </td>
              <td className="border-b border-r border-[#f1f2f4] px-3 py-2">
                <Pill tone="green" className="tabular">
                  {score}
                </Pill>
              </td>
              <td className="whitespace-nowrap border-b border-r border-[#f1f2f4] px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={owner} size={16} /> {owner}
                </span>
              </td>
              {!compact && <td className="max-w-[220px] truncate border-b border-[#f1f2f4] px-3 py-2 text-ink-2">{note}</td>}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmailSuggestion({ to = "Ava Bennett", subject = "Send a follow-up to Ava Bennett", body = "Ava just opened four AE roles and the team is evaluating tools this quarter. Suggest a 20-minute call to scope a pilot." }: { to?: string; subject?: string; body?: string }) {
  return (
    <Card className="w-[320px] p-3.5 text-[13px]">
      <p className="text-[12px] text-subtle">Suggested email</p>
      <p className="mt-1 text-[14px] font-semibold">{subject}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-subtle">{body}</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#eef0f2] px-2.5 py-2">
        <span className="text-subtle">To</span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Avatar name={to} size={18} /> {to}
        </span>
        <span className="ml-auto text-[12px] text-subtle">CC / BCC</span>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <span className="inline-flex h-7 items-center rounded-lg border border-[#e6e8ec] px-2.5 text-[12px]">Edit</span>
        <span className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#1f2023] px-2.5 text-[12px] text-white">
          <Send className="size-3" /> Send
        </span>
      </div>
    </Card>
  );
}

export function ChatWindow() {
  const [replied, setReplied] = useState(false);
  return (
    <Window title="# pipeline" className="w-[300px]">
      <div className="flex flex-col gap-3 p-3 text-[12.5px]">
        <div className="flex gap-2">
          <Avatar name="Marcus Ode" size={26} square className="!rounded-md" />
          <div>
            <p>
              <b className="font-semibold">Marcus</b> <span className="text-[11px] text-subtle">10:24</span>
            </p>
            <p>
              <span className="rounded bg-accent-soft px-0.5 text-accent-ink">@Vult</span>{" "}
              <Typewriter text="which deals should I push today?" delay={900} onDone={() => setReplied(true)} />
            </p>
          </div>
        </div>
        <motion.div className="flex gap-2" initial={false} animate={replied ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 6, filter: "blur(1.5px)" }} transition={{ duration: 0.42, ease: [0.33, 1, 0.68, 1], delay: 0.35 }}>
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-ink">
            <LogoMark tone="light" size={16} />
          </span>
          <div>
            <p>
              <b className="font-semibold">Vult</b> <span className="rounded bg-[#f1f2f4] px-1 text-[10px] font-semibold text-subtle">APP</span>{" "}
              <span className="text-[11px] text-subtle">10:24</span>
            </p>
            <p className="leading-snug">
              Kelvra (verbal yes, waiting on the order form) and Halbrook (stalled in legal — I drafted a nudge).
            </p>
          </div>
        </motion.div>
      </div>
    </Window>
  );
}

export function CallWindow() {
  return (
    <Window title="Call with Halbrook" className="w-[300px]">
      <div className="p-2.5">
        <div className="relative flex h-[120px] items-end overflow-hidden rounded-lg bg-[#1b1c1f] p-2.5">
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgb(38_109_240/0.35),transparent_60%)]" />
          <span className="relative flex h-8 flex-1 items-end gap-[3px]">
            {[8, 14, 22, 12, 28, 18, 10, 24, 16, 9, 20, 26, 12, 7, 18, 22, 11, 15].map((h, i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-white/70"
                animate={{ height: [h * 0.5, h, h * 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: i * 0.05 }}
              />
            ))}
          </span>
          <span className="relative ml-2 text-[11px] text-white/80">28:14</span>
        </div>
        <div className="mt-2 flex gap-1.5 text-[11.5px]">
          <span className="rounded-md border border-[#e6e8ec] px-1.5 py-0.5 font-medium">Transcript</span>
          <span className="px-1.5 py-0.5 text-subtle">Speakers</span>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-ink-2">
          <span className="text-subtle">0:02 </span>We track pipeline in three spreadsheets right now and it&apos;s getting painful…
        </p>
      </div>
    </Window>
  );
}

export function TerminalWindow() {
  return (
    <Window dark title="vult agent" className="w-[340px]">
      <div className="flex flex-col gap-2 p-3 font-mono text-[11.5px] leading-snug">
        {[
          "Read 214 company records",
          "Ranked accounts by engagement drop-off",
          "Updated health scores for 31 accounts",
          "Created 6 follow-up tasks for owners",
        ].map((l, i) => (
          <motion.p key={l} className="flex gap-2 text-[#c9cbd2]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.35 }}>
            <span className="text-[#f59e5b]">●</span> {l}
          </motion.p>
        ))}
        <div className="mt-1 rounded-md border border-[#2a2b2f] px-2 py-1.5 text-[#8a8d96]">
          &gt; <span className="inline-block h-3 w-1.5 translate-y-0.5 animate-pulse-soft bg-[#c9cbd2]" />
        </div>
        <p className="text-[10.5px] text-[#8a8d96]">
          <span className="text-[#f59e5b]">▶▶ auto</span> · Vult Deep · workspace context
        </p>
      </div>
    </Window>
  );
}

function AgentRunScene() {
  const steps = [
    ["Read the Kelvra record", "14 fields · 3 open deals"],
    ["Researched recent news", "New VP Sales, four AE roles open"],
    ["Scored account fit", "ICP 98 — moved to Tier 1"],
    ["Drafted a follow-up", "Waiting for your review"],
    ["Created a task for Ava Bennett", "Call before Thursday"],
  ];
  return (
    <div className="p-4 text-[13px]">
      <p className="flex items-center gap-2 font-semibold">
        <span className="flex size-6 items-center justify-center rounded-md bg-accent text-white">
          <Bot className="size-3.5" />
        </span>
        Account research agent
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#16753f]">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-[#16a34a]" /> Running
        </span>
      </p>
      <ol className="mt-3 flex flex-col gap-1">
        {steps.map(([t, d], i) => (
          <motion.li key={t} className="flex gap-3 rounded-lg px-2 py-2" initial={{ opacity: 0.35 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.55, duration: 0.3 }}>
            <motion.span
              className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]"
              initial={{ backgroundColor: "#ffffff", borderColor: "#d6d8de" }}
              animate={{ backgroundColor: "#266df0", borderColor: "#266df0" }}
              transition={{ delay: 0.25 + i * 0.55, duration: 0.25 }}
            >
              <Check className="size-2.5 text-white" strokeWidth={3.5} />
            </motion.span>
            <span>
              <span className="block font-medium">{t}</span>
              <span className="text-[12px] text-subtle">{d}</span>
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function ForecastScene() {
  const bars = [42, 55, 48, 66, 72, 61, 80, 94];
  return (
    <div className="p-5 text-[13px]">
      <p className="text-subtle">Forecast · Q4</p>
      <p className="display mt-0.5 text-[30px] font-semibold tracking-[-0.02em]">$1,240,500</p>
      <p className="text-[12px] font-medium text-[#16753f]">+18% vs. last quarter</p>
      <div role="img" aria-label="Forecast bars rising over eight weeks" className="mt-5 flex h-[190px] items-end gap-3 border-b border-[#eef0f2]">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="flex-1 origin-bottom rounded-t-[4px]"
            style={{ height: `${h}%`, background: i === bars.length - 1 ? "#266df0" : "#c9d8ff" }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease }}
          />
        ))}
      </div>
    </div>
  );
}

export const HERO_SCENES = ["accounts", "agent", "forecast"] as const;
export type HeroScene = (typeof HERO_SCENES)[number];

export function HeroApp({ scene = "accounts" }: { scene?: HeroScene }) {
  const nav = [
    [Search, "Search", null],
    [CheckSquare, "Tasks", null],
    [FileText, "Notes", null],
    [Bot, "Agents", "agent"],
    [Zap, "Reports", "forecast"],
  ] as const;
  return (
    <Window className="w-full" bodyClassName="flex min-h-[460px]">
      <aside className="hidden w-[190px] shrink-0 flex-col gap-0.5 border-r border-[#eef0f2] bg-[#fbfbfc] p-2 text-[13px] md:flex">
        <span className="mb-2 flex items-center gap-2 px-1.5 py-1 font-semibold">
          <span className="flex size-5 items-center justify-center rounded-md bg-ink">
            <LogoMark tone="light" size={13} />
          </span>
          Ridgeway Labs
        </span>
        {nav.map(([Icon, l, sc]) => (
          <span key={l} className={cn("relative flex h-7 items-center gap-2 rounded-md px-1.5 text-ink-2 transition-colors", sc === scene && "font-medium text-ink")}>
            {sc === scene && <motion.span layoutId="hero-nav" className="absolute inset-0 rounded-md bg-[#f1f2f4]" transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }} />}
            <Icon className="relative size-3.5" /> <span className="relative">{l}</span>
          </span>
        ))}
        <span className="mt-3 px-1.5 text-[11px] font-medium text-subtle">Records</span>
        <span className={cn("relative flex h-7 items-center gap-2 rounded-md px-1.5", scene === "accounts" ? "font-medium" : "text-ink-2")}>
          {scene === "accounts" && <motion.span layoutId="hero-nav" className="absolute inset-0 rounded-md bg-[#f1f2f4]" transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }} />}
          <Building2 className="relative size-3.5 text-accent" /> <span className="relative">Companies</span>
        </span>
        <span className="flex h-7 items-center gap-2 rounded-md px-1.5 text-ink-2">
          <Users className="size-3.5 text-[#16a34a]" /> People
        </span>
        <span className="flex h-7 items-center gap-2 rounded-md px-1.5 text-ink-2">
          <CircleDollarSign className="size-3.5 text-[#e8780e]" /> Deals
        </span>
      </aside>
      <div className="relative min-w-0 flex-1 text-left">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={scene}
            initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(4px)", y: -6 }}
            transition={{ duration: 0.45, ease: [0.33, 1, 0.68, 1] }}
          >
            {scene === "accounts" && (
              <>
                <CompaniesTable />
                <motion.div className="absolute bottom-4 right-4 hidden lg:block" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.9, duration: 0.5, ease }}>
                  <EmailSuggestion />
                </motion.div>
              </>
            )}
            {scene === "agent" && <AgentRunScene />}
            {scene === "forecast" && <ForecastScene />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Window>
  );
}

/* ---------- Use-case mocks ---------- */

export function AskList() {
  const items = [
    ["Kelvra", "Opened 4 AE roles"],
    ["Ortiq", "New VP Sales"],
    ["Halbrook", "Raised a Series B"],
    ["Solvane", "Expanding into the EU"],
    ["Brightvale", "Evaluating CRM vendors"],
    ["Maplewing", "Doubling the sales team"],
  ];
  return (
    <div className="flex w-full max-w-[400px] flex-col gap-2">
      <Card className="shine flex items-center gap-2 px-3 py-2.5 text-[13px] text-ink">
        <span className="min-w-0 flex-1 truncate">
          <Typewriter text="Which accounts should we reach out to this week?" delay={400} speed={24} />
        </span>
        <span className="ml-auto flex size-7 items-center justify-center rounded-lg bg-accent text-white">
          <ArrowUp className="size-3.5" />
        </span>
      </Card>
      <Card className="p-3 text-[13px]">
        <p className="mb-1.5 text-[11.5px] text-subtle">6 accounts ready for outreach</p>
        {items.map(([n, d], i) => (
          <motion.p key={n} className="flex items-center gap-2 py-1" initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07 }}>
            <Avatar name={n} square size={16} />
            <span className="font-medium">{n}</span>
            <span className="truncate text-[12px] text-subtle">{d}</span>
          </motion.p>
        ))}
      </Card>
    </div>
  );
}

export function Orbit() {
  const chips: [string, string, "green" | "amber" | "blue" | "violet"][] = [
    ["ICP 98", "left-[12%] top-[26%]", "green"],
    ["New exec", "right-[6%] top-[12%]", "amber"],
    ["Warm intro via board", "left-[4%] bottom-[16%]", "blue"],
    ["Series B", "right-[10%] bottom-[10%]", "violet"],
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      {[1, 0.66, 0.36].map((s, i) => (
        <motion.span
          key={s}
          aria-hidden
          className="ring-pulse absolute inset-0 m-auto rounded-full border border-[#dfe2e8]"
          style={{ width: `${s * 100}%`, height: `${s * 100}%`, animationDelay: `${i * 0.35}s` }}
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.8, ease }}
        />
      ))}
      <span className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_-8px_rgb(16_17_26/0.25)]">
        <Avatar name="Halbrook" square size={30} />
      </span>
      {chips.map(([t, pos, tone], i) => (
        <motion.span key={t} className={cn("absolute", pos)} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.12, type: "spring", stiffness: 260, damping: 18 }}>
          <Pill tone={tone} className="shadow-sm">
            {t}
          </Pill>
        </motion.span>
      ))}
    </div>
  );
}

function FlowNode({ icon: Icon, title, sub, color, className }: { icon: typeof Zap; title: string; sub: string; color: string; className?: string }) {
  return (
    <Card className={cn("w-[170px] px-2.5 py-2 text-[12.5px]", className)}>
      <p className="flex items-center gap-1.5 font-semibold">
        <span className="flex size-5 items-center justify-center rounded-md" style={{ background: color + "22", color }}>
          <Icon className="size-3" />
        </span>
        {title}
      </p>
      <p className="mt-0.5 text-[11.5px] text-subtle">{sub}</p>
    </Card>
  );
}

const FLOW_PATH = "M95 52 H330 Q350 52 350 72 V110 Q350 130 330 130 H110 Q90 130 90 150 V178 H440";

export function FlowGraph() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto h-[300px] w-[640px] max-w-full overflow-hidden">
      <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 640 300" fill="none">
        <motion.path
          d="M95 52 H215 M300 52 H330 Q350 52 350 72 V110 Q350 130 330 130 H110 Q90 130 90 150 V170 M180 178 H230 M320 178 H360 Q380 178 380 158 V140 Q380 120 400 120 H440 M320 186 H360 Q380 186 380 206 V250 Q380 266 400 266 H440"
          stroke="#c9cdd5"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease }}
        />
        {!reduce &&
          [0, 1.2, 2.4].map((begin) => (
            <circle key={begin} r="3.5" fill="#266df0">
              <animateMotion dur="3.6s" begin={`${begin}s`} repeatCount="indefinite" path={FLOW_PATH} />
            </circle>
          ))}
      </svg>
      <span className="spin-border absolute left-[10px] top-[22px] h-[56px] w-[176px] rounded-[13px] opacity-70 blur-[1px]" aria-hidden />
      <FlowNode icon={Zap} title="Record created" sub="New inbound lead" color="#266df0" className="absolute left-3 top-6" />
      <FlowNode icon={Globe} title="Web agent" sub="Research the company" color="#7048e8" className="absolute left-[215px] top-6" />
      <FlowNode icon={Bot} title="Custom agent" sub="Score for ICP fit" color="#16a34a" className="absolute left-3 top-[150px]" />
      <FlowNode icon={GitBranch} title="If" sub="Route by segment" color="#e8780e" className="absolute left-[205px] top-[150px] w-[115px]" />
      <FlowNode icon={Send} title="Enroll in sequence" sub="Enterprise sequence" color="#c2255c" className="absolute left-[440px] top-[95px]" />
      <FlowNode icon={Send} title="Enroll in sequence" sub="SMB sequence" color="#c2255c" className="absolute left-[440px] top-[240px]" />
    </div>
  );
}

type BoardCard = { name: string; value: string; owner: string; stage: number };
const STAGES: [string, string][] = [
  ["Discovery", "#e8780e"],
  ["Demo", "#266df0"],
  ["Proposal", "#7048e8"],
  ["Negotiation", "#16a34a"],
];
const BOARD_START: BoardCard[] = [
  { name: "Kelvra", value: "$20,800", owner: "Ava Bennett", stage: 0 },
  { name: "Driftline", value: "$36,400", owner: "Jun Park", stage: 0 },
  { name: "Ortiq", value: "$54,000", owner: "Theo Lindqvist", stage: 1 },
  { name: "Quillstone", value: "$18,200", owner: "Maya Ruiz", stage: 1 },
  { name: "Halbrook", value: "$31,200", owner: "Ines Okafor", stage: 2 },
  { name: "Sablewood", value: "$62,500", owner: "Dani Rossi", stage: 2 },
  { name: "Solvane", value: "$76,000", owner: "Maya Ruiz", stage: 3 },
];

/** Pipeline board where one deal advances a stage every few seconds. */
export function Board() {
  const reduce = useReducedMotion();
  const [cards, setCards] = useState(BOARD_START);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setCards((cs) => cs.map((c) => (c.name === "Kelvra" ? { ...c, stage: (c.stage + 1) % STAGES.length } : c)));
    }, 2600);
    return () => clearInterval(t);
  }, [reduce]);
  return (
    <LayoutGroup>
      <div className="flex gap-3 overflow-hidden">
        {STAGES.map(([stage, color], c) => {
          const col = cards.filter((x) => x.stage === c);
          return (
            <div key={stage} className="flex w-[200px] shrink-0 flex-col gap-2 rounded-xl bg-[#f3f4f6] p-2">
              <p className="flex items-center gap-1.5 px-1 text-[12.5px] font-semibold">
                <span className="size-2 rounded-full" style={{ background: color }} /> {stage}
                <motion.span key={col.length} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-subtle">
                  {col.length}
                </motion.span>
              </p>
              {col.map((card, i) => (
                <motion.div key={card.name} layoutId={`board-${card.name}`} layout transition={{ layout: { duration: 0.55, ease: [0.65, 0, 0.35, 1] } }}>
                  <Card className={cn("flex flex-col gap-1.5 p-2.5 text-[12px] transition-shadow", card.name === "Kelvra" && "ring-2 ring-accent/30")}>
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Avatar name={card.name} square size={14} /> {card.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <CalendarDays className="size-3 text-subtle" /> Nov {12 + i * 7}, 2026
                    </span>
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <CircleDollarSign className="size-3 text-subtle" /> {card.value}
                    </span>
                    <span className="flex items-center gap-1.5 text-ink-2">
                      <Avatar name={card.owner} size={14} /> {card.owner}
                    </span>
                  </Card>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export function StackedBars() {
  const data = [
    [10, 14, 6],
    [12, 10, 8],
    [8, 12, 14],
    [6, 9, 22],
    [5, 7, 26],
  ];
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct"];
  return (
    <Card className="w-full max-w-[360px] p-3.5">
      <p className="text-[12.5px] font-semibold">Deal movement</p>
      <div className="mt-1 flex gap-3 text-[11px] text-subtle">
        {[
          ["Stalled", "#e5484d"],
          ["At risk", "#f5a524"],
          ["Advancing", "#266df0"],
        ].map(([l, c]) => (
          <span key={l} className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm" style={{ background: c }} /> {l}
          </span>
        ))}
      </div>
      <div role="img" aria-label="Stacked bars: deals advancing grow each month while stalled deals shrink" className="mt-3 flex h-[120px] items-end gap-4 border-b border-[#eef0f2] px-1">
        {data.map((d, i) => (
          <motion.div key={i} className="flex flex-1 origin-bottom flex-col-reverse gap-[2px]" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.8, ease }}>
            {d.map((v, j) => (
              <span key={j} className={cn(j === 2 && "rounded-t-[4px]")} style={{ height: v * 3.2, background: ["#e5484d", "#f5a524", "#266df0"][j] }} />
            ))}
          </motion.div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-4 px-1 text-center text-[11px] text-subtle">
        {months.map((m) => (
          <span key={m} className="flex-1">
            {m}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function RiskList() {
  return (
    <Card className="w-full max-w-[360px] p-3.5 text-[12.5px]">
      <p className="flex items-center gap-1 text-subtle">
        Thinking <ChevronDown className="size-3 -rotate-90" />
      </p>
      <p className="mt-2 font-semibold">3 deals at risk this week</p>
      <ul className="mt-1.5 flex flex-col gap-1.5 text-ink-2">
        <li>
          <b className="font-semibold text-ink">Halbrook</b> — Legal review, $31,200. No reply since Oct 2.
        </li>
        <li>
          <b className="font-semibold text-ink">Quillstone</b> — Champion changed roles, $18,200.
        </li>
        <li>
          <b className="font-semibold text-ink">Driftline</b> — Budget moved to Q1, $36,400.
        </li>
      </ul>
    </Card>
  );
}

export function AskReport() {
  return (
    <div className="flex w-full flex-col gap-3">
      <span className="self-end rounded-xl bg-[#eceef1] px-3 py-1.5 text-[13px]">What will we close this week, by rep?</span>
      <Card className="p-4 text-[13px]">
        <p className="flex items-center gap-1 text-subtle">
          2 tools used <ChevronDown className="size-3" />
        </p>
        <div className="mt-2 flex flex-col gap-1.5 text-[12px]">
          <span className="w-fit rounded-md border border-[#eef0f2] px-2 py-1">
            <Search className="mr-1 inline size-3" /> Records searched: <span className="text-subtle">25 deals</span>
          </span>
          <span className="w-fit rounded-md border border-[#eef0f2] px-2 py-1">
            <FileText className="mr-1 inline size-3" /> Report built: <span className="text-subtle">weighted by stage</span>
          </span>
        </div>
        <p className="mt-3">
          Expected this week: <b className="font-semibold">$184,500</b> across 6 deals.
        </p>
        <table className="mt-2 w-full text-[12.5px]">
          <tbody>
            {[
              ["Maya Ruiz", "$76,000", 82],
              ["Theo Lindqvist", "$54,000", 64],
              ["Ines Okafor", "$31,200", 41],
              ["Jun Park", "$23,300", 30],
            ].map(([n, v, w]) => (
              <tr key={n as string}>
                <td className="py-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar name={n as string} size={16} /> {n}
                  </span>
                </td>
                <td className="w-1/2 py-1">
                  <motion.span className="block h-2 origin-left rounded-full bg-accent" style={{ width: `${w}%` }} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, ease }} />
                </td>
                <td className="tabular py-1 text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function LineChart({ title = "Book size · ARR", series = [[20, 24, 23, 30, 34, 41, 48, 55], [12, 13, 15, 15, 18, 20, 21, 24]] }: { title?: string; series?: number[][] }) {
  const w = 300;
  const h = 100;
  const max = Math.max(...series.flat());
  const path = (s: number[]) => s.map((v, i) => `${i ? "L" : "M"}${(i / (s.length - 1)) * w} ${h - (v / max) * h * 0.9}`).join(" ");
  return (
    <Card className="w-full max-w-[360px] p-3.5">
      <p className="text-[12.5px] font-semibold">{title}</p>
      <div className="mt-1 flex gap-3 text-[11px] text-subtle">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-accent" /> North America
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#16a34a]" /> EMEA
        </span>
      </div>
      <svg role="img" aria-label="Two lines trending upward" viewBox={`0 0 ${w} ${h}`} className="mt-3 h-[110px] w-full overflow-visible">
        {series.map((s, i) => (
          <motion.path key={i} d={path(s)} fill="none" stroke={i ? "#16a34a" : "#266df0"} strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease, delay: i * 0.2 }} />
        ))}
      </svg>
    </Card>
  );
}

export function Signals() {
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-2.5 text-[12.5px]">
      {[
        ["Ava Bennett", "Changed roles", "Head of RevOps", "blue"],
        ["Halbrook", "New funding round", "$40M Series B", "violet"],
        ["Jun Park", "Usage down", "−38% in 30 days", "red"],
      ].map(([who, what, val, tone], i) => (
        <motion.div key={who} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
          <p className="mb-1 flex items-center gap-1.5 font-medium">
            <Avatar name={who} size={16} square={i === 1} /> {who}
          </p>
          <Card className="px-3 py-2">
            <p className="text-[11.5px] text-subtle">{what}</p>
            <Pill tone={tone as "blue"} className="mt-1">
              {val}
            </Pill>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function TaskStack() {
  return (
    <div className="relative mx-auto h-[150px] w-[280px]">
      <Card className="absolute inset-x-6 top-[22px] h-[96px] opacity-50" />
      <Card className="absolute inset-x-3 top-[11px] h-[96px] opacity-80" />
      <Card className="absolute inset-x-0 top-0 p-3 text-[12.5px]">
        <p className="flex items-center gap-1.5 font-semibold">
          <Check className="size-3.5 text-[#16a34a]" /> Hand-off to Ines Okafor
        </p>
        <p className="mt-1 text-subtle">Kelvra · demo booked for Thursday</p>
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-subtle">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" /> 4
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" /> 2
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Clock3 className="size-3" /> 1d
          </span>
        </div>
      </Card>
    </div>
  );
}

export function RoutedLeads() {
  return (
    <Card className="w-full max-w-[360px] p-3 text-[12.5px]">
      <p className="mb-1 text-[11.5px] text-subtle">Inbound · last hour</p>
      {[
        ["Brightvale", "Ops Director", "88", "Theo Lindqvist"],
        ["Tessaro", "Founder", "64", "Nurture"],
        ["Maplewing", "VP Sales", "91", "Maya Ruiz"],
      ].map(([c, r, s, to], i) => (
        <motion.div key={c} className="flex items-center gap-2 border-b border-[#f1f2f4] py-2 last:border-b-0" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
          <Avatar name={c} square size={18} />
          <span className="flex flex-col">
            <span className="font-medium">{c}</span>
            <span className="text-[11.5px] text-subtle">{r}</span>
          </span>
          <Pill tone={Number(s) > 80 ? "green" : "amber"} className="ml-auto tabular">
            {s}
          </Pill>
          <span className="w-[96px] truncate text-right text-ink-2">→ {to}</span>
        </motion.div>
      ))}
    </Card>
  );
}

export function PersonRecord() {
  return (
    <Window className="w-full" bodyClassName="grid md:grid-cols-[260px_1fr]">
      <div className="border-b border-[#eef0f2] p-4 md:border-b-0 md:border-r">
        <div className="flex items-start justify-between">
          <Avatar name="Sofia Novak" size={44} />
          <Star className="size-4 text-subtle" />
        </div>
        <p className="mt-3 text-[17px] font-semibold">Sofia Novak</p>
        <p className="text-[13px] text-subtle">Head of IT · Kelvra</p>
        <div className="mt-3 flex gap-1.5">
          {[Mail, MessageSquare, CalendarDays, MoreHorizontal].map((I, i) => (
            <span key={i} className="flex size-8 items-center justify-center rounded-lg border border-[#e6e8ec] text-ink-2">
              <I className="size-3.5" />
            </span>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-[90px_1fr] gap-y-2 text-[12.5px]">
          {[
            ["Email", "sofia@kelvra.example"],
            ["Location", "Amsterdam"],
            ["Strength", "Very strong"],
            ["Owner", "Ava Bennett"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-subtle">{k}</dt>
              <dd className="truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="p-4 text-[13px]">
        <p className="mb-2 flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-3.5" /> Highlights
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[#eef0f2] p-3 sm:col-span-2">
            <p className="text-[12px] text-subtle">Summary</p>
            <p className="mt-1 leading-snug">Sofia leads Kelvra&apos;s move off spreadsheets and wants a pilot live before the January kickoff.</p>
          </div>
          <div className="rounded-xl border border-[#eef0f2] p-3">
            <p className="text-[12px] text-subtle">Next meeting</p>
            <p className="mt-1 font-medium">Pricing review</p>
            <p className="text-[12px] text-subtle">Thu, 10:30</p>
          </div>
          <div className="rounded-xl border border-[#eef0f2] p-3">
            <p className="text-[12px] text-subtle">Company</p>
            <p className="mt-1 font-medium">Kelvra</p>
            <p className="text-[12px] text-subtle">Amsterdam, NL</p>
          </div>
          <div className="rounded-xl border border-[#eef0f2] p-3 sm:col-span-2">
            <p className="text-[12px] text-subtle">Sequence</p>
            <p className="mt-1 font-medium">
              Step 2 <span className="font-normal text-subtle">Automated email</span>
            </p>
            <div className="mt-2 flex gap-1">
              {[1, 1, 0, 0, 0].map((d, i) => (
                <motion.span key={i} className={cn("h-1.5 flex-1 rounded-full", d ? "bg-[#16a34a]" : "bg-[#eef0f2]")} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} />
              ))}
            </div>
          </div>
        </div>
        <p className="mb-2 mt-4 flex items-center gap-1.5 font-semibold">
          <Play className="size-3.5" /> Activity
        </p>
        <ul className="flex flex-col gap-2 rounded-xl border border-[#eef0f2] p-3 text-[12.5px]">
          {[
            [Mic, "Sofia Novak attended a call", "6 hours ago"],
            [Mail, "Ava Bennett sent a proposal", "2 days ago"],
            [User, "Record enriched — 6 fields", "3 days ago"],
          ].map(([I, t, w], i) => {
            const Icon = I as typeof Mail;
            return (
              <li key={i} className="flex items-center gap-2">
                <Icon className="size-3.5 text-subtle" /> {t as string}
                <span className="ml-auto text-subtle">{w as string}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Window>
  );
}

export function QuotaList() {
  const reps: [string, number][] = [
    ["Maya Ruiz", 112],
    ["Theo Lindqvist", 94],
    ["Ines Okafor", 81],
    ["Jun Park", 67],
  ];
  return (
    <Card className="w-full max-w-[360px] p-3.5 text-[12.5px]">
      <p className="font-semibold">Quota attainment · Q4</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {reps.map(([n, pct], i) => (
          <li key={n} className="flex items-center gap-2">
            <Avatar name={n} size={18} />
            <span className="w-[104px] truncate">{n}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef0f2]">
              <motion.span
                className={cn("block h-full rounded-full", pct >= 100 ? "bg-[#16a34a]" : "bg-accent")}
                style={{ width: `${Math.min(pct, 100)}%` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.9, ease }}
              />
            </span>
            <span className="tabular w-10 text-right text-ink-2">{pct}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
