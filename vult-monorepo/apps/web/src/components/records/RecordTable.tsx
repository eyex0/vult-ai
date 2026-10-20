import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { store, useDB } from "@/data/store";
import type { RecordKind } from "@/data/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CellEditor } from "./CellEditor";
import type { AnyRecord, Column } from "./columns";

export interface SortState {
  key: string;
  dir: 1 | -1;
}

interface Props {
  kind: RecordKind;
  nameLabel: string;
  rows: AnyRecord[];
  columns: Column<AnyRecord>[];
  sort: SortState;
  onSort: (s: SortState) => void;
  selected: Set<string>;
  onSelect: (next: Set<string>) => void;
  onOpen: (id: string) => void;
  activeId?: string;
  density: "compact" | "comfortable";
}

export function RecordTable({ kind, nameLabel, rows, columns, sort, onSort, selected, onSelect, onOpen, activeId, density }: Props) {
  const db = useDB();
  const [editing, setEditing] = useState<{ id: string; key: string } | null>(null);
  const rowH = density === "compact" ? "h-9" : "h-11";
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const header = (key: string, label: string, align?: "left" | "right") => {
    const active = sort.key === key;
    return (
      <button
        type="button"
        onClick={() => onSort({ key, dir: active ? (sort.dir === 1 ? -1 : 1) : 1 })}
        className={cn("flex h-9 w-full items-center gap-1.5 px-3 text-[12.5px] font-medium transition-colors hover:bg-app-hover hover:text-white", active ? "text-white" : "text-app-mute", align === "right" && "justify-end")}
      >
        {label}
        {active && (sort.dir === 1 ? <ArrowUp aria-hidden className="size-3" /> : <ArrowDown aria-hidden className="size-3" />)}
      </button>
    );
  };

  const total = kind === "deals" ? rows.reduce((a, r) => a + ((r as { value?: number }).value ?? 0), 0) : null;

  return (
    <div className="scrollbar-thin h-full overflow-auto">
      <table className="w-max min-w-full border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 top-0 z-30 w-11 border-b border-app-line bg-app pl-4 text-left">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={() => onSelect(allSelected ? new Set() : new Set(rows.map((r) => r.id)))}
                className="size-[15px] cursor-pointer accent-accent"
              />
            </th>
            <th scope="col" aria-sort={sort.key === "name" ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="sticky left-11 top-0 z-30 min-w-[240px] border-b border-r border-app-line bg-app p-0 text-left">
              {header("name", nameLabel)}
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                style={{ minWidth: c.width }}
                className="sticky top-0 z-20 border-b border-r border-app-line bg-app p-0 text-left last:border-r-0"
              >
                {header(c.key, c.label, c.align)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isSel = selected.has(r.id);
            const isActive = activeId === r.id;
            const bg = isActive ? "bg-[#161a2e]" : isSel ? "bg-[#141729]" : "bg-app group-hover:bg-[#151618]";
            return (
              <motion.tr
                key={r.id}
                className="group"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 14) * 0.018, ease: [0.16, 1, 0.3, 1] }}
              >
                <td className={cn("sticky left-0 z-10 border-b border-app-line-soft pl-4 transition-colors", bg, rowH)}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${(r as { name: string }).name}`}
                    checked={isSel}
                    onChange={() => {
                      const next = new Set(selected);
                      if (isSel) next.delete(r.id);
                      else next.add(r.id);
                      onSelect(next);
                    }}
                    className="size-[15px] cursor-pointer accent-accent"
                  />
                </td>
                <td className={cn("sticky left-11 z-10 border-b border-r border-app-line-soft p-0 transition-colors", bg)}>
                  {editing?.id === r.id && editing.key === "name" ? (
                    <div className={rowH}>
                      <CellEditor
                        kind="text"
                        label={`${nameLabel} name`}
                        initial={(r as { name: string }).name}
                        onCommit={(v) => {
                          if (v.trim()) store.update(kind, r.id, { name: v.trim() } as never);
                          setEditing(null);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    </div>
                  ) : (
                    <div className={cn("flex items-center gap-2 px-3", rowH)}>
                      <Avatar name={(r as { name: string }).name} square={kind !== "people"} size={20} />
                      <button
                        type="button"
                        onClick={() => onOpen(r.id)}
                        onDoubleClick={() => setEditing({ id: r.id, key: "name" })}
                        className="min-w-0 truncate text-left font-[550] text-white underline decoration-transparent underline-offset-[3px] transition-colors hover:decoration-[#5a5d66]"
                      >
                        {(r as { name: string }).name}
                      </button>
                    </div>
                  )}
                </td>
                {columns.map((c) => {
                  const isEditing = editing?.id === r.id && editing.key === c.key;
                  return (
                    <td key={c.key} className={cn("border-b border-r border-app-line-soft p-0 transition-colors last:border-r-0", bg)}>
                      {isEditing && c.edit ? (
                        <div className={rowH}>
                          <CellEditor
                            kind={c.edit.kind}
                            options={c.edit.options}
                            initial={c.edit.raw(r)}
                            align={c.align}
                            label={`${c.label} for ${(r as { name: string }).name}`}
                            onCommit={(v) => {
                              const patch = c.edit!.patch(v);
                              store.update(kind, r.id, patch as never);
                              if (kind === "deals" && c.key === "stage") store.log({ kind, id: r.id }, "stage", `Stage changed to ${v}`);
                              setEditing(null);
                            }}
                            onCancel={() => setEditing(null)}
                          />
                        </div>
                      ) : c.edit ? (
                        <button
                          type="button"
                          onClick={() => setEditing({ id: r.id, key: c.key })}
                          aria-label={`Edit ${c.label} for ${(r as { name: string }).name}`}
                          className={cn("flex w-full items-center whitespace-nowrap px-3 text-left transition-colors hover:bg-white/[0.03]", rowH, c.align === "right" && "justify-end")}
                        >
                          {c.render(r, db)}
                        </button>
                      ) : (
                        <div className={cn("flex items-center whitespace-nowrap px-3", rowH, c.align === "right" && "justify-end")}>{c.render(r, db)}</div>
                      )}
                    </td>
                  );
                })}
              </motion.tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="sticky bottom-0 left-0 z-10 h-9 border-t border-app-line bg-app" />
            <td className="sticky bottom-0 left-11 z-10 border-r border-t border-app-line bg-app px-3 text-xs text-app-mute">
              {rows.length} {rows.length === 1 ? "record" : "records"}
            </td>
            {columns.map((c) => (
              <td key={c.key} className={cn("sticky bottom-0 border-r border-t border-app-line bg-app px-3 text-xs text-app-mute last:border-r-0", c.align === "right" && "text-right")}>
                {c.key === "value" && total != null ? <span className="tabular text-app-dim">Sum {formatMoney(total)}</span> : null}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
