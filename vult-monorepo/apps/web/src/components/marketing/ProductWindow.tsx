import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckSquare, FileText, Home, Inbox, LineChart, Search, Sparkles, Users, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { STAGE_TONE } from "@/data/selectors";
import type { DealStage } from "@/data/types";
import { BrowserFrame } from "./Section";

const DEALS: { name: string; company: string; stage: DealStage; value: string; owner: string; close: string }[] = [
  { name: "Platform rollout", company: "Kelvra", stage: "Negotiation", value: "$84,000", owner: "Maya Ruiz", close: "Nov 04" },
  { name: "Annual renewal", company: "Ortiq", stage: "Won", value: "$42,500", owner: "Theo Lindqvist", close: "Oct 28" },
  { name: "EMEA expansion", company: "Halbrook", stage: "Proposal", value: "$126,000", owner: "Ines Okafor", close: "Nov 18" },
  { name: "Pilot · 25 seats", company: "Maplewing", stage: "Qualified", value: "$18,750", owner: "Maya Ruiz", close: "Dec 02" },
  { name: "Data warehouse sync", company: "Solvane", stage: "Negotiation", value: "$61,200", owner: "Jun Park", close: "Nov 11" },
  { name: "Agents add-on", company: "Nodeline", stage: "Lead", value: "$9,600", owner: "Ines Okafor", close: "Dec 15" },
  { name: "Multi-region", company: "Brightvale", stage: "Proposal", value: "$73,400", owner: "Theo Lindqvist", close: "Nov 26" },
  { name: "Seat true-up", company: "Cobalt & Finch", stage: "Lost", value: "$12,000", owner: "Jun Park", close: "Oct 20" },
];

const NAV = [
  [Home, "Home"],
  [Inbox, "Inbox"],
  [CheckSquare, "Tasks"],
  [FileText, "Notes"],
  [LineChart, "Reports"],
  [Workflow, "Workflows"],
] as const;

/** Interactive product preview used in the home hero: a searchable deals table in the dark app UI. */
export function ProductWindow() {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? DEALS.filter((d) => `${d.name} ${d.company} ${d.stage} ${d.owner}`.toLowerCase().includes(s)) : DEALS;
  }, [q]);

  return (
    <BrowserFrame>
      <div className="theme-dark flex min-h-[500px] overflow-hidden rounded-t-[10px] border border-b-0 border-app-line bg-app text-[13px] text-app-text">
        <aside aria-label="App navigation preview" className="hidden w-[220px] shrink-0 flex-col gap-0.5 border-r border-app-line bg-app-side p-2.5 md:flex">
          <div className="mb-1.5 flex h-9 items-center gap-2 px-1.5">
            <span className="flex size-[22px] items-center justify-center rounded-md bg-black">
              <LogoMark tone="light" size={16} />
            </span>
            <span className="font-semibold text-white">Ridgeway Labs</span>
          </div>
          <div className="mb-2 flex h-[30px] items-center gap-1.5 rounded-[7px] border border-app-line px-2 text-app-mute">
            <Search className="size-[13px]" /> Search
            <span className="ml-auto rounded border border-[#2e3033] px-1 text-[11px]">⌘K</span>
          </div>
          {NAV.map(([Icon, label]) => (
            <span key={label} className="flex h-[30px] items-center gap-2 rounded-[7px] px-2 text-app-dim">
              <Icon className="size-3.5" /> {label}
            </span>
          ))}
          <span className="px-2 pb-1 pt-3.5 text-[11px] font-semibold tracking-[0.04em] text-app-mute">RECORDS</span>
          <span className="flex h-[30px] items-center gap-2 rounded-[7px] px-2 text-app-dim">
            <Building2 className="size-3.5 text-[#6f87ff]" /> Companies
          </span>
          <span className="flex h-[30px] items-center gap-2 rounded-[7px] px-2 text-app-dim">
            <Users className="size-3.5 text-[#3ddc84]" /> People
          </span>
          <span className="flex h-[30px] items-center gap-2 rounded-[7px] bg-app-hover px-2 text-white">
            <span className="size-3.5 rounded bg-[#f2994a]" /> Deals
          </span>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[49px] items-center gap-2.5 border-b border-app-line px-4">
            <span className="size-[18px] rounded-[5px] bg-[#f2994a]" />
            <span className="text-sm font-semibold text-white">Deals</span>
            <span className="text-[#6b6e78]">·</span>
            <span className="text-app-mute">Q4 pipeline</span>
            <span className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-[7px] bg-accent px-2.5 text-xs font-[550] text-white">
              <Sparkles className="size-3" /> Ask Vult
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-app-line px-4 py-2.5">
            <label className="flex h-[30px] w-60 max-w-full items-center gap-1.5 rounded-[7px] border border-[#2e3033] bg-[#17181a] px-2.5 focus-within:border-app-accent">
              <Search aria-hidden className="size-[13px] text-app-mute" />
              <span className="sr-only">Search deals</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search deals…"
                className="w-full bg-transparent text-[13px] text-app-text outline-none placeholder:text-app-mute"
              />
            </label>
            <span className="inline-flex h-[30px] items-center rounded-[7px] border border-dashed border-[#2e3033] px-2.5 text-app-mute">+ Filter</span>
            <span className="ml-auto text-xs text-app-mute" aria-live="polite">
              {rows.length} of {DEALS.length} deals
            </span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-app-mute">
                  {["Deal", "Company", "Stage", "Value", "Owner", "Close"].map((h, i) => (
                    <th key={h} scope="col" className={`border-b border-app-line px-3 py-2 font-medium ${i ? "border-l" : "pl-4"} ${h === "Value" ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((d) => (
                    <motion.tr
                      key={d.name}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="transition-colors hover:bg-[#17181a]"
                    >
                      <td className="h-[42px] whitespace-nowrap border-b border-app-line-soft pl-4 pr-3 font-medium text-white">{d.name}</td>
                      <td className="whitespace-nowrap border-b border-l border-app-line-soft px-3">
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={d.company} square size={18} /> {d.company}
                        </span>
                      </td>
                      <td className="border-b border-l border-app-line-soft px-3">
                        <Badge tone={STAGE_TONE[d.stage]} dark dot>
                          {d.stage}
                        </Badge>
                      </td>
                      <td className="tabular border-b border-l border-app-line-soft px-3 text-right">{d.value}</td>
                      <td className="whitespace-nowrap border-b border-l border-app-line-soft px-3">
                        <span className="inline-flex items-center gap-2 text-[#c9cbd2]">
                          <Avatar name={d.owner} size={20} /> {d.owner}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-l border-app-line-soft px-3 text-app-mute">{d.close}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {rows.length === 0 && <p className="px-4 py-12 text-center text-app-mute">No deals match “{q}”.</p>}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
