import { motion } from "framer-motion";
import { Plus, Workflow as WorkflowIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_TONE } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { Workflow } from "@/data/types";
import { timeAgo } from "@/lib/format";
import { STEP_META } from "./WorkflowBuilder";

export default function WorkflowsPage() {
  usePage({ title: "Workflows", icon: WorkflowIcon });
  const db = useDB();
  const [, navigate] = useLocation();

  const create = () => {
    const w: Workflow = {
      id: uid("w"),
      name: "Untitled workflow",
      description: "Describe what this workflow does.",
      status: "Draft",
      runs7d: 0,
      failures7d: 0,
      updatedAt: new Date().toISOString(),
      steps: [{ id: uid("s"), type: "trigger", title: "Record created", config: "Deals · any pipeline" }],
    };
    store.create("workflows", w);
    navigate(`/app/workflows/${w.id}`);
  };

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="flex items-center justify-end border-b border-app-line px-4 py-2">
        <Button size="sm" onClick={create}>
          <Plus className="size-3.5" /> New workflow
        </Button>
      </div>
      <div className="mx-auto grid max-w-[1080px] gap-3 p-4 sm:p-6 md:grid-cols-2 lg:grid-cols-3">
        {db.workflows.map((w, i) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }}>
            <Link href={`/app/workflows/${w.id}`} className="group flex h-full flex-col gap-3 rounded-xl border border-app-line bg-app-panel p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#34363c]">
              <span className="flex items-center gap-1.5">
                {w.steps.slice(0, 5).map((s, j) => {
                  const m = STEP_META[s.type];
                  return (
                    <span key={s.id} className="flex items-center gap-1.5">
                      {j > 0 && <span aria-hidden className="h-px w-3 bg-[#3a3c40]" />}
                      <span className="flex size-6 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110" style={{ background: m.color, transitionDelay: `${j * 30}ms` }}>
                        <m.icon aria-hidden className="size-3 text-white" />
                      </span>
                    </span>
                  );
                })}
              </span>
              <span className="font-semibold text-white">{w.name}</span>
              <span className="line-clamp-2 text-[12.5px] text-app-mute">{w.description}</span>
              <span className="mt-auto flex items-center gap-2 pt-1 text-xs text-app-mute">
                <Badge dark dot tone={STATUS_TONE[w.status]}>
                  {w.status}
                </Badge>
                {w.runs7d} runs · 7d
                <span className="ml-auto">{timeAgo(w.updatedAt)}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
