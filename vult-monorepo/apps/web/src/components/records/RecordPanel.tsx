import { AnimatePresence, motion } from "framer-motion";
import { Building2, CalendarDays, Check, FileText, Mail, MoreHorizontal, Phone, Plus, Sparkles, Trash2, TrendingUp, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DropdownContent, DropdownItem, DropdownRoot, DropdownTrigger } from "@/components/ui/Dropdown";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { OBJECT_META, STAGE_TONE, memberName } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { Activity, Company, Deal, Person, RecordKind } from "@/data/types";
import { formatDate, formatMoney, relativeDay, timeAgo } from "@/lib/format";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CellEditor } from "./CellEditor";
import { columnsFor, recordSubtitle, type AnyRecord } from "./columns";

const ACTIVITY_ICON: Record<Activity["kind"], typeof Mail> = {
  email: Mail, meeting: CalendarDays, call: Phone, stage: TrendingUp, note: FileText, enrich: Sparkles, created: Plus, task: Check,
};

export function RecordPanel({ kind, id, onClose }: { kind: RecordKind; id: string; onClose: () => void }) {
  const db = useDB();
  const record = (db[kind] as AnyRecord[]).find((r) => r.id === id);
  const [tab, setTab] = useState("activity");
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editing && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, editing]);

  const ref = useMemo(() => ({ kind, id }), [kind, id]);
  const activity = useMemo(() => db.activities.filter((a) => a.record.kind === kind && a.record.id === id).sort((a, b) => b.at.localeCompare(a.at)), [db.activities, kind, id]);
  const notes = db.notes.filter((n) => n.record?.kind === kind && n.record.id === id);
  const tasks = db.tasks.filter((t) => t.record?.kind === kind && t.record.id === id);

  if (!record) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-app-mute">
        This record no longer exists.
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const name = (record as { name: string }).name;
  const cols = columnsFor(kind).filter((c) => c.edit || c.key === "lastInteraction");

  const addNote = (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    const now = new Date().toISOString();
    store.create("notes", { id: uid("n"), title: note.trim().split("\n")[0]!.slice(0, 60), body: note.trim(), record: ref, authorId: "m1", createdAt: now, updatedAt: now });
    store.log(ref, "note", "Note added");
    setNote("");
  };
  const addTask = (e: FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    store.create("tasks", { id: uid("t"), title: task.trim(), assigneeId: "m1", done: false, priority: "Medium", record: ref, due: new Date(Date.now() + 2 * 86400000).toISOString(), createdAt: new Date().toISOString() });
    setTask("");
  };

  const related =
    kind === "companies"
      ? {
          people: db.people.filter((p) => p.companyId === id),
          deals: db.deals.filter((d) => d.companyId === id),
        }
      : kind === "people"
        ? { company: db.companies.find((c) => c.id === (record as Person).companyId), deals: db.deals.filter((d) => d.contactId === id) }
        : { company: db.companies.find((c) => c.id === (record as Deal).companyId), contact: db.people.find((p) => p.id === (record as Deal).contactId) };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-3 border-b border-app-line px-5 py-4">
        <Avatar name={name} square={kind !== "people"} size={38} />
        <div className="min-w-0 flex-1">
          {editing === "name" ? (
            <div className="h-8">
              <CellEditor
                kind="text"
                label="Name"
                initial={name}
                onCommit={(v) => {
                  if (v.trim()) store.update(kind, id, { name: v.trim() } as never);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          ) : (
            <h2 className="truncate text-base font-semibold text-white">
              <button type="button" onClick={() => setEditing("name")} className="max-w-full truncate rounded px-0.5 text-left hover:bg-app-hover" aria-label={`Rename ${name}`}>
                {name}
              </button>
            </h2>
          )}
          <p className="mt-0.5 truncate text-[13px] text-app-mute">{recordSubtitle(db, kind, record)}</p>
        </div>
        <DropdownRoot>
          <DropdownTrigger aria-label="Record actions" className="inline-flex size-8 items-center justify-center rounded-[7px] text-app-dim hover:bg-app-hover hover:text-white">
            <MoreHorizontal className="size-4" />
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem onSelect={() => navigator.clipboard?.writeText(window.location.href)}>
              <FileText /> Copy link
            </DropdownItem>
            <DropdownItem
              danger
              onSelect={() => {
                onClose();
                store.remove(kind, [id], OBJECT_META[kind].singular.toLowerCase());
              }}
            >
              <Trash2 /> Delete {OBJECT_META[kind].singular.toLowerCase()}
            </DropdownItem>
          </DropdownContent>
        </DropdownRoot>
        <button type="button" onClick={onClose} aria-label="Close record" className="inline-flex size-8 items-center justify-center rounded-[7px] text-app-dim hover:bg-app-hover hover:text-white">
          <X className="size-4" />
        </button>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <dl className="grid grid-cols-[120px_1fr] border-b border-app-line px-3 py-2">
          {cols.map((c) => (
            <div key={c.key} className="contents">
              <dt className="flex h-9 items-center px-2 text-[12.5px] text-app-mute">{c.label}</dt>
              <dd className="h-9 min-w-0">
                {editing === c.key && c.edit ? (
                  <CellEditor
                    kind={c.edit.kind}
                    options={c.edit.options}
                    initial={c.edit.raw(record)}
                    label={c.label}
                    onCommit={(v) => {
                      store.update(kind, id, c.edit!.patch(v) as never);
                      if (kind === "deals" && c.key === "stage") store.log(ref, "stage", `Stage changed to ${v}`);
                      setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                ) : c.edit ? (
                  <button
                    type="button"
                    onClick={() => setEditing(c.key)}
                    aria-label={`Edit ${c.label}`}
                    className="flex h-full w-full items-center truncate rounded-md px-2 text-left text-app-text transition-colors hover:bg-app-hover"
                  >
                    {c.render(record, db)}
                  </button>
                ) : (
                  <span className="flex h-full items-center px-2">{c.render(record, db)}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-b border-app-line px-5 py-3.5">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-app-mute">Related</h3>
          <ul className="flex flex-col gap-1">
            {"company" in related && related.company && (
              <li>
                <Link href={`/app/companies/${related.company.id}`} className="flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-app-hover">
                  <Building2 aria-hidden className="size-3.5 text-[#6f87ff]" /> {(related.company as Company).name}
                </Link>
              </li>
            )}
            {"contact" in related && related.contact && (
              <li>
                <Link href={`/app/people/${related.contact.id}`} className="flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-app-hover">
                  <UserPlus aria-hidden className="size-3.5 text-[#3ddc84]" /> {related.contact.name}
                </Link>
              </li>
            )}
            {"people" in related &&
              (related.people ?? []).slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link href={`/app/people/${p.id}`} className="flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-app-hover">
                    <Avatar name={p.name} size={18} /> {p.name} <span className="truncate text-xs text-app-mute">{p.title}</span>
                  </Link>
                </li>
              ))}
            {"deals" in related &&
              (related.deals ?? []).map((d) => (
                <li key={d.id}>
                  <Link href={`/app/deals/${d.id}`} className="flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-app-hover">
                    <Badge dark dot tone={STAGE_TONE[d.stage]}>
                      {d.stage}
                    </Badge>
                    <span className="truncate">{d.name}</span>
                    <span className="tabular ml-auto text-xs text-app-mute">{formatMoney(d.value)}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <Tabs
          value={tab}
          onValueChange={setTab}
          listClassName="px-3"
          items={[
            { value: "activity", label: "Activity", count: activity.length },
            { value: "notes", label: "Notes", count: notes.length },
            { value: "tasks", label: "Tasks", count: tasks.length },
          ]}
        >
          <TabPanel value="activity" className="px-5 py-4">
            <ol className="relative ml-1.5 flex flex-col gap-4 border-l border-[#2a2b2e]">
              {activity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.kind];
                return (
                  <motion.li key={a.id} className="relative pl-5" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                    <span className="absolute -left-[11px] top-0 flex size-[21px] items-center justify-center rounded-full border border-[#2a2b2e] bg-app-panel">
                      <Icon aria-hidden className="size-3 text-app-dim" />
                    </span>
                    <p className="text-[13px] text-app-text">{a.text}</p>
                    <p className="text-xs text-app-mute">
                      {timeAgo(a.at)}
                      {a.actorId ? ` · ${memberName(db, a.actorId)}` : ""}
                    </p>
                  </motion.li>
                );
              })}
              {activity.length === 0 && <li className="pl-5 text-app-mute">No activity yet.</li>}
            </ol>
          </TabPanel>
          <TabPanel value="notes" className="flex flex-col gap-3 px-5 py-4">
            <form onSubmit={addNote} className="flex flex-col gap-2">
              <label htmlFor="panel-note" className="sr-only">
                New note
              </label>
              <textarea
                id="panel-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a note…"
                className="w-full resize-y rounded-lg border border-[#2e3033] bg-app-input px-3 py-2 text-[13px] text-white outline-none placeholder:text-app-mute focus:border-app-accent"
              />
              <Button type="submit" size="sm" variant="accent" className="self-end" disabled={!note.trim()}>
                Save note
              </Button>
            </form>
            <AnimatePresence initial={false}>
              {notes.map((n) => (
                <motion.div key={n.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-app-line p-3">
                  <Link href={`/app/notes/${n.id}`} className="text-[13px] font-semibold text-white hover:underline">
                    {n.title}
                  </Link>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-[13px] text-app-dim">{n.body.replace(/[#*_]/g, "")}</p>
                  <p className="mt-1.5 text-xs text-app-mute">{timeAgo(n.updatedAt)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabPanel>
          <TabPanel value="tasks" className="flex flex-col gap-2 px-5 py-4">
            <form onSubmit={addTask} className="flex gap-2">
              <label htmlFor="panel-task" className="sr-only">
                New task
              </label>
              <input
                id="panel-task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Add a task…"
                className="h-8 flex-1 rounded-[7px] border border-[#2e3033] bg-app-input px-2.5 text-[13px] text-white outline-none placeholder:text-app-mute focus:border-app-accent"
              />
              <Button type="submit" size="sm" variant="accent" disabled={!task.trim()}>
                Add
              </Button>
            </form>
            <ul className="flex flex-col gap-1.5">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2.5 rounded-lg border border-app-line px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Complete ${t.title}`}
                    checked={t.done}
                    onChange={() => store.update("tasks", t.id, { done: !t.done })}
                    className="size-[15px] cursor-pointer accent-accent"
                  />
                  <span className={cn("flex-1 text-[13px]", t.done && "text-app-mute line-through")}>{t.title}</span>
                  <span className="text-xs text-app-mute">{relativeDay(t.due)}</span>
                </li>
              ))}
              {tasks.length === 0 && <li className="text-[13px] text-app-mute">No tasks for this record.</li>}
            </ul>
          </TabPanel>
        </Tabs>
        <p className="px-5 pb-5 pt-2 text-xs text-app-mute">Created {formatDate((record as { createdAt: string }).createdAt, { month: "short", day: "numeric", year: "numeric" })}</p>
      </div>
    </div>
  );
}

/** Slide-over wrapper for the panel. */
export function RecordSlideOver({ kind, id, onClose }: { kind: RecordKind; id: string | undefined; onClose: () => void }) {
  return (
    <AnimatePresence>
      {id && (
        <motion.aside
          key="panel"
          role="dialog"
          aria-label="Record details"
          className="absolute inset-y-0 right-0 z-40 w-full max-w-[460px] border-l border-[#2a2b2e] bg-app-panel shadow-[-24px_0_60px_-20px_rgb(0_0_0/0.7)]"
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: spring }}
          exit={{ x: 60, opacity: 0, transition: { duration: 0.16 } }}
        >
          <RecordPanel key={id} kind={kind} id={id} onClose={onClose} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

