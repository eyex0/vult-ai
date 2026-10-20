import { motion } from "framer-motion";
import { SectionIntro } from "@/components/marketing/Section";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";

type Visual = "kanban" | "agent" | "chart" | "table" | "palette";
const ENTRIES: { date: string; version: string; title: string; tags: string[]; body: string; bullets: string[]; visual: Visual }[] = [
  { date: "Oct 14, 2026", version: "4.12", title: "Kanban swimlanes and saved board views", tags: ["Records", "Views"], body: "Group any board by owner or segment, and save the layout as a view your whole team can use.", bullets: ["Swimlanes by any select or member field", "Column totals respect filters", "Keyboard drag and drop"], visual: "kanban" },
  { date: "Oct 2, 2026", version: "4.11", title: "Vult Agents, now generally available", tags: ["Agents", "AI"], body: "Agents can research accounts, qualify inbound leads and keep deals moving — with approvals and a full run log.", bullets: ["Approval gates on send and write", "Per-agent scopes", "Replayable runs"], visual: "agent" },
  { date: "Sep 18, 2026", version: "4.10", title: "Forecast dashboards", tags: ["Reporting"], body: "A new stage-weighted forecast with week-over-week changes and rep roll-ups.", bullets: ["Commit, best case and pipeline", "Drill into any number", "Share read-only links"], visual: "chart" },
  { date: "Sep 3, 2026", version: "4.9", title: "Inline editing everywhere", tags: ["Records"], body: "Edit any cell in place, including relations and dates, with full keyboard support.", bullets: ["Enter to save, Esc to cancel", "Bulk edit selected rows", "Undo for deletes"], visual: "table" },
  { date: "Aug 20, 2026", version: "4.8", title: "Command palette", tags: ["Navigation"], body: "Press ⌘K to search every record, task and note — or jump straight to an action.", bullets: ["Fuzzy search across objects", "Quick actions", "Recent items"], visual: "palette" },
];

function Visual({ kind }: { kind: Visual }) {
  const frame = "dot-grid relative flex h-[220px] items-center justify-center overflow-hidden rounded-card border border-line bg-soft-2 p-6";
  if (kind === "kanban")
    return (
      <div className={frame} aria-hidden>
        <div className="flex gap-3">
          {[3, 2, 4].map((n, c) => (
            <div key={c} className="flex w-[120px] flex-col gap-2 rounded-xl border border-line bg-white p-2 shadow-soft">
              <span className="h-2 w-12 rounded bg-line" />
              {Array.from({ length: n }).map((_, i) => (
                <span key={i} className="h-7 rounded-md border border-line bg-soft" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  if (kind === "chart")
    return (
      <div className={frame} aria-hidden>
        <div className="flex h-[140px] w-[300px] items-end gap-2 rounded-xl border border-line bg-white p-3 shadow-soft">
          {[30, 45, 38, 60, 52, 74, 88].map((h, i) => (
            <span key={i} className="flex-1 rounded-t-[4px]" style={{ height: `${h}%`, background: i === 6 ? "#3b5bfd" : "#c9d3ff" }} />
          ))}
        </div>
      </div>
    );
  if (kind === "agent")
    return (
      <div className={cn(frame, "bg-night [background-image:radial-gradient(#26272b_1px,transparent_1px)]")} aria-hidden>
        <div className="flex w-[300px] flex-col gap-2 rounded-xl border border-[#26272b] bg-[#16171a] p-3">
          {["Read the record", "Researched news", "Drafted follow-up"].map((t, i) => (
            <span key={t} className="flex items-center gap-2 text-xs text-white">
              <span className={cn("size-3.5 rounded-full", i < 2 ? "bg-accent" : "border border-[#3a3c40]")} /> {t}
            </span>
          ))}
        </div>
      </div>
    );
  if (kind === "palette")
    return (
      <div className={frame} aria-hidden>
        <div className="w-[300px] rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-3 py-2 text-xs text-subtle">Search records…</div>
          {["Kelvra", "Platform rollout", "Send revised order form"].map((t, i) => (
            <div key={t} className={cn("px-3 py-2 text-xs", i === 0 && "bg-soft")}>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className={frame} aria-hidden>
      <div className="w-[320px] overflow-hidden rounded-xl border border-line bg-white shadow-soft">
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="flex gap-2 border-b border-line px-3 py-2 last:border-b-0">
            <span className="h-2 w-20 rounded bg-line" />
            <span className={cn("h-2 w-16 rounded", r === 1 ? "bg-accent" : "bg-line")} />
            <span className="h-2 w-10 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChangelogPage() {
  useDocumentTitle("Changelog");
  return (
    <section className="bg-white">
      <div className="rail border-b border-line px-[clamp(20px,5vw,60px)] pb-12 pt-[clamp(64px,9vw,112px)]">
        <SectionIntro eyebrow="Changelog" lead="What’s new in Vult." rest="Product updates, shipped every week." />
      </div>
      <ol className="rail px-[clamp(20px,5vw,60px)] py-12">
        {ENTRIES.map((e, i) => (
          <motion.li
            key={e.version}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid gap-6 pb-16 md:grid-cols-[200px_1fr]"
          >
            <div className="md:sticky md:top-24 md:self-start">
              <time className="text-sm font-medium text-ink">{e.date}</time>
              <p className="text-[13px] text-subtle">Version {e.version}</p>
            </div>
            <div className="relative border-l border-line pl-8">
              <span aria-hidden className={cn("absolute -left-[5px] top-1.5 size-[9px] rounded-full", i === 0 ? "bg-accent shadow-[0_0_0_4px_var(--color-accent-soft)]" : "bg-line-strong")} />
              <div className="mb-3 flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <span key={t} className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{e.title}</h2>
              <p className="mt-2 max-w-[620px] text-ink-2">{e.body}</p>
              <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-ink-2">
                {e.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="mt-6">
                <Visual kind={e.visual} />
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
