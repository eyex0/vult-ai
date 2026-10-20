import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Markdown } from "@/lib/markdown";
import { OPEN_STAGES, pipelineTotals } from "@/data/selectors";
import { getDB } from "@/data/store";
import { formatMoney } from "@/lib/format";
import { spring } from "@/lib/motion";

export const MODELS = ["Vult Fast", "Vult Deep", "Vult Research"] as const;

/** Local, deterministic "assistant": answers from the demo data. There is no model behind it. */
export function answer(question: string): string {
  const db = getDB();
  const q = question.toLowerCase();
  const t = pipelineTotals(db);
  const month = new Date().getMonth();
  if (/(clos|this month|forecast)/.test(q)) {
    const closing = db.deals.filter((d) => OPEN_STAGES.includes(d.stage) && new Date(d.closeDate).getMonth() === month);
    const sum = closing.reduce((a, d) => a + d.value, 0);
    return closing.length
      ? `**${closing.length} open deals** are set to close this month, worth **${formatMoney(sum)}**:\n\n${closing
          .slice(0, 5)
          .map((d) => `- ${d.name} — ${formatMoney(d.value)} (${d.stage})`)
          .join("\n")}`
      : "No open deals are set to close this month. Want me to look at next month instead?";
  }
  if (/(risk|stall|stuck)/.test(q)) {
    const risky = db.deals.filter((d) => d.stage === "Negotiation" || d.stage === "Proposal").slice(0, 3);
    return `These deals need attention:\n\n${risky.map((d) => `- **${d.name}** — next step: ${d.nextStep.toLowerCase()}`).join("\n")}\n\nI can draft a follow-up for each one.`;
  }
  if (/(task|todo|to do)/.test(q)) {
    const open = db.tasks.filter((x) => !x.done);
    return `You have **${open.length} open tasks**. The most urgent:\n\n${open
      .slice(0, 4)
      .map((x) => `- ${x.title}`)
      .join("\n")}`;
  }
  if (/(week|summar|recap)/.test(q)) {
    return `Here's your week so far:\n\n- **${formatMoney(t.openValue)}** in open pipeline across ${t.openCount} deals\n- **${formatMoney(t.wonValue)}** closed-won (${t.wonCount} deals)\n- Win rate **${Math.round(t.winRate * 100)}%**\n- ${db.meetings.length} meetings on the calendar today`;
  }
  return `I searched ${db.companies.length} companies, ${db.people.length} people and ${db.deals.length} deals. Try asking about deals closing this month, deals at risk, your tasks, or a summary of your week.`;
}

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export function AskVultPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, thinking]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = (value: string) => {
    if (!value.trim() || thinking) return;
    setMsgs((m) => [...m, { role: "user", text: value.trim() }]);
    setText("");
    setThinking(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "assistant", text: answer(value) }]);
      setThinking(false);
    }, 650);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="Ask Vult"
          className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[420px] flex-col border-l border-[#2a2b2e] bg-app-panel shadow-[-24px_0_60px_-20px_rgb(0_0_0/0.7)]"
          initial={{ x: 48, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: spring }}
          exit={{ x: 48, opacity: 0, transition: { duration: 0.16 } }}
        >
          <div className="flex h-[49px] items-center gap-2.5 border-b border-app-line px-4">
            <span className="flex size-6 items-center justify-center rounded-md bg-accent">
              <Sparkles className="size-3.5 text-white" />
            </span>
            <h2 className="text-sm font-semibold text-white">Ask Vult</h2>
            <button type="button" autoFocus onClick={onClose} aria-label="Close Ask Vult" className="ml-auto inline-flex size-8 items-center justify-center rounded-[7px] text-app-dim hover:bg-app-hover hover:text-white">
              <X className="size-4" />
            </button>
          </div>
          <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
            {msgs.length === 0 && (
              <div className="flex flex-col gap-2 pt-6 text-center">
                <p className="text-sm text-app-dim">Ask anything about your pipeline, records or tasks.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {["What’s closing this month?", "Which deals are at risk?", "Summarise my week"].map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-lg border border-app-line px-3 py-2 text-left text-[13px] text-app-text transition-colors hover:bg-app-hover">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  m.role === "user"
                    ? "ml-8 self-end rounded-xl rounded-br-sm bg-accent px-3 py-2 text-[13.5px] text-white"
                    : "mr-6 rounded-xl rounded-bl-sm border border-app-line bg-app-raise px-3 py-2 text-[13.5px] text-app-text [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1 [&_strong]:text-white"
                }
              >
                {m.role === "assistant" ? <Markdown>{m.text}</Markdown> : m.text}
              </motion.div>
            ))}
            {thinking && (
              <div className="flex gap-1 px-1 py-2" aria-label="Thinking">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-app-dim"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
            <div ref={end} />
          </div>
          <form onSubmit={onSubmit} className="border-t border-app-line p-3">
            <div className="flex items-end gap-2 rounded-xl border border-[#2e3033] bg-app-input p-2 focus-within:border-app-accent">
              <label htmlFor="ask-panel" className="sr-only">
                Message
              </label>
              <textarea
                id="ask-panel"
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(text);
                  }
                }}
                placeholder="Ask Vult…"
                className="flex-1 resize-none bg-transparent px-1 text-sm text-white outline-none placeholder:text-app-mute"
              />
              <button type="submit" aria-label="Send" disabled={!text.trim()} className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-white transition-opacity disabled:opacity-40">
                <ArrowUp className="size-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-app-mute">Answers are generated locally from your demo workspace data.</p>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
