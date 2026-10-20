import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Bell, Bot, CheckSquare, Clock, GitBranch, Pause, Play, Plus, Trash2, Workflow as WorkflowIcon, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Redirect, useParams } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DropdownContent, DropdownItem, DropdownRoot, DropdownTrigger } from "@/components/ui/Dropdown";
import { STATUS_TONE } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { Workflow, WorkflowStep, WorkflowStepType } from "@/data/types";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const STEP_META: Record<WorkflowStepType, { label: string; color: string; icon: typeof Zap; title: string; config: string }> = {
  trigger: { label: "Trigger", color: "#d9480f", icon: Zap, title: "Record created", config: "Deals · any pipeline" },
  condition: { label: "Condition", color: "#7048e8", icon: GitBranch, title: "If value is over $50,000", config: "Otherwise skip the remaining steps" },
  agent: { label: "Agent", color: "#3b5bfd", icon: Bot, title: "Research the company", config: "Summarise news, hires and funding" },
  action: { label: "Action", color: "#0b7285", icon: CheckSquare, title: "Create a task", config: "Assign to the record owner" },
  notify: { label: "Notify", color: "#2f9e44", icon: Bell, title: "Post to #sales", config: "Include a link to the record" },
  wait: { label: "Wait", color: "#495057", icon: Clock, title: "Wait 1 day", config: "Then continue" },
};

const ADDABLE: WorkflowStepType[] = ["condition", "agent", "action", "notify", "wait"];

function AddStep({ onAdd, label }: { onAdd: (t: WorkflowStepType) => void; label: string }) {
  return (
    <DropdownRoot>
      <DropdownTrigger aria-label={label} className="group relative z-[1] inline-flex size-7 items-center justify-center rounded-full border border-dashed border-[#3a3c40] bg-app text-app-dim transition-[transform,border-color,color] duration-200 hover:scale-110 hover:border-app-accent hover:text-white data-[state=open]:border-app-accent">
        <Plus className="size-3.5" />
      </DropdownTrigger>
      <DropdownContent align="center">
        {ADDABLE.map((t) => {
          const m = STEP_META[t];
          return (
            <DropdownItem key={t} onSelect={() => onAdd(t)}>
              <span className="flex size-5 items-center justify-center rounded" style={{ background: m.color }}>
                <m.icon className="!size-3 !text-white" />
              </span>
              {m.label}
            </DropdownItem>
          );
        })}
      </DropdownContent>
    </DropdownRoot>
  );
}

