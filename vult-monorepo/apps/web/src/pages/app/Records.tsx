import { AnimatePresence, motion } from "framer-motion";
import { Download, KanbanSquare, Plus, Search, Table2, Trash2, Trophy, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Redirect, useLocation, useParams, useSearch } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { RECORD_NAV } from "@/components/app/nav";
import { cellText, columnsFor, rowsFor, KIND_CONFIG, type AnyRecord } from "@/components/records/columns";
import { KanbanBoard } from "@/components/records/KanbanBoard";
import { ImportModal, NewRecordModal } from "@/components/records/NewRecordModal";
import { RecordSlideOver } from "@/components/records/RecordPanel";
import { RecordTable, type SortState } from "@/components/records/RecordTable";
import { applyFilter, FilterButton, FilterChips, ViewSettings, type FilterRule, type ViewState } from "@/components/records/Toolbar";
import { Button } from "@/components/ui/Button";
import { OBJECT_META } from "@/data/selectors";
import { store, useDB } from "@/data/store";
import type { Deal, RecordKind } from "@/data/types";
import { readJSON, writeJSON } from "@/lib/storage";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const KINDS: RecordKind[] = ["companies", "people", "deals"];

function defaultView(kind: RecordKind): ViewState {
  const cols = columnsFor(kind);
  return { order: cols.map((c) => c.key), hidden: cols.filter((c) => !c.defaultVisible).map((c) => c.key), density: "compact" };
}

function toCSV(rows: AnyRecord[], kind: RecordKind, db: ReturnType<typeof useDB>) {
  const cols = columnsFor(kind);
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["Name", ...cols.map((c) => c.label)].map(esc).join(",");
  const body = rows.map((r) => [(r as { name: string }).name, ...cols.map((c) => cellText(c, r, db))].map(esc).join(","));
  return [head, ...body].join("\n");
}

export default function RecordsPage() {
  const { kind: rawKind, id } = useParams<{ kind: string; id?: string }>();
  const kind = rawKind as RecordKind;
  if (!KINDS.includes(kind)) return <Redirect to="/app/home" />;
  return <RecordsView key={kind} kind={kind} id={id} />;
}

