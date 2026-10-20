import { motion } from "framer-motion";
import { BarChart3, Table2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { TooltipProps } from "recharts";
import { cn } from "@/lib/utils";

/** Chart palette for the dark app surface (#131416). Single-series charts use SERIES; validated ≥3:1 against the surface. */
export const VIZ = {
  series: "#6f87ff",
  seriesMuted: "#3a4a9e",
  grid: "#232428",
  axis: "#8a8d96",
  surface: "#131416",
} as const;

export const axisProps = {
  stroke: VIZ.axis,
  tick: { fill: VIZ.axis, fontSize: 11.5 },
  tickLine: false,
  axisLine: false,
} as const;

export function ChartTooltip({ active, payload, label, format }: TooltipProps<number, string> & { format: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#2e3033] bg-[#0b0c0d] px-3 py-2 text-[12.5px] shadow-xl">
      <p className="mb-0.5 text-app-mute">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-white">
          <span aria-hidden className="size-2 rounded-sm" style={{ background: VIZ.series }} />
          <span className="tabular font-semibold">{format(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

/** Card that shows a chart, with a toggle to an accessible table of the same data. */
export function ChartCard<T extends Record<string, string | number>>({
  title,
  subtitle,
  rows,
  columns,
  children,
  className,
  index = 0,
}: {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: { key: keyof T; label: string; format?: (v: T[keyof T]) => string; align?: "right" }[];
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const [table, setTable] = useState(false);
  return (
    <motion.section
      aria-label={title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 * index, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex min-w-0 flex-col rounded-xl border border-app-line bg-app-panel p-4", className)}
    >
      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-[13.5px] font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-app-mute">{subtitle}</p>}
        </div>
        <div role="group" aria-label={`${title} view`} className="flex rounded-md border border-app-line p-0.5">
          <button type="button" aria-pressed={!table} aria-label="Chart view" onClick={() => setTable(false)} className={cn("inline-flex size-6 items-center justify-center rounded", !table ? "bg-app-hover text-white" : "text-app-mute hover:text-white")}>
            <BarChart3 className="size-3.5" />
          </button>
          <button type="button" aria-pressed={table} aria-label="Table view" onClick={() => setTable(true)} className={cn("inline-flex size-6 items-center justify-center rounded", table ? "bg-app-hover text-white" : "text-app-mute hover:text-white")}>
            <Table2 className="size-3.5" />
          </button>
        </div>
      </div>
      {table ? (
        <div className="scrollbar-thin h-[240px] overflow-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-app-mute">
                {columns.map((c) => (
                  <th key={String(c.key)} scope="col" className={cn("border-b border-app-line px-2 py-1.5 font-medium", c.align === "right" && "text-right")}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={String(c.key)} className={cn("tabular border-b border-app-line-soft px-2 py-1.5 text-app-text", c.align === "right" && "text-right")}>
                      {c.format ? c.format(r[c.key]) : String(r[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-[240px]">{children}</div>
      )}
    </motion.section>
  );
}
