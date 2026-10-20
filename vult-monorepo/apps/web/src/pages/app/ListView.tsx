import { List } from "lucide-react";
import { useMemo, useState } from "react";
import { Redirect, useLocation, useParams } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { columnsFor } from "@/components/records/columns";
import { RecordTable, type SortState } from "@/components/records/RecordTable";
import { OBJECT_META } from "@/data/selectors";
import { useDB } from "@/data/store";
import type { Company, Deal } from "@/data/types";

export default function ListPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const list = db.lists.find((l) => l.id === id);
  usePage({ title: list?.name ?? "List", icon: List, iconColor: list?.color });
  const [, navigate] = useLocation();
  const [sort, setSort] = useState<SortState>({ key: "name", dir: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rows = useMemo(() => {
    if (!list) return [];
    const src = (db[list.kind] as (Company | Deal)[]).filter((r) => list.recordIds.includes(r.id));
    return [...src].sort((a, b) => a.name.localeCompare(b.name) * sort.dir);
  }, [db, list, sort]);
  if (!list) return <Redirect to="/app/home" />;
  const cols = columnsFor(list.kind).filter((c) => c.defaultVisible);
  return (
    <div className="flex h-full flex-col">
      <p className="border-b border-app-line px-4 py-2.5 text-[13px] text-app-mute">
        {rows.length} {OBJECT_META[list.kind].plural.toLowerCase()} in this list
      </p>
      <div className="min-h-0 flex-1">
        <RecordTable kind={list.kind} nameLabel={OBJECT_META[list.kind].singular} rows={rows} columns={cols} sort={sort} onSort={setSort} selected={selected} onSelect={setSelected} onOpen={(rid) => navigate(`${OBJECT_META[list.kind].href}/${rid}`)} density="compact" />
      </div>
    </div>
  );
}
