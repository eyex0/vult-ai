import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, CalendarDays, ChevronDown, Home as HomeIcon, Paperclip, Sparkles, Trophy, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Markdown } from "@/lib/markdown";
import { answer, MODELS } from "@/components/app/AskVult";
import { usePage } from "@/components/app/PageMeta";
import { DropdownContent, DropdownItem, DropdownRoot, DropdownTrigger } from "@/components/ui/Dropdown";
import { pipelineTotals, recordHref, recordLabel } from "@/data/selectors";
import { store, useDB } from "@/data/store";
import { formatMoney, greeting, relativeDay } from "@/lib/format";
import { listItem, stagger } from "@/lib/motion";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["What’s closing this month?", "Which deals are at risk?", "Summarise my week"];

export default function AppHome() {
  usePage({ title: "Home", icon: HomeIcon });
  const db = useDB();
  const session = useSession();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<(typeof MODELS)[number]>("Vult Deep");
  const [reply, setReply] = useState<{ q: string; a: string } | null>(null);
  const [thinking, setThinking] = useState(false);

  const totals = useMemo(() => pipelineTotals(db), [db]);
  const meetings = useMemo(() => [...db.meetings].sort((a, b) => a.start.localeCompare(b.start)), [db.meetings]);
  // Snapshot which tasks to show on mount so completing one doesn't make it jump out of the list.
  const [taskIds] = useState(() =>
    db.tasks
      .filter((t) => t.assigneeId === "m1" && !t.done)
      .sort((a, b) => (a.due ?? "z").localeCompare(b.due ?? "z"))
      .slice(0, 6)
      .map((t) => t.id),
  );
  const tasks = useMemo(() => taskIds.map((tid) => db.tasks.find((t) => t.id === tid)).filter((t): t is NonNullable<typeof t> => !!t), [db.tasks, taskIds]);
  const firstName = session?.name.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const send = (e?: FormEvent, value = prompt) => {
    e?.preventDefault();
    if (!value.trim() || thinking) return;
    setThinking(true);
    setReply(null);
    setTimeout(() => {
      setReply({ q: value.trim(), a: answer(value) });
      setThinking(false);
      setPrompt("");
    }, 700);
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="mx-auto flex max-w-[820px] flex-col gap-7 px-4 py-[clamp(24px,5vw,56px)] sm:px-8">
        <motion.div variants={listItem}>
          <p className="text-[13px] text-app-mute">{today}</p>
          <h2 className="mt-1 text-[26px] font-semibold tracking-[-0.035em] text-white">
            {greeting()}, {firstName}
          </h2>
        </motion.div>

        <motion.form variants={listItem} onSubmit={send} className="rounded-[14px] border border-[#2a2b2e] bg-app-raise p-3 shadow-[0_12px_40px_-20px_rgb(0_0_0/0.8)] transition-colors focus-within:border-[#3a3d55]">
          <label htmlFor="home-ask" className="sr-only">
            Ask Vult
          </label>
          <textarea
            id="home-ask"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(undefined);
            }}
            placeholder="Ask about your pipeline, or tell an agent what to do…"
            className="w-full resize-none bg-transparent px-1.5 py-1 text-[15px] leading-relaxed text-white outline-none placeholder:text-app-mute"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-label="Attach context" className="inline-flex size-[30px] items-center justify-center rounded-[7px] border border-[#2e3033] text-app-dim transition-colors hover:bg-app-hover hover:text-white">
              <Paperclip className="size-3.5" />
            </button>
            <DropdownRoot>
              <DropdownTrigger className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] border border-[#2e3033] px-2.5 text-[12.5px] text-app-dim transition-colors hover:bg-app-hover hover:text-white" aria-label={`Model: ${model}`}>
                <Sparkles className="size-3" /> {model} <ChevronDown className="size-3" />
              </DropdownTrigger>
              <DropdownContent>
                {MODELS.map((m) => (
                  <DropdownItem key={m} onSelect={() => setModel(m)}>
                    {m}
                    {m === model && <span className="ml-auto text-xs text-fg-3">Selected</span>}
                  </DropdownItem>
                ))}
              </DropdownContent>
            </DropdownRoot>
            <span className="ml-auto hidden text-xs text-app-mute sm:inline">⌘↵ to send</span>
            <button
              type="submit"
              aria-label="Send"
              disabled={!prompt.trim() || thinking}
              className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-white transition-[opacity,transform] hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </motion.form>

        <AnimatePresence mode="wait">
          {(thinking || reply) && (
            <motion.div
              key={thinking ? "thinking" : reply?.q}
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="-mt-3 flex gap-3 rounded-xl border border-app-line bg-app-panel px-4 py-3.5"
            >
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent">
                <Sparkles className="size-3.5 text-white" />
              </span>
              {thinking ? (
                <span className="flex items-center gap-1 text-app-mute">
                  Thinking
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}>
                      .
                    </motion.span>
                  ))}
                </span>
              ) : (
                <div className="min-w-0 text-[13.5px] text-app-text [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1 [&_strong]:text-white">
                  <p className="mb-1 text-xs text-app-mute">
                    {model} · “{reply!.q}”
                  </p>
                  <Markdown>{reply!.a}</Markdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={listItem} className="-mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => send(undefined, s)} className="h-[30px] rounded-full border border-app-line px-3 text-[12.5px] text-[#c9cbd2] transition-colors hover:bg-app-hover hover:text-white">
              {s}
            </button>
          ))}
        </motion.div>

        <motion.div variants={listItem} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Open pipeline", value: formatMoney(totals.openValue), sub: `${totals.openCount} deals`, Icon: Wallet },
            { label: "Closed won", value: formatMoney(totals.wonValue), sub: `${totals.wonCount} deals`, Icon: Trophy },
            { label: "Win rate", value: `${Math.round(totals.winRate * 100)}%`, sub: "Won vs. lost", Icon: TrendingUp },
          ].map(({ label, value, sub, Icon }) => (
            <Link key={label} href="/app/reports/db1" className="group rounded-xl border border-app-line bg-app-panel px-4 py-3.5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#34363c]">
              <span className="flex items-center gap-1.5 text-[12.5px] text-app-dim">
                <Icon aria-hidden className="size-3.5" /> {label}
              </span>
              <span className="tabular mt-1 block text-[22px] font-semibold tracking-[-0.03em] text-white">{value}</span>
              <span className="text-xs text-app-mute">{sub}</span>
            </Link>
          ))}
        </motion.div>

        <motion.div variants={listItem} className="grid gap-4 md:grid-cols-2">
          <section aria-labelledby="mtg-h" className="overflow-hidden rounded-card border border-app-line bg-app-panel">
            <div className="flex items-center justify-between border-b border-[#1e1f22] px-4 py-3.5">
              <h3 id="mtg-h" className="text-[13.5px] font-semibold text-white">
                Today’s meetings
              </h3>
              <span className="text-xs text-app-mute">{meetings.length}</span>
            </div>
            <ul>
              {meetings.map((m) => {
                const start = new Date(m.start);
                const end = new Date(m.end);
                const fmt = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                const past = end.getTime() < Date.now();
                return (
                  <li key={m.id} className={cn("flex gap-3 border-b border-[#1a1b1d] px-4 py-3 last:border-b-0", past && "opacity-60")}>
                    <span className="w-[3px] shrink-0 rounded-sm bg-accent" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      {m.record ? (
                        <Link href={recordHref(m.record)} className="truncate font-[550] text-white hover:underline">
                          {m.title}
                        </Link>
                      ) : (
                        <span className="truncate font-[550] text-white">{m.title}</span>
                      )}
                      <span className="flex items-center gap-1.5 text-[12.5px] text-app-mute">
                        <CalendarDays aria-hidden className="size-3" /> {fmt(start)} – {fmt(end)} · {m.attendees.join(", ")}
                      </span>
                    </span>
                    <span className="hidden self-center whitespace-nowrap text-[11.5px] text-[#9daeff] sm:inline">{past ? "Recap ready" : "Brief ready"}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="task-h" className="overflow-hidden rounded-card border border-app-line bg-app-panel">
            <div className="flex items-center justify-between border-b border-[#1e1f22] px-4 py-3.5">
              <h3 id="task-h" className="text-[13.5px] font-semibold text-white">
                My tasks
              </h3>
              <Link href="/app/tasks" className="text-xs text-app-mute hover:text-white">
                View all
              </Link>
            </div>
            <ul>
              <AnimatePresence initial={false}>
                {tasks.map((t) => {
                  const overdue = !t.done && t.due && new Date(t.due).getTime() < new Date().setHours(0, 0, 0, 0);
                  return (
                    <motion.li key={t.id} layout className="flex items-center gap-3 border-b border-[#1a1b1d] px-4 py-2.5 last:border-b-0">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={t.done}
                        aria-label={`${t.done ? "Mark incomplete" : "Complete"}: ${t.title}`}
                        onClick={() => store.update("tasks", t.id, { done: !t.done })}
                        className={cn(
                          "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors",
                          t.done ? "border-accent bg-accent" : "border-[#3a3c40] hover:border-app-accent",
                        )}
                      >
                        <AnimatePresence>
                          {t.done && (
                            <motion.svg initial={{ scale: 0, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M5 12l5 5L20 7" />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </button>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={cn("truncate transition-colors", t.done ? "text-app-mute line-through" : "text-app-text")}>{t.title}</span>
                        {t.record && <span className="truncate text-xs text-app-mute">{recordLabel(db, t.record)}</span>}
                      </span>
                      <span className={cn("whitespace-nowrap text-xs", overdue ? "text-[#f59090]" : "text-app-mute")}>{relativeDay(t.due)}</span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </section>
        </motion.div>
      </motion.div>
    </div>
  );
}
