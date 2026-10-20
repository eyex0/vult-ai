import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, CheckSquare, CircleDollarSign, FileText, Plus, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Kbd } from "@/components/ui/Kbd";
import { search, type SearchHit } from "@/data/selectors";
import { useDB } from "@/data/store";
import { spring } from "@/lib/motion";
import { APP_NAV, RECORD_NAV } from "./nav";

const GROUP_ICON: Record<SearchHit["group"], typeof Building2> = {
  Companies: Building2,
  People: User,
  Deals: CircleDollarSign,
  Tasks: CheckSquare,
  Notes: FileText,
};

const itemCls =
  "flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-app-text outline-none data-[selected=true]:bg-app-hover";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const db = useDB();
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const hits = useMemo(() => search(db, q), [db, q]);
  const groups = useMemo(() => {
    const m = new Map<SearchHit["group"], SearchHit[]>();
    hits.forEach((h) => m.set(h.group, [...(m.get(h.group) ?? []), h]));
    return [...m.entries()];
  }, [hits]);

  const go = (href: string) => {
    onOpenChange(false);
    setQ("");
    navigate(href);
  };

  const pages = [...APP_NAV, ...RECORD_NAV].filter((p) => !q || p.label.toLowerCase().includes(q.toLowerCase()));
  const actions = [
    { label: "New deal", href: "/app/deals?new=1" },
    { label: "New company", href: "/app/companies?new=1" },
    { label: "New task", href: "/app/tasks?new=1" },
    { label: "New note", href: "/app/notes?new=1" },
  ].filter((a) => !q || a.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <div className="theme-dark">
              <Dialog.Overlay asChild forceMount>
                <motion.div className="fixed inset-0 z-[90] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              </Dialog.Overlay>
              <div className="pointer-events-none fixed inset-0 z-[91] flex items-start justify-center px-4 pt-[12vh]">
                <Dialog.Content asChild forceMount>
                  <motion.div
                    className="pointer-events-auto w-full max-w-[620px] overflow-hidden rounded-[14px] border border-[#2e3033] bg-[#17181a] text-app-text shadow-dark-pop"
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                    exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
                  >
                    <Dialog.Title className="sr-only">Search</Dialog.Title>
                    <Dialog.Description className="sr-only">Search records, tasks and notes, or jump to a page.</Dialog.Description>
                    <Command shouldFilter={false} loop label="Search">
                      <div className="flex h-[52px] items-center gap-2.5 border-b border-app-line px-4">
                        <Search aria-hidden className="size-4 text-app-mute" />
                        <Command.Input
                          value={q}
                          onValueChange={setQ}
                          autoFocus
                          placeholder="Search records, tasks and notes…"
                          className="h-full flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-app-mute"
                        />
                        <Kbd>Esc</Kbd>
                      </div>
                      <Command.List className="scrollbar-thin max-h-[380px] overflow-y-auto p-1.5">
                        <Command.Empty className="px-4 py-10 text-center text-app-mute">Nothing matches “{q}”.</Command.Empty>
                        {groups.map(([group, items]) => {
                          const Icon = GROUP_ICON[group];
                          return (
                            <Command.Group
                              key={group}
                              heading={group}
                              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.05em] [&_[cmdk-group-heading]]:text-app-mute"
                            >
                              {items.map((h) => (
                                <Command.Item key={h.group + h.id} value={h.group + h.id} onSelect={() => go(h.href)} className={itemCls}>
                                  <Icon aria-hidden className="size-4 text-app-mute" />
                                  <span className="min-w-0 flex-1 truncate">{h.label}</span>
                                  <span className="truncate text-xs text-app-mute">{h.meta}</span>
                                </Command.Item>
                              ))}
                            </Command.Group>
                          );
                        })}
                        {actions.length > 0 && (
                          <Command.Group
                            heading="Actions"
                            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.05em] [&_[cmdk-group-heading]]:text-app-mute"
                          >
                            {actions.map((a) => (
                              <Command.Item key={a.label} value={"action" + a.label} onSelect={() => go(a.href)} className={itemCls}>
                                <Plus aria-hidden className="size-4 text-app-mute" /> {a.label}
                              </Command.Item>
                            ))}
                          </Command.Group>
                        )}
                        {pages.length > 0 && (
                          <Command.Group
                            heading="Go to"
                            className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.05em] [&_[cmdk-group-heading]]:text-app-mute"
                          >
                            {pages.map((p) => (
                              <Command.Item key={p.href} value={"page" + p.href} onSelect={() => go(p.href)} className={itemCls}>
                                <p.icon aria-hidden className="size-4 text-app-mute" /> {p.label}
                              </Command.Item>
                            ))}
                          </Command.Group>
                        )}
                      </Command.List>
                      <div className="flex items-center gap-3 border-t border-app-line px-4 py-2 text-[11.5px] text-app-mute">
                        <span className="flex items-center gap-1">
                          <Kbd>↑</Kbd>
                          <Kbd>↓</Kbd> to move
                        </span>
                        <span className="flex items-center gap-1">
                          <Kbd>↵</Kbd> to open
                        </span>
                      </div>
                    </Command>
                  </motion.div>
                </Dialog.Content>
              </div>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