function RecordsView({ kind, id }: { kind: RecordKind; id?: string }) {
  const db = useDB();
  const meta = OBJECT_META[kind];
  const nav = RECORD_NAV.find((n) => n.href === meta.href)!;
  usePage({ title: meta.plural, icon: nav.icon, iconColor: nav.color });

  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sort, setSort] = useState<SortState>(() => readJSON(`view.${kind}.sort`, { key: kind === "deals" ? "stage" : "name", dir: 1 }));
  const [view, setViewState] = useState<ViewState>(() => {
    const saved = readJSON<ViewState | null>(`view.${kind}`, null);
    const base = defaultView(kind);
    return saved && saved.order.length === base.order.length ? saved : base;
  });
  const [layout, setLayoutState] = useState<"table" | "board">(() => (kind === "deals" ? readJSON("view.deals.layout", "table") : "table"));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const [importOpen, setImportOpen] = useState(params.get("import") === "1");

  const setView = (v: ViewState) => {
    setViewState(v);
    writeJSON(`view.${kind}`, v);
  };
  const setLayout = (l: "table" | "board") => {
    setLayoutState(l);
    writeJSON("view.deals.layout", l);
  };
  const changeSort = (s: SortState) => {
    setSort(s);
    writeJSON(`view.${kind}.sort`, s);
  };

  useEffect(() => {
    if (params.get("new") || params.get("import")) navigate(meta.href, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allCols = columnsFor(kind);
  const visibleCols = view.order.filter((k) => !view.hidden.includes(k)).map((k) => allCols.find((c) => c.key === k)!).filter(Boolean);
  const valueOf = (r: AnyRecord, key: string) => (key === "name" ? (r as { name: string }).name : (allCols.find((c) => c.key === key)?.value(r, db) ?? ""));
  const textOf = (r: AnyRecord, key: string): string | number => {
    if (key === "name") return (r as { name: string }).name;
    const c = allCols.find((x) => x.key === key);
    if (!c) return "";
    return c.text ? c.text(r, db) : c.value(r, db);
  };

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = rowsFor(db, kind).filter((r) => {
      if (s && !`${(r as { name: string }).name} ${allCols.map((c) => cellText(c, r, db)).join(" ")}`.toLowerCase().includes(s)) return false;
      return filters.every((f) => applyFilter(textOf(r, f.key), f));
    });
    list = [...list].sort((a, b) => {
      const va = valueOf(a, sort.key);
      const vb = valueOf(b, sort.key);
      return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb))) * sort.dir;
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, kind, q, filters, sort]);

  const labelFor = (key: string) => (key === "name" ? KIND_CONFIG[kind].nameLabel : (allCols.find((c) => c.key === key)?.label ?? key));
  const selIds = [...selected].filter((sid) => rows.some((r) => r.id === sid));

  const exportCSV = () => {
    const blob = new Blob([toCSV(selIds.length ? rows.filter((r) => selected.has(r.id)) : rows, kind, db)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vult-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-app-line px-4 py-2.5">
        {kind === "deals" && (
          <div role="group" aria-label="Layout" className="relative flex rounded-lg border border-app-line bg-[#0d0e0f] p-0.5">
            {(
              [
                ["table", "Table", Table2],
                ["board", "Board", KanbanSquare],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                aria-pressed={layout === v}
                onClick={() => setLayout(v)}
                className={cn("relative inline-flex h-[26px] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] transition-colors", layout === v ? "text-white" : "text-app-mute hover:text-white")}
              >
                {layout === v && <motion.span layoutId="layout-pill" transition={spring} className="absolute inset-0 rounded-md bg-[#24262b]" />}
                <Icon aria-hidden className="relative size-3.5" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        )}
        <label className="flex h-8 w-[220px] max-w-full items-center gap-1.5 rounded-[7px] border border-[#2e3033] bg-[#141517] px-2.5 focus-within:border-app-accent">
          <Search aria-hidden className="size-[13px] text-app-mute" />
          <span className="sr-only">Search {meta.plural.toLowerCase()}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${meta.plural.toLowerCase()}…`} className="w-full bg-transparent text-[13px] text-app-text outline-none placeholder:text-app-mute" />
        </label>
        <FilterButton columns={allCols} nameLabel={KIND_CONFIG[kind].nameLabel} onAdd={(r) => setFilters((f) => [...f, r])} />
        <FilterChips rules={filters} labelFor={labelFor} onRemove={(rid) => setFilters((f) => f.filter((x) => x.id !== rid))} />
        <span className="ml-auto" />
        {layout === "table" && <ViewSettings columns={allCols} view={view} onChange={setView} />}
        {kind === "companies" && (
          <Button variant="ghost" size="sm" className="border border-[#2e3033] text-app-dim" onClick={() => setImportOpen(true)}>
            <Upload className="size-3.5" /> <span className="hidden sm:inline">Import</span>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="border border-[#2e3033] text-app-dim" onClick={exportCSV} aria-label="Export CSV">
          <Download className="size-3.5" /> <span className="hidden sm:inline">Export</span>
        </Button>
        <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="size-3.5" /> New {meta.singular.toLowerCase()}
        </Button>
      </div>

      <AnimatePresence>
        {selIds.length > 0 && (
          <motion.div
            role="region"
            aria-label="Bulk actions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[#2a3060] bg-[#16182a]"
          >
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-[#c9d3ff]">
              <span className="font-[550]">{selIds.length} selected</span>
              {kind === "deals" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-[#2a3060] text-app-text"
                  onClick={() => {
                    selIds.forEach((sid) => store.update("deals", sid, { stage: "Won" } as Partial<Deal>));
                    setSelected(new Set());
                  }}
                >
                  <Trophy className="size-3.5" /> Mark as Won
                </Button>
              )}
              <Button size="sm" variant="ghost" className="border border-[#2a3060] text-app-text" onClick={exportCSV}>
                <Download className="size-3.5" /> Export
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  store.remove(kind, selIds, meta.singular.toLowerCase());
                  setSelected(new Set());
                }}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto text-app-dim" onClick={() => setSelected(new Set())}>
                <X className="size-3.5" /> Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-h-0 flex-1">
        {layout === "board" && kind === "deals" ? (
          <KanbanBoard deals={rows as Deal[]} onOpen={(did) => navigate(`${meta.href}/${did}`)} />
        ) : rows.length ? (
          <RecordTable
            kind={kind}
            nameLabel={KIND_CONFIG[kind].nameLabel}
            rows={rows}
            columns={visibleCols}
            sort={sort}
            onSort={changeSort}
            selected={selected}
            onSelect={setSelected}
            onOpen={(rid) => navigate(`${meta.href}/${rid}`)}
            activeId={id}
            density={view.density}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-app-dim">No {meta.plural.toLowerCase()} match these filters.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQ("");
                setFilters([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
        <RecordSlideOver kind={kind} id={id} onClose={() => navigate(meta.href)} />
      </div>

      <NewRecordModal kind={kind} open={newOpen} onOpenChange={setNewOpen} onCreated={(nid) => navigate(`${meta.href}/${nid}`)} />
      <ImportModal open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
