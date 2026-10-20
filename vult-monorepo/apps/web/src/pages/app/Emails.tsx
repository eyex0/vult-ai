import { AnimatePresence, motion } from "framer-motion";
import { FileText, Mail, PenSquare, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { recordLabel } from "@/data/selectors";
import { store, uid, useDB } from "@/data/store";
import type { Email } from "@/data/types";
import { timeAgo } from "@/lib/format";

function ComposeModal({ open, onOpenChange, draft }: { open: boolean; onOpenChange: (v: boolean) => void; draft: Email | null }) {
  const db = useDB();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ to?: string; subject?: string }>({});

  useEffect(() => {
    if (!open) return;
    setTo(draft?.to ?? "");
    setSubject(draft?.subject ?? "");
    setBody(draft?.body ?? "");
    setErrors({});
  }, [open, draft]);

  const useTemplate = (tid: string) => {
    const t = db.templates.find((x) => x.id === tid);
    if (!t) return;
    const person = db.people.find((p) => p.email === to);
    const company = person ? db.companies.find((c) => c.id === person.companyId)?.name : undefined;
    const fill = (s: string) => s.replace(/\{\{first_name\}\}/g, person?.name.split(" ")[0] ?? "there").replace(/\{\{company\}\}/g, company ?? "your team");
    setSubject(fill(t.subject));
    setBody(fill(t.body));
  };

  const save = (folder: Email["folder"]) => {
    const e: typeof errors = {};
    if (folder === "outbox" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) e.to = "Enter a valid recipient.";
    if (folder === "outbox" && !subject.trim()) e.subject = "Add a subject.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const now = new Date().toISOString();
    if (draft?.id) store.update("emails", draft.id, { to, subject, body, folder, updatedAt: now });
    else store.create("emails", { id: uid("e"), to, subject: subject || "(No subject)", body, folder, updatedAt: now });
    store.tick("email");
    toast.success(folder === "outbox" ? "Email queued in the outbox" : "Draft saved");
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={draft?.id ? "Edit draft" : "New email"}
      footer={
        <>
          <Button variant="secondary" onClick={() => save("drafts")}>
            Save draft
          </Button>
          <Button onClick={() => save("outbox")}>
            <Send className="size-3.5" /> Send
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-[1fr_220px]">
        <Field label="To" error={errors.to}>
          {(p) => <Input {...p} autoFocus type="email" list="people-emails" value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@company.com" />}
        </Field>
        <datalist id="people-emails">
          {db.people.map((p) => (
            <option key={p.id} value={p.email}>
              {p.name}
            </option>
          ))}
        </datalist>
        <Field label="Template">
          {(p) => (
            <Select {...p} defaultValue="" onChange={(e) => useTemplate(e.target.value)}>
              <option value="">Insert template…</option>
              {db.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Subject" error={errors.subject} className="sm:col-span-2">
          {(p) => <Input {...p} value={subject} onChange={(e) => setSubject(e.target.value)} />}
        </Field>
        <Field label="Message" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={9} value={body} onChange={(e) => setBody(e.target.value)} />}
        </Field>
      </div>
      <p className="mt-3 text-xs text-fg-3">Demo workspace — emails are stored locally and never sent.</p>
    </Modal>
  );
}

function EmailList({ items, onOpen }: { items: Email[]; onOpen: (e: Email) => void }) {
  const db = useDB();
  return (
    <ul className="mx-auto max-w-[920px] overflow-hidden rounded-xl border border-app-line bg-app-panel">
      <AnimatePresence initial={false}>
        {items.map((e, i) => (
          <motion.li key={e.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0 }} className="group flex items-center gap-3 border-b border-[#1a1b1d] last:border-b-0 hover:bg-[#151618]">
            <button type="button" onClick={() => onOpen(e)} className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3 text-left">
              <span className="w-[200px] shrink-0 truncate text-app-dim max-sm:hidden">{e.to || "No recipient"}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-[550] text-white">{e.subject}</span>
                <span className="truncate text-[12.5px] text-app-mute">{e.body.replace(/\n+/g, " ")}</span>
              </span>
              {e.record && <span className="hidden truncate rounded-md border border-app-line px-2 py-0.5 text-xs text-app-dim lg:inline">{recordLabel(db, e.record)}</span>}
              <span className="whitespace-nowrap text-xs text-app-mute">{timeAgo(e.updatedAt)}</span>
            </button>
            <button type="button" onClick={() => store.remove("emails", [e.id], "email")} aria-label={`Delete ${e.subject}`} className="mr-2 inline-flex size-8 items-center justify-center rounded-md text-app-mute opacity-0 transition-opacity hover:bg-app-hover hover:text-[#f59090] focus-visible:opacity-100 group-hover:opacity-100">
              <Trash2 className="size-3.5" />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export default function EmailsPage() {
  usePage({ title: "Emails", icon: Mail });
  const db = useDB();
  const search = useSearch();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("drafts");
  const [open, setOpen] = useState(new URLSearchParams(search).get("compose") === "1");
  const [draft, setDraft] = useState<Email | null>(null);

  useEffect(() => {
    if (search) navigate("/app/emails", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drafts = useMemo(() => db.emails.filter((e) => e.folder === "drafts"), [db.emails]);
  const outbox = useMemo(() => db.emails.filter((e) => e.folder === "outbox" || e.folder === "sent"), [db.emails]);
  const openEmail = (e: Email) => {
    setDraft(e);
    setOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={tab}
        onValueChange={setTab}
        listClassName="px-4 border-app-line"
        items={[
          { value: "drafts", label: "Drafts", count: drafts.length },
          { value: "outbox", label: "Outbox", count: outbox.length },
          { value: "templates", label: "Templates", count: db.templates.length },
        ]}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex items-center justify-end border-b border-app-line px-4 py-2">
          <Button
            size="sm"
            onClick={() => {
              setDraft(null);
              setOpen(true);
            }}
          >
            <PenSquare className="size-3.5" /> Compose
          </Button>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <TabPanel value="drafts">
            {drafts.length ? (
              <EmailList items={drafts} onOpen={openEmail} />
            ) : (
              <EmptyState icon={Mail} title="No drafts" action={<Button size="sm" variant="accent" onClick={() => setOpen(true)}>Compose email</Button>}>
                Write emails without leaving Vult. Drafts are saved here.
              </EmptyState>
            )}
          </TabPanel>
          <TabPanel value="outbox">
            {outbox.length ? <EmailList items={outbox} onOpen={openEmail} /> : <EmptyState icon={Send} title="Outbox is empty">Emails you send appear here.</EmptyState>}
          </TabPanel>
          <TabPanel value="templates">
            <div className="mx-auto grid max-w-[920px] gap-3 md:grid-cols-3">
              {db.templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setDraft({ id: "", folder: "drafts", to: "", subject: t.subject, body: t.body, updatedAt: "" });
                    setOpen(true);
                  }}
                  className="flex flex-col gap-2 rounded-xl border border-app-line bg-app-panel p-4 text-left transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#34363c]"
                >
                  <FileText aria-hidden className="size-4 text-app-dim" />
                  <span className="font-semibold text-white">{t.name}</span>
                  <span className="line-clamp-3 text-[12.5px] text-app-mute">{t.body}</span>
                </button>
              ))}
            </div>
          </TabPanel>
        </div>
      </Tabs>
      <ComposeModal open={open} onOpenChange={setOpen} draft={draft} />
    </div>
  );
}
