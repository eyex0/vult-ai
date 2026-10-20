import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { badgeDot } from "@/components/ui/Badge";
import { STAGE_TONE, companyOf, memberName } from "@/data/selectors";
import { store, useDB } from "@/data/store";
import { DEAL_STAGES, type Deal, type DealStage } from "@/data/types";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Arrow keys jump between stage columns instead of nudging the card a few pixels. */
const columnCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  const dir = event.code === "ArrowRight" ? 1 : event.code === "ArrowLeft" ? -1 : 0;
  if (!dir) return undefined;
  event.preventDefault();
  const rects = [...context.droppableRects.values()].sort((a, b) => a.left - b.left);
  const x = currentCoordinates.x;
  const target = dir > 0 ? rects.find((r) => r.left > x + 1) : [...rects].reverse().find((r) => r.left + r.width < x - 1);
  if (!target) return currentCoordinates;
  return { x: target.left + 12, y: Math.max(currentCoordinates.y, target.top + 48) };
};

function Card({ deal, onOpen, overlay, dragging }: { deal: Deal; onOpen?: () => void; overlay?: boolean; dragging?: boolean }) {
  const db = useDB();
  const company = companyOf(db, deal)?.name ?? "—";
  const owner = memberName(db, deal.ownerId);
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[10px] border border-[#26272b] bg-app-raise px-3 py-2.5 text-[13px] transition-[border-color,box-shadow,opacity] duration-200",
        overlay ? "rotate-[-2deg] scale-[1.03] border-app-accent shadow-[0_24px_40px_-12px_rgb(0_0_0/0.8)]" : "hover:border-[#3a3c40]",
        dragging && "opacity-30",
      )}
    >
      <button type="button" onClick={onOpen} className="text-left font-semibold text-white hover:underline" tabIndex={overlay ? -1 : 0}>
        {deal.name}
      </button>
      <span className="flex items-center gap-1.5 text-app-dim">
        <Avatar name={company} square size={16} /> {company}
      </span>
      <span className="flex items-center justify-between">
        <span className="tabular text-app-text">{formatMoney(deal.value)}</span>
        <span className="flex items-center gap-1.5 text-xs text-app-mute">
          <CalendarDays aria-hidden className="size-3" />
          {formatDate(deal.closeDate)}
          <Avatar name={owner} size={18} />
        </span>
      </span>
    </div>
  );
}

function Draggable({ deal, onOpen }: { deal: Deal; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id, data: { stage: deal.stage } });
  return (
    <motion.div layout="position" transition={{ type: "spring", stiffness: 500, damping: 40 }} ref={setNodeRef} {...listeners} {...attributes} aria-roledescription="Draggable deal" aria-label={`${deal.name}, ${deal.stage}. Press space to pick up.`} className="cursor-grab touch-none rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-app-accent active:cursor-grabbing">
      <Card deal={deal} onOpen={onOpen} dragging={isDragging} />
    </motion.div>
  );
}

function Column({ stage, deals, onOpen }: { stage: DealStage; deals: Deal[]; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((a, d) => a + d.value, 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage}, ${deals.length} deals`}
      className={cn(
        "flex max-h-full w-[272px] shrink-0 flex-col rounded-xl border transition-colors duration-150",
        isOver ? "border-accent bg-[#151830]" : "border-[#1e1f22] bg-[#0d0e0f]",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="size-2 rounded-full" style={{ background: badgeDot(STAGE_TONE[stage]) }} />
        <h2 className="text-[13px] font-semibold text-white">{stage}</h2>
        <span className="rounded-[5px] bg-[#1e1f22] px-1.5 text-[11.5px] text-app-dim">{deals.length}</span>
        <span className="tabular ml-auto text-xs text-app-mute">{formatMoney(total)}</span>
      </div>
      <div className="scrollbar-thin flex min-h-[80px] flex-col gap-2 overflow-y-auto px-2 pb-2.5">
        {deals.map((d) => (
          <Draggable key={d.id} deal={d} onOpen={() => onOpen(d.id)} />
        ))}
        {deals.length === 0 && <p className="rounded-lg border border-dashed border-[#2a2b2e] py-6 text-center text-xs text-app-mute">Drop deals here</p>}
      </div>
    </section>
  );
}

export function KanbanBoard({ deals, onOpen }: { deals: Deal[]; onOpen: (id: string) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: columnCoordinates }));
  const byStage = useMemo(() => Object.fromEntries(DEAL_STAGES.map((s) => [s, deals.filter((d) => d.stage === s)])) as Record<DealStage, Deal[]>, [deals]);
  const active = deals.find((d) => d.id === activeId);

  const onStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const to = e.over?.id as DealStage | undefined;
    const deal = deals.find((d) => d.id === e.active.id);
    if (!to || !deal || deal.stage === to) return;
    store.update("deals", deal.id, { stage: to });
    store.log({ kind: "deals", id: deal.id }, "stage", `Stage changed to ${to}`);
    if (to === "Won") toast.success(`${deal.name} won — ${formatMoney(deal.value)}`);
    else toast(`Moved ${deal.name} to ${to}`);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onStart}
      onDragEnd={onEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${deals.find((d) => d.id === active.id)?.name}.`,
          onDragOver: ({ over }) => (over ? `Over ${over.id}.` : "Not over a stage."),
          onDragEnd: ({ over, active }) => (over ? `Moved ${deals.find((d) => d.id === active.id)?.name} to ${over.id}.` : "Dropped."),
          onDragCancel: () => "Move cancelled.",
        },
      }}
    >
      <div className="scrollbar-thin flex h-full items-start gap-3 overflow-x-auto p-4">
        {DEAL_STAGES.map((s, i) => (
          <motion.div key={s} className="flex max-h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <Column stage={s} deals={byStage[s]} onOpen={onOpen} />
          </motion.div>
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>{active ? <Card deal={active} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
