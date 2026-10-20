import * as Popover from "@radix-ui/react-popover";
import { ArrowDown, ArrowUp, Eye, EyeOff, Filter, Plus, Settings2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Column } from "./columns";

export type FilterOp = "contains" | "is" | "gt" | "lt";
export interface FilterRule {
  id: string;
  key: string;
  op: FilterOp;
  value: string;
}

export const OP_LABEL: Record<FilterOp, string> = { contains: "contains", is: "is", gt: "is greater than", lt: "is less than" };

export function applyFilter(value: string | number, rule: FilterRule) {
  const v = rule.value.trim().toLowerCase();
  if (!v) return true;
  if (rule.op === "gt") return Number(value) > Number(rule.value);
  if (rule.op === "lt") return Number(value) < Number(rule.value);
  const s = String(value).toLowerCase();
  return rule.op === "is" ? s === v : s.includes(v);
}

const popCls = "z-[95] animate-pop rounded-xl border border-[#2e3033] bg-pop p-3 text-fg shadow-dark-pop";
const inputCls = "h-8 w-full rounded-[7px] border border-[#2e3033] bg-app-input px-2 text-[13px] text-white outline-none focus:border-app-accent";

export function FilterButton<T>({ columns, nameLabel, onAdd }: { columns: Column<T>[]; nameLabel: string; onAdd: (r: FilterRule) => void }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("name");
  const [op, setOp] = useState<FilterOp>("contains");
  const [value, setValue] = useState("");
  const all = [{ key: "name", label: nameLabel }, ...columns.map((c) => ({ key: c.key, label: c.label }))];
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" className="border border-dashed border-[#2e3033] text-app-dim">
          <Filter className="size-3.5" /> Filter
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <div className="theme-dark">
          <Popover.Content align="start" sideOffset={6} className={cn(popCls, "w-[300px]")}>
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!value.trim()) return;
                onAdd({ id: Math.random().toString(36).slice(2), key, op, value });
                setValue("");
                setOpen(false);
              }}
            >
              <p className="text-[13px] font-semibold">Add a filter</p>
              <label className="sr-only" htmlFor="flt-col">
                Field
              </label>
              <select id="flt-col" value={key} onChange={(e) => setKey(e.target.value)} className={inputCls}>
                {all.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="flt-op">
                Operator
              </label>
              <select id="flt-op" value={op} onChange={(e) => setOp(e.target.value as FilterOp)} className={inputCls}>
                {(Object.keys(OP_LABEL) as FilterOp[]).map((o) => (
                  <option key={o} value={o}>
                    {OP_LABEL[o]}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="flt-val">
                Value
              </label>
              <input id="flt-val" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className={inputCls} />
              <Button type="submit" size="sm" variant="accent" className="mt-1">
                <Plus className="size-3.5" /> Add filter
              </Button>
            </form>
          </Popover.Content>
        </div>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function FilterChips({ rules, labelFor, onRemove }: { rules: FilterRule[]; labelFor: (key: string) => string; onRemove: (id: string) => void }) {
  if (!rules.length) return null;
  return (
    <>
      {rules.map((r) => (
        <span key={r.id} className="inline-flex h-8 animate-pop items-center gap-1 rounded-[7px] border border-[#2a3060] bg-[#16182a] pl-2.5 pr-1 text-[12.5px] text-[#c9d3ff]">
          <b className="font-[550]">{labelFor(r.key)}</b> {OP_LABEL[r.op]} “{r.value}”
          <button type="button" onClick={() => onRemove(r.id)} aria-label={`Remove filter ${labelFor(r.key)}`} className="inline-flex size-6 items-center justify-center rounded text-[#9daeff] hover:bg-white/10">
            <X className="size-3" />
          </button>
        </span>
      ))}
    </>
  );
}

export interface ViewState {
  order: string[];
  hidden: string[];
  density: "compact" | "comfortable";
}

export function ViewSettings<T>({ columns, view, onChange }: { columns: Column<T>[]; view: ViewState; onChange: (v: ViewState) => void }) {
  const ordered = view.order.map((k) => columns.find((c) => c.key === k)).filter(Boolean) as Column<T>[];
  const move = (i: number, d: number) => {
    const order = [...view.order];
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    onChange({ ...view, order });
  };
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" className="border border-[#2e3033] text-app-dim">
          <Settings2 className="size-3.5" /> <span className="hidden sm:inline">View settings</span>
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <div className="theme-dark">
          <Popover.Content align="end" sideOffset={6} className={cn(popCls, "w-[290px] p-2")}>
            <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-3">Density</p>
            <div className="mx-1 mb-2 grid grid-cols-2 gap-1 rounded-lg border border-app-line p-0.5">
              {(["compact", "comfortable"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={view.density === d}
                  onClick={() => onChange({ ...view, density: d })}
                  className={cn("h-7 rounded-md text-[12.5px] capitalize transition-colors", view.density === d ? "bg-app-hover text-white" : "text-app-mute hover:text-white")}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-3">Columns</p>
            <ul className="max-h-[300px] overflow-y-auto">
              {ordered.map((c, i) => {
                const hidden = view.hidden.includes(c.key);
                return (
                  <li key={c.key} className="group flex h-8 items-center gap-1 rounded-md px-1 hover:bg-surface-hover">
                    <button
                      type="button"
                      aria-pressed={!hidden}
                      aria-label={`${hidden ? "Show" : "Hide"} ${c.label}`}
                      onClick={() => onChange({ ...view, hidden: hidden ? view.hidden.filter((k) => k !== c.key) : [...view.hidden, c.key] })}
                      className="inline-flex size-6 items-center justify-center rounded text-fg-3 hover:text-white"
                    >
                      {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                    <span className={cn("flex-1 text-[13px]", hidden && "text-fg-3")}>{c.label}</span>
                    <button type="button" aria-label={`Move ${c.label} up`} onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex size-6 items-center justify-center rounded text-fg-3 opacity-0 hover:text-white disabled:opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
                      <ArrowUp className="size-3" />
                    </button>
                    <button type="button" aria-label={`Move ${c.label} down`} onClick={() => move(i, 1)} disabled={i === ordered.length - 1} className="inline-flex size-6 items-center justify-center rounded text-fg-3 opacity-0 hover:text-white disabled:opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
                      <ArrowDown className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Popover.Content>
        </div>
      </Popover.Portal>
    </Popover.Root>
  );
}
