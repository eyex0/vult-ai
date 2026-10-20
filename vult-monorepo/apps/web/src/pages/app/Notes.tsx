import { AnimatePresence, motion } from "framer-motion";
import { Bold, Eye, FileText, Heading2, Italic, Link2, List, ListOrdered, Pencil, Pin, Plus, Quote, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearch } from "wouter";
import { Markdown } from "@/lib/markdown";
import { usePage } from "@/components/app/PageMeta";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { recordHref, recordLabel } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { Note } from "@/data/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

type Wrap = { before: string; after?: string; line?: boolean; placeholder: string };

const TOOLS: { label: string; icon: typeof Bold; wrap: Wrap; key?: string }[] = [
  { label: "Bold", icon: Bold, wrap: { before: "**", after: "**", placeholder: "bold text" }, key: "b" },
  { label: "Italic", icon: Italic, wrap: { before: "_", after: "_", placeholder: "italic text" }, key: "i" },
  { label: "Heading", icon: Heading2, wrap: { before: "## ", line: true, placeholder: "Heading" } },
  { label: "Bulleted list", icon: List, wrap: { before: "- ", line: true, placeholder: "List item" } },
  { label: "Numbered list", icon: ListOrdered, wrap: { before: "1. ", line: true, placeholder: "List item" } },
  { label: "Quote", icon: Quote, wrap: { before: "> ", line: true, placeholder: "Quote" } },
  { label: "Link", icon: Link2, wrap: { before: "[", after: "](https://)", placeholder: "link text" }, key: "k" },
];

