import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Bot, CheckCheck, CornerDownLeft, Inbox as InboxIcon, UserCheck, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { usePage } from "@/components/app/PageMeta";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { recordHref } from "@/data/selectors";
import { store, useDB } from "@/data/store";
import type { InboxItem } from "@/data/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON: Record<InboxItem["kind"], typeof Bot> = { agent: Bot, mention: AtSign, assigned: UserCheck, reply: CornerDownLeft, workflow: Workflow };

export default function InboxPage() {
  usePage({ title: "Inbox", icon: InboxIcon });
  const db = useDB();
  const [tab, setTab] = useState("unread");
  const items = useMemo(() => db.inbox.filter((i) => tab === "all" || !i.read).sort((a, b) => b.at.localeCompare(a.at)), [db.inbox, tab]);
  const unread = db.inbox.filter((i) => !i.read).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-app-line px-4 py-2">
        <Tabs value={tab} onValueChange={setTab} variant="pill" items={[{ value: "unread", label: "Unread", count: unread }, { value: "all", label: "All", count: db.inbox.length }]} />
        <Button variant="ghost" size="sm" className="ml-auto border border-[#2e3033] text-app-dim" disabled={!unread} onClick={() => db.inbox.forEach((i) => !i.read && store.update("inbox", i.id, { read: true }))}>
          <CheckCheck className="size-3.5" /> Mark all read
        </Button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {items.length === 0 ? (
          <EmptyState icon={InboxIcon} title="You’re all caught up">Mentions, assignments and agent updates show up here.</EmptyState>
        ) : (
          <ul className="mx-auto max-w-[820px] overflow-hidden rounded-xl border border-app-line bg-app-panel">
            <AnimatePresence initial={false}>
              {items.map((i) => {
                const Icon = ICON[i.kind];
                const body = (
                  <>
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", i.kind === "agent" ? "bg-accent text-white" : "bg-app-hover text-app-dim")}>
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn("text-[13.5px]", i.read ? "text-app-dim" : "text-white")}>{i.text}</span>
                      <span className="text-xs text-app-mute">{timeAgo(i.at)}</span>
                    </span>
                    {!i.read && <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-app-accent" />}
                  </>
                );
                return (
                  <motion.li key={i.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="border-b border-[#1a1b1d] last:border-b-0">
                    {i.record ? (
                      <Link href={recordHref(i.record)} onClick={() => store.update("inbox", i.id, { read: true })} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#151618]">
                        {body}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => store.update("inbox", i.id, { read: true })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#151618]">
                        {body}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
