import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, CheckSquare, Clock, Mail, Phone, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation, useParams } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DropdownContent, DropdownItem, DropdownRoot, DropdownTrigger } from "@/components/ui/Dropdown";
import { STATUS_TONE } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { Sequence, SequenceStep, SequenceStepType } from "@/data/types";
import { timeAgo } from "@/lib/format";
import { spring } from "@/lib/motion";

const STEP: Record<SequenceStepType, { label: string; icon: typeof Mail; color: string }> = {
  email: { label: "Email", icon: Mail, color: "#3b5bfd" },
  wait: { label: "Wait", icon: Clock, color: "#495057" },
  task: { label: "Task", icon: CheckSquare, color: "#0b7285" },
  call: { label: "Call", icon: Phone, color: "#2f9e44" },
};

function SequenceList() {
  const db = useDB();
  const [, navigate] = useLocation();
  const create = () => {
    const s: Sequence = { id: uid("sq"), name: "Untitled sequence", status: "Draft", enrolled: 0, replyRate: 0, updatedAt: new Date().toISOString(), steps: [{ id: uid("q"), type: "email", title: "First touch", delayDays: 0, body: "Hi {{first_name}}," }] };
    store.create("sequences", s);
    navigate(`/app/sequences/${s.id}`);
  };
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="flex items-center justify-end border-b border-app-line px-4 py-2">
        <Button size="sm" onClick={create}>
          <Plus className="size-3.5" /> New sequence
        </Button>
      </div>
      <div className="mx-auto max-w-[1000px] p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-app-line">
          <table className="w-full min-w-[620px] text-[13px]">
            <thead>
              <tr className="text-left text-app-mute">
                {["Sequence", "Status", "Steps", "Enrolled", "Reply rate", "Updated"].map((h) => (
                  <th key={h} scope="col" className="border-b border-app-line px-4 py-2.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {db.sequences.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.04 } }} className="transition-colors hover:bg-[#151618]">
                  <td className="border-b border-app-line-soft px-4 py-3">
                    <Link href={`/app/sequences/${s.id}`} className="inline-flex items-center gap-2 font-[550] text-white hover:underline">
                      <Send aria-hidden className="size-3.5 text-app-dim" /> {s.name}
                    </Link>
                  </td>
                  <td className="border-b border-app-line-soft px-4 py-3">
                    <Badge dark dot tone={STATUS_TONE[s.status]}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="tabular border-b border-app-line-soft px-4 py-3 text-app-dim">{s.steps.length}</td>
                  <td className="tabular border-b border-app-line-soft px-4 py-3 text-app-dim">{s.enrolled}</td>
                  <td className="border-b border-app-line-soft px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-app-line">
                        <motion.span className="block h-full rounded-full bg-app-accent" initial={{ width: 0 }} animate={{ width: `${s.replyRate * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} />
                      </span>
                      <span className="tabular text-app-dim">{Math.round(s.replyRate * 100)}%</span>
                    </span>
                  </td>
                  <td className="border-b border-app-line-soft px-4 py-3 text-app-mute">{timeAgo(s.updatedAt)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SequenceEditor({ seq }: { seq: Sequence }) {
  const save = (p: Partial<Sequence>) => store.update("sequences", seq.id, { ...p, updatedAt: new Date().toISOString() });
  const setSteps = (steps: SequenceStep[]) => save({ steps });
  const patch = (id: string, p: Partial<SequenceStep>) => setSteps(seq.steps.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const add = (type: SequenceStepType) =>
    setSteps([...seq.steps, { id: uid("q"), type, title: type === "wait" ? "Wait" : `New ${STEP[type].label.toLowerCase()}`, delayDays: type === "wait" ? 2 : 0, body: "" }]);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= seq.steps.length) return;
    const steps = [...seq.steps];
    [steps[i], steps[j]] = [steps[j]!, steps[i]!];
    setSteps(steps);
  };
  let day = 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-app-line px-4 py-2">
        <label htmlFor="sq-name" className="sr-only">
          Sequence name
        </label>
        <input id="sq-name" value={seq.name} onChange={(e) => save({ name: e.target.value })} className="h-8 min-w-0 max-w-[320px] flex-1 rounded-md bg-transparent px-2 text-sm font-semibold text-white outline-none hover:bg-app-hover focus:bg-app-input focus:ring-1 focus:ring-app-accent" />
        <Badge dark dot tone={STATUS_TONE[seq.status]}>
          {seq.status}
        </Badge>
        <span className="ml-auto hidden text-xs text-app-mute sm:inline">
          {seq.enrolled} enrolled · {Math.round(seq.replyRate * 100)}% reply rate
        </span>
        <Button
          size="sm"
          variant={seq.status === "Active" ? "secondary" : "accent"}
          onClick={() => {
            const next = seq.status === "Active" ? "Paused" : "Active";
            save({ status: next });
            toast(next === "Active" ? "Sequence activated" : "Sequence paused");
          }}
        >
          {seq.status === "Active" ? "Pause" : "Activate"}
        </Button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <ol className="mx-auto flex max-w-[720px] flex-col gap-3">
          <AnimatePresence initial={false}>
            {seq.steps.map((s, i) => {
              const m = STEP[s.type];
              day += s.delayDays;
              return (
                <motion.li key={s.id} layout transition={spring} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-app-line bg-app-panel">
                  <div className="flex items-center gap-2.5 border-b border-app-line-soft px-4 py-2.5">
                    <span className="flex size-6 items-center justify-center rounded-md" style={{ background: m.color }}>
                      <m.icon aria-hidden className="size-3.5 text-white" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.04em] text-app-mute">
                      Step {i + 1} · {m.label}
                    </span>
                    <span className="text-xs text-app-mute">· Day {day}</span>
                    <span className="ml-auto flex gap-0.5">
                      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="inline-flex size-7 items-center justify-center rounded text-app-dim hover:bg-app-hover hover:text-white disabled:opacity-30">
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" aria-label="Move down" disabled={i === seq.steps.length - 1} onClick={() => move(i, 1)} className="inline-flex size-7 items-center justify-center rounded text-app-dim hover:bg-app-hover hover:text-white disabled:opacity-30">
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button type="button" aria-label="Delete step" onClick={() => setSteps(seq.steps.filter((x) => x.id !== s.id))} className="inline-flex size-7 items-center justify-center rounded text-app-dim hover:bg-app-hover hover:text-[#f59090]">
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-[1fr_140px]">
                    <label className="flex flex-col gap-1.5 text-[12.5px] text-app-dim">
                      {s.type === "email" ? "Subject" : "Title"}
                      <input value={s.title} onChange={(e) => patch(s.id, { title: e.target.value })} className="h-9 rounded-[7px] border border-[#2e3033] bg-app-input px-2.5 text-[13px] text-white outline-none focus:border-app-accent" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[12.5px] text-app-dim">
                      Delay (days)
                      <input type="number" min={0} value={s.delayDays} onChange={(e) => patch(s.id, { delayDays: Math.max(0, Number(e.target.value) || 0) })} className="h-9 rounded-[7px] border border-[#2e3033] bg-app-input px-2.5 text-[13px] text-white outline-none focus:border-app-accent" />
                    </label>
                    {s.type !== "wait" && (
                      <label className="flex flex-col gap-1.5 text-[12.5px] text-app-dim sm:col-span-2">
                        {s.type === "email" ? "Body" : "Instructions"}
                        <textarea rows={s.type === "email" ? 4 : 2} value={s.body} onChange={(e) => patch(s.id, { body: e.target.value })} className="resize-y rounded-[7px] border border-[#2e3033] bg-app-input px-2.5 py-2 text-[13px] text-white outline-none focus:border-app-accent" />
                      </label>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          <li className="flex justify-center pt-1">
            <DropdownRoot>
              <DropdownTrigger asChild>
                <Button variant="ghost" size="sm" className="border border-dashed border-[#3a3c40] text-app-dim">
                  <Plus className="size-3.5" /> Add step
                </Button>
              </DropdownTrigger>
              <DropdownContent align="center">
                {(Object.keys(STEP) as SequenceStepType[]).map((t) => {
                  const I = STEP[t].icon;
                  return (
                    <DropdownItem key={t} onSelect={() => add(t)}>
                      <I /> {STEP[t].label}
                    </DropdownItem>
                  );
                })}
              </DropdownContent>
            </DropdownRoot>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function SequencesPage() {
  const { id } = useParams<{ id?: string }>();
  const db = useDB();
  const seq = id ? db.sequences.find((s) => s.id === id) : undefined;
  usePage({ title: seq?.name ?? "Sequences", icon: Send, parent: seq ? { label: "Sequences", href: "/app/sequences" } : undefined });
  return seq ? <SequenceEditor seq={seq} /> : <SequenceList />;
}