function Editor({ note }: { note: Note }) {
  const db = useDB();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [saved, setSaved] = useState(true);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (title === note.title && body === note.body) return;
    setSaved(false);
    const t = setTimeout(() => {
      store.update("notes", note.id, { title: title.trim() || "Untitled", body, updatedAt: new Date().toISOString() });
      setSaved(true);
    }, 400);
    return () => clearTimeout(t);
  }, [title, body, note.id, note.title, note.body]);

  const apply = (w: Wrap) => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = body.slice(s, e) || w.placeholder;
    let next: string;
    let cursorStart: number;
    if (w.line) {
      const lineStart = body.lastIndexOf("\n", s - 1) + 1;
      const lines = (body.slice(s, e) || w.placeholder).split("\n").map((l, i) => (w.before === "1. " ? `${i + 1}. ` : w.before) + l);
      const insert = lines.join("\n");
      const prefix = s === lineStart ? "" : "\n";
      next = body.slice(0, s) + prefix + insert + body.slice(e);
      cursorStart = s + prefix.length + insert.length;
      setBody(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursorStart, cursorStart);
      });
      return;
    }
    next = body.slice(0, s) + w.before + sel + (w.after ?? "") + body.slice(e);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + w.before.length, s + w.before.length + sel.length);
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-app-line px-3 py-1.5">
        <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5">
          {TOOLS.map((t) => (
            <Tooltip key={t.label} label={t.key ? `${t.label} (⌘${t.key.toUpperCase()})` : t.label} side="bottom">
              <button
                type="button"
                aria-label={t.label}
                disabled={mode === "preview"}
                onClick={() => apply(t.wrap)}
                className="inline-flex size-8 items-center justify-center rounded-md text-app-dim transition-colors hover:bg-app-hover hover:text-white disabled:opacity-30"
              >
                <t.icon className="size-4" />
              </button>
            </Tooltip>
          ))}
        </div>
        <div role="group" aria-label="Mode" className="ml-2 flex rounded-lg border border-app-line p-0.5">
          {(
            [
              ["write", Pencil],
              ["preview", Eye],
            ] as const
          ).map(([m, Icon]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] capitalize transition-colors", mode === m ? "bg-app-hover text-white" : "text-app-mute hover:text-white")}
            >
              <Icon aria-hidden className="size-3.5" /> {m}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-app-mute" aria-live="polite">
          {saved ? `Saved · ${timeAgo(note.updatedAt)}` : "Saving…"}
        </span>
        <Tooltip label={note.pinned ? "Unpin" : "Pin"} side="bottom">
          <button type="button" aria-pressed={!!note.pinned} aria-label={note.pinned ? "Unpin note" : "Pin note"} onClick={() => store.update("notes", note.id, { pinned: !note.pinned })} className={cn("inline-flex size-8 items-center justify-center rounded-md hover:bg-app-hover", note.pinned ? "text-[#f6b67a]" : "text-app-dim")}>
            <Pin className="size-4" />
          </button>
        </Tooltip>
        <Tooltip label="Delete note" side="bottom">
          <button
            type="button"
            aria-label="Delete note"
            onClick={() => {
              store.remove("notes", [note.id], "note");
              navigate("/app/notes");
            }}
            className="inline-flex size-8 items-center justify-center rounded-md text-app-dim hover:bg-app-hover hover:text-[#f59090]"
          >
            <Trash2 className="size-4" />
          </button>
        </Tooltip>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-6 py-8">
          <label htmlFor="note-title" className="sr-only">
            Title
          </label>
          <input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" className="w-full bg-transparent text-[28px] font-semibold tracking-[-0.035em] text-white outline-none placeholder:text-app-mute" />
          {note.record && (
            <Link href={recordHref(note.record)} className="mt-2 inline-flex rounded-md border border-app-line px-2 py-0.5 text-xs text-app-dim hover:text-white">
              {recordLabel(db, note.record)}
            </Link>
          )}
          <div className="mt-6">
            {mode === "write" ? (
              <>
                <label htmlFor="note-body" className="sr-only">
                  Note body (Markdown)
                </label>
                <textarea
                  id="note-body"
                  ref={ta}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (!(e.metaKey || e.ctrlKey)) return;
                    const tool = TOOLS.find((t) => t.key === e.key.toLowerCase());
                    if (tool) {
                      e.preventDefault();
                      apply(tool.wrap);
                    }
                  }}
                  placeholder="Start writing… Markdown is supported."
                  className="min-h-[50vh] w-full resize-none bg-transparent text-[15px] leading-[1.7] text-app-text outline-none placeholder:text-app-mute"
                />
              </>
            ) : (
              <div className="prose-note min-h-[50vh] text-[15px] leading-[1.7] text-app-text [&_a]:text-[#9daeff] [&_blockquote]:border-l-2 [&_blockquote]:border-[#3a3c40] [&_blockquote]:pl-3 [&_blockquote]:text-app-dim [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_strong]:text-white [&_ul]:ml-5 [&_ul]:list-disc">
                <Markdown>{body || "_Nothing to preview yet._"}</Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  usePage({ title: "Notes", icon: FileText });
  const db = useDB();
  const { id } = useParams<{ id?: string }>();
  const search = useSearch();
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");

  const create = () => {
    const now = new Date().toISOString();
    const n: Note = { id: uid("n"), title: "Untitled", body: "", authorId: "m1", createdAt: now, updatedAt: now };
    store.create("notes", n);
    navigate(`/app/notes/${n.id}`);
  };

  useEffect(() => {
    if (new URLSearchParams(search).get("new") === "1") create();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notes = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.notes
      .filter((n) => !s || `${n.title} ${n.body}`.toLowerCase().includes(s))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [db.notes, q]);
  const current = db.notes.find((n) => n.id === id);

  return (
    <div className="flex h-full">
      <aside aria-label="Notes" className={cn("flex w-full shrink-0 flex-col border-r border-app-line md:w-[320px]", id && "hidden md:flex")}>
        <div className="flex items-center gap-2 border-b border-app-line px-3 py-2">
          <label className="flex h-8 flex-1 items-center gap-1.5 rounded-[7px] border border-[#2e3033] bg-[#141517] px-2.5 focus-within:border-app-accent">
            <Search aria-hidden className="size-[13px] text-app-mute" />
            <span className="sr-only">Search notes</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-app-mute" />
          </label>
          <Button size="icon-sm" onClick={create} aria-label="New note">
            <Plus className="size-4" />
          </Button>
        </div>
        <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
          <AnimatePresence initial={false}>
            {notes.map((n) => (
              <motion.li key={n.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Link
                  href={`/app/notes/${n.id}`}
                  aria-current={n.id === id ? "page" : undefined}
                  className={cn("mb-0.5 flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors", n.id === id ? "bg-app-hover" : "hover:bg-[#151618]")}
                >
                  <span className="flex items-center gap-1.5 truncate font-[550] text-white">
                    {n.pinned && <Pin aria-label="Pinned" className="size-3 shrink-0 text-[#f6b67a]" />}
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </span>
                  <span className="line-clamp-2 text-[12.5px] text-app-mute">{n.body.replace(/[#*_>[\]()-]/g, "").slice(0, 120) || "Empty note"}</span>
                  <span className="text-[11.5px] text-app-mute">{timeAgo(n.updatedAt)}</span>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
          {notes.length === 0 && <li className="px-3 py-8 text-center text-app-mute">No notes found.</li>}
        </ul>
      </aside>
      <section className={cn("min-w-0 flex-1", !id && "hidden md:block")}>
        {current ? (
          <Editor key={current.id} note={current} />
        ) : (
          <EmptyState
            icon={FileText}
            title={id ? "Note not found" : "Select a note"}
            action={
              <Button size="sm" variant="accent" onClick={create}>
                <Plus className="size-3.5" /> New note
              </Button>
            }
          >
            Capture call notes, plans and ideas. Notes support Markdown formatting.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
