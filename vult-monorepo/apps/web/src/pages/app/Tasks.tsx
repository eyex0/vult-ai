import { AnimatePresence, motion } from "framer-motion";
import { CheckSquare, ChevronRight, Flag, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { memberName, recordHref, recordLabel } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { RecordKind, Task } from "@/data/types";
import { relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRIORITY_COLOR: Record<Task["priority"], string> = { High: "#f59090", Medium: "#f6b67a", Low: "#8a8d96" };

function groupOf(t: Task): string {
  if (t.done) return "Completed";
  if (!t.due) return "No due date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(t.due);
  d.setHours(0, 0, 0, 0);
  if (d < today) return "Overdue";
  if (d.getTime() === today.getTime()) return "Today";
  return "Upcoming";
}
const ORDER = ["Overdue", "Today", "Upcoming", "No due date", "Completed"];

export function TaskModal({ task, open, onOpenChange }: { task: Task | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("m1");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDue(task?.due ? task.due.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setAssignee(task?.assigneeId ?? "m1");
    setPriority(task?.priority ?? "Medium");
    setLink(task?.record ? `${task.record.kind}:${task.record.id}` : "");
    setError("");
  }, [open, task]);

  const save = () => {
    if (!title.trim()) return setError("Give the task a title.");
    const [kind, rid] = link.split(":");
    const patch = {
      title: title.trim(),
      due: due ? new Date(due + "T17:00:00").toISOString() : undefined,
      assigneeId: assignee,
      priority,
      record: kind && rid ? { kind: kind as RecordKind, id: rid } : undefined,
    };
    if (task) store.update("tasks", task.id, patch);
    else store.create("tasks", { id: uid("t"), done: false, createdAt: new Date().toISOString(), ...patch });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      footer={
        <>
          {task && (
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                onOpenChange(false);
                store.remove("tasks", [task.id], "task");
              }}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{task ? "Save" : "Create task"}</Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="grid gap-3.5 sm:grid-cols-2"
      >
        <Field label="Title" error={error} className="sm:col-span-2">
          {(p) => <Input {...p} autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Follow up with…" />}
        </Field>
        <Field label="Due date">{(p) => <Input {...p} type="date" value={due} onChange={(e) => setDue(e.target.value)} className="[color-scheme:dark]" />}</Field>
        <Field label="Priority">
          {(p) => (
            <Select {...p} value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Select>
          )}
        </Field>
        <Field label="Assignee">
          {(p) => (
            <Select {...p} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {db.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Linked record">
          {(p) => (
            <Select {...p} value={link} onChange={(e) => setLink(e.target.value)}>
              <option value="">None</option>
              <optgroup label="Deals">
                {db.deals.map((d) => (
                  <option key={d.id} value={`deals:${d.id}`}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Companies">
                {db.companies.map((c) => (
                  <option key={c.id} value={`companies:${c.id}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </Select>
          )}
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

export default function TasksPage() {
  usePage({ title: "Tasks", icon: CheckSquare });
  const db = useDB();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const [scope, setScope] = useState("mine");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [open, setOpen] = useState(params.get("new") === "1");

  useEffect(() => {
    const tid = params.get("task");
    if (tid) {
      const t = db.tasks.find((x) => x.id === tid);
      if (t) {
        setEditing(t);
        setOpen(true);
      }
    }
    if (params.toString()) navigate("/app/tasks", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.tasks.filter((t) => (scope === "all" || t.assigneeId === "m1") && (!s || t.title.toLowerCase().includes(s)));
  }, [db.tasks, scope, q]);
  const groups = ORDER.map((g) => [g, list.filter((t) => groupOf(t) === g).sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))] as const).filter(([, ts]) => ts.length);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Completed: true });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-app-line px-4 py-2">
        <Tabs
          value={scope}
          onValueChange={setScope}
          variant="pill"
          items={[
            { value: "mine", label: "Assigned to me", count: db.tasks.filter((t) => t.assigneeId === "m1" && !t.done).length },
            { value: "all", label: "All tasks", count: db.tasks.filter((t) => !t.done).length },
          ]}
        />
        <label className="flex h-8 w-[220px] max-w-full items-center gap-1.5 rounded-[7px] border border-[#2e3033] bg-[#141517] px-2.5 focus-within:border-app-accent">
          <Search aria-hidden className="size-[13px] text-app-mute" />
          <span className="sr-only">Search tasks</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-app-mute" />
        </label>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-3.5" /> New task
        </Button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {groups.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks here"
            action={
              <Button size="sm" variant="accent" onClick={() => setOpen(true)}>
                <Plus className="size-3.5" /> New task
              </Button>
            }
          >
            Create a task to track your next step on a deal or account.
          </EmptyState>
        ) : (
          <div className="mx-auto flex max-w-[920px] flex-col gap-5">
            {groups.map(([g, ts]) => (
              <section key={g} aria-labelledby={`g-${g}`}>
                <button
                  type="button"
                  aria-expanded={!collapsed[g]}
                  onClick={() => setCollapsed((c) => ({ ...c, [g]: !c[g] }))}
                  className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-app-dim hover:text-white"
                >
                  <ChevronRight aria-hidden className={cn("size-3.5 transition-transform", !collapsed[g] && "rotate-90")} />
                  <span id={`g-${g}`} className={g === "Overdue" ? "text-[#f59090]" : undefined}>
                    {g}
                  </span>
                  <span className="font-normal text-app-mute">{ts.length}</span>
                </button>
                <AnimatePresence initial={false}>
                  {!collapsed[g] && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden rounded-xl border border-app-line bg-app-panel">
                      <AnimatePresence initial={false}>
                        {ts.map((t) => (
                          <motion.li key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group flex items-center gap-3 border-b border-[#1a1b1d] px-4 py-2.5 last:border-b-0 hover:bg-[#151618]">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={t.done}
                              aria-label={`${t.done ? "Mark incomplete" : "Complete"}: ${t.title}`}
                              onClick={() => store.update("tasks", t.id, { done: !t.done })}
                              className={cn("flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors", t.done ? "border-accent bg-accent" : "border-[#3a3c40] hover:border-app-accent")}
                            >
                              {t.done && (
                                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M5 12l5 5L20 7" />
                                </motion.svg>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(t);
                                setOpen(true);
                              }}
                              className="flex min-w-0 flex-1 flex-col text-left"
                            >
                              <span className={cn("truncate", t.done ? "text-app-mute line-through" : "text-app-text")}>{t.title}</span>
                            </button>
                            {t.record && (
                              <Link href={recordHref(t.record)} className="hidden max-w-[180px] truncate rounded-md border border-app-line px-2 py-0.5 text-xs text-app-dim hover:text-white sm:inline">
                                {recordLabel(db, t.record)}
                              </Link>
                            )}
                            <Flag aria-label={`${t.priority} priority`} className="size-3.5 shrink-0" style={{ color: PRIORITY_COLOR[t.priority] }} />
                            <span className={cn("w-[72px] shrink-0 text-right text-xs", g === "Overdue" ? "text-[#f59090]" : "text-app-mute")}>{relativeDay(t.due)}</span>
                            <span title={memberName(db, t.assigneeId)}>
                              <Avatar name={memberName(db, t.assigneeId)} size={22} />
                            </span>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </section>
            ))}
          </div>
        )}
      </div>
      <TaskModal task={editing} open={open} onOpenChange={setOpen} />
    </div>
  );
}