export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const wf = db.workflows.find((w) => w.id === id);
  usePage({ title: wf?.name ?? "Workflow", icon: WorkflowIcon, parent: { label: "Workflows", href: "/app/workflows" } });
  const [sel, setSel] = useState<string | null>(wf?.steps[1]?.id ?? wf?.steps[0]?.id ?? null);
  const [running, setRunning] = useState<number>(-1);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  if (!wf) return <Redirect to="/app/workflows" />;

  const save = (patch: Partial<Workflow>) => store.update("workflows", wf.id, { ...patch, updatedAt: new Date().toISOString() });
  const setSteps = (steps: WorkflowStep[]) => save({ steps });
  const current = wf.steps.find((s) => s.id === sel) ?? wf.steps[0]!;

  const addAt = (index: number, type: WorkflowStepType) => {
    const m = STEP_META[type];
    const step = { id: uid("s"), type, title: m.title, config: m.config };
    const steps = [...wf.steps];
    steps.splice(index, 0, step);
    setSteps(steps);
    setSel(step.id);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 1 || j >= wf.steps.length) return; // trigger stays first
    const steps = [...wf.steps];
    [steps[i], steps[j]] = [steps[j]!, steps[i]!];
    setSteps(steps);
  };
  const patchStep = (p: Partial<WorkflowStep>) => setSteps(wf.steps.map((s) => (s.id === current.id ? { ...s, ...p } : s)));

  const testRun = () => {
    clearInterval(timer.current);
    setRunning(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      if (i >= wf.steps.length) {
        clearInterval(timer.current);
        setRunning(-1);
        toast.success(`Test run passed · ${wf.steps.length} steps`);
        return;
      }
      setRunning(i);
    }, 650);
  };

  const togglePublish = () => {
    const next = wf.status === "Live" ? "Paused" : "Live";
    save({ status: next });
    if (next === "Live") {
      store.tick("workflow");
      toast.success("Workflow published");
    } else toast("Workflow paused");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-app-line px-4 py-2">
        <label htmlFor="wf-name" className="sr-only">
          Workflow name
        </label>
        <input id="wf-name" value={wf.name} onChange={(e) => save({ name: e.target.value })} className="h-8 min-w-0 max-w-[320px] flex-1 rounded-md bg-transparent px-2 text-sm font-semibold text-white outline-none hover:bg-app-hover focus:bg-app-input focus:ring-1 focus:ring-app-accent" />
        <Badge dark dot tone={STATUS_TONE[wf.status]}>
          {wf.status}
        </Badge>
        <span className="ml-auto" />
        <span className="hidden text-xs text-app-mute sm:inline">
          {wf.runs7d} runs · {wf.failures7d} failed (7d)
        </span>
        <Button variant="ghost" size="sm" className="border border-[#2e3033] text-app-dim" onClick={testRun} disabled={running >= 0}>
          <Play className="size-3.5" /> {running >= 0 ? "Running…" : "Test run"}
        </Button>
        <Button variant={wf.status === "Live" ? "secondary" : "accent"} size="sm" onClick={togglePublish}>
          {wf.status === "Live" ? (
            <>
              <Pause className="size-3.5" /> Pause
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-wrap">
        <div className="dot-grid-dark scrollbar-thin min-h-0 min-w-0 flex-[999_1_480px] overflow-y-auto px-4 py-10">
          <ol aria-label="Workflow steps" className="mx-auto flex max-w-[440px] flex-col items-center">
            <AnimatePresence initial={false}>
              {wf.steps.map((s, i) => {
                const m = STEP_META[s.type];
                const selected = s.id === current.id;
                const isRunning = running === i;
                const ran = running > i;
                return (
                  <motion.li key={s.id} layout transition={spring} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex w-full flex-col items-center">
                    {i > 0 && (
                      <span aria-hidden className="relative h-6 w-[1.5px] bg-[#2e3033]">
                        {running >= i && <motion.span className="absolute inset-0 origin-top bg-app-accent" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />}
                      </span>
                    )}
                    <div className="group relative w-full">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSel(s.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border-[1.5px] bg-app-raise px-3.5 py-3 text-left transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5",
                          selected ? "border-app-accent shadow-[0_0_0_4px_rgb(111_135_255/0.14),0_14px_32px_-14px_rgb(59_91_253/0.6)]" : "border-[#2a2b2e]",
                          isRunning && "border-[#3ddc84] shadow-[0_0_0_4px_rgb(61_220_132/0.15)]",
                        )}
                      >
                        <span className="relative flex size-[30px] shrink-0 items-center justify-center rounded-lg" style={{ background: m.color }}>
                          <m.icon aria-hidden className="size-[15px] text-white" />
                          {ran && <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-[#3ddc84] text-[9px] text-black">✓</span>}
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-app-mute">{m.label}</span>
                          <span className="font-[550] text-white">{s.title}</span>
                          <span className="text-[12.5px] text-app-dim">{s.config}</span>
                        </span>
                      </button>
                      {i > 0 && (
                        <span className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <button type="button" aria-label={`Move ${s.title} up`} disabled={i === 1} onClick={() => move(i, -1)} className="inline-flex size-6 items-center justify-center rounded bg-app-hover text-app-dim hover:text-white disabled:opacity-30">
                            <ArrowUp className="size-3" />
                          </button>
                          <button type="button" aria-label={`Move ${s.title} down`} disabled={i === wf.steps.length - 1} onClick={() => move(i, 1)} className="inline-flex size-6 items-center justify-center rounded bg-app-hover text-app-dim hover:text-white disabled:opacity-30">
                            <ArrowDown className="size-3" />
                          </button>
                        </span>
                      )}
                    </div>
                    <span aria-hidden className="h-4 w-[1.5px] bg-[#2e3033]" />
                    <AddStep label={`Add step after ${s.title}`} onAdd={(t) => addAt(i + 1, t)} />
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </div>

        <aside aria-label="Step settings" className="scrollbar-thin flex max-w-full flex-[1_1_320px] flex-col gap-4 overflow-y-auto border-l border-app-line bg-[#0e0f10] p-[18px]">
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg" style={{ background: STEP_META[current.type].color }}>
                  {(() => {
                    const I = STEP_META[current.type].icon;
                    return <I aria-hidden className="size-3.5 text-white" />;
                  })()}
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-app-mute">{STEP_META[current.type].label}</span>
                  <h2 className="text-sm font-semibold text-white">{current.title}</h2>
                </span>
              </div>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-app-dim">
                Step name
                <input value={current.title} onChange={(e) => patchStep({ title: e.target.value })} className="h-[34px] rounded-[7px] border border-[#2e3033] bg-[#111214] px-2.5 text-[13px] text-white outline-none focus:border-app-accent" />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] text-app-dim">
                Configuration
                <textarea rows={4} value={current.config} onChange={(e) => patchStep({ config: e.target.value })} className="resize-y rounded-[7px] border border-[#2e3033] bg-[#111214] px-2.5 py-2 text-[13px] text-white outline-none focus:border-app-accent" />
              </label>
              {current.type !== "trigger" && (
                <Button
                  variant="danger"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    const rest = wf.steps.filter((s) => s.id !== current.id);
                    setSteps(rest);
                    setSel(rest[rest.length - 1]?.id ?? null);
                  }}
                >
                  <Trash2 className="size-3.5" /> Delete step
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="mt-2 flex flex-col gap-1.5 rounded-[10px] border border-app-line p-3 text-[12.5px]">
            <span className="font-[550] text-white">Last 7 days</span>
            <span className="flex justify-between text-app-dim">
              Runs <span className="tabular text-app-text">{wf.runs7d}</span>
            </span>
            <span className="flex justify-between text-app-dim">
              Succeeded <span className="tabular text-[#69db7c]">{wf.runs7d - wf.failures7d}</span>
            </span>
            <span className="flex justify-between text-app-dim">
              Failed <span className="tabular text-[#f59090]">{wf.failures7d}</span>
            </span>
          </div>
          <p className="text-xs text-app-mute">Workflows run only in this browser demo. Test runs simulate each step.</p>
        </aside>
      </div>
    </div>
  );
}
