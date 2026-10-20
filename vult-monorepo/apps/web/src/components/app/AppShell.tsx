import * as Popover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronDown, ChevronRight, CircleHelp, Hash, LogOut, Menu, PanelLeft, RotateCcw, Search, Settings, Sparkles, UserPlus, X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { DropdownContent, DropdownItem, DropdownLabel, DropdownRoot, DropdownSeparator, DropdownTrigger } from "@/components/ui/Dropdown";
import { Field, Input, Select } from "@/components/ui/Field";
import { Kbd } from "@/components/ui/Kbd";
import { Modal } from "@/components/ui/Modal";
import { ThemeScope, useThemeClass } from "@/components/ui/ThemeScope";
import { Tooltip } from "@/components/ui/Tooltip";
import { store, uid, useDB } from "@/data/store";
import type { ChecklistKey } from "@/data/types";
import { signOut, useSession } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AskVultPanel } from "./AskVult";
import { CommandPalette } from "./CommandPalette";
import { APP_NAV, RECORD_NAV } from "./nav";
import { PageMetaProvider, usePageMetaValue } from "./PageMeta";
import { toast } from "sonner";

const CHECKLIST: { key: ChecklistKey; label: string; href: string }[] = [
  { key: "import", label: "Import your contacts", href: "/app/companies?import=1" },
  { key: "invite", label: "Invite a teammate", href: "/app/settings/members" },
  { key: "deal", label: "Create your first deal", href: "/app/deals?new=1" },
  { key: "workflow", label: "Publish a workflow", href: "/app/workflows" },
  { key: "report", label: "Open a dashboard", href: "/app/reports" },
  { key: "email", label: "Draft an email", href: "/app/emails?compose=1" },
];

function useIsActive() {
  const [loc] = useLocation();
  return (href: string) => loc === href || loc.startsWith(href + "/");
}

function NavLink({ href, label, icon, collapsed, badge, onNavigate }: { href: string; label: string; icon: ReactNode; collapsed: boolean; badge?: number; onNavigate?: () => void }) {
  const isActive = useIsActive()(href);
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "relative flex h-[30px] items-center gap-[9px] whitespace-nowrap rounded-[7px] px-2 text-[13.5px] transition-colors",
        isActive ? "text-white" : "text-app-dim hover:bg-[#17181a] hover:text-white",
        collapsed && "justify-center px-0",
      )}
    >
      {isActive && <motion.span layoutId="sidebar-active" transition={spring} className="absolute inset-0 rounded-[7px] bg-app-hover" />}
      <span className="relative flex shrink-0 items-center">{icon}</span>
      {!collapsed && <span className="relative min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && badge ? <span className="relative rounded-[5px] bg-[#1e1f22] px-1.5 text-[11px] text-app-dim">{badge}</span> : null}
    </Link>
  );
  return collapsed ? <Tooltip label={label}>{link}</Tooltip> : link;
}

function SectionToggle({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className="group mt-3.5 flex h-6 items-center gap-1 rounded px-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-app-mute hover:text-app-dim"
    >
      <ChevronRight aria-hidden className={cn("size-3 transition-transform", open && "rotate-90")} />
      {title}
    </button>
  );
}

function GettingStarted() {
  const db = useDB();
  const done = Object.values(db.workspace.checklist).filter(Boolean).length;
  const theme = useThemeClass();
  return (
    <Popover.Root>
      <Popover.Trigger className="flex w-full flex-col gap-2 rounded-[10px] border border-app-line bg-[#111214] px-3 py-2.5 text-left transition-colors hover:bg-[#151618]">
        <span className="flex justify-between text-[13px] font-[550] text-white">
          Getting started <span className="font-normal text-app-mute">{done}/6</span>
        </span>
        <span className="h-1 overflow-hidden rounded-sm bg-app-line">
          <motion.span className="block h-full bg-accent" initial={false} animate={{ width: `${Math.max(4, (done / 6) * 100)}%` }} transition={spring} />
        </span>
        <span className="text-xs text-app-mute">{done === 6 ? "All done — nice work!" : `Next: ${CHECKLIST.find((c) => !db.workspace.checklist[c.key])?.label.toLowerCase()}`}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <div className={theme}>
          <Popover.Content side="right" align="end" sideOffset={10} collisionPadding={12} className="z-[95] w-[280px] animate-pop rounded-xl border border-[#2e3033] bg-pop p-2 text-fg shadow-dark-pop">
            <p className="px-2 pb-1.5 pt-1 text-[13px] font-semibold">Set up your workspace</p>
            <ul>
              {CHECKLIST.map((c) => {
                const ok = db.workspace.checklist[c.key];
                return (
                  <li key={c.key}>
                    <Popover.Close asChild>
                      <Link href={c.href} className="flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] transition-colors hover:bg-surface-hover">
                        <span className={cn("flex size-[18px] items-center justify-center rounded-full border-[1.5px]", ok ? "border-accent bg-accent" : "border-[#3a3c40]")}>
                          {ok && <Check className="size-3 text-white" strokeWidth={3} />}
                        </span>
                        <span className={cn(ok && "text-fg-3 line-through")}>{c.label}</span>
                      </Link>
                    </Popover.Close>
                  </li>
                );
              })}
            </ul>
          </Popover.Content>
        </div>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function InviteModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [error, setError] = useState("");
  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    const name = email.split("@")[0]!.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    store.create("members", { id: uid("m"), name, email, role: role as "Member", title: "Invited" });
    store.tick("invite");
    toast.success(`Invitation sent to ${email}`);
    setEmail("");
    setError("");
    onOpenChange(false);
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Invite members"
      description="They’ll get access to the Ridgeway Labs workspace."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Send invite</Button>
        </>
      }
    >
      <form
        className="grid gap-3.5 sm:grid-cols-[1fr_140px]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Email" error={error}>
          {(p) => <Input {...p} autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />}
        </Field>
        <Field label="Role">
          {(p) => (
            <Select {...p} value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Admin</option>
              <option>Member</option>
              <option>Guest</option>
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  );
}

function Sidebar({
  collapsed,
  setCollapsed,
  onSearch,
  onNavigate,
  mobile,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onSearch: () => void;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const db = useDB();
  const session = useSession();
  const [, navigate] = useLocation();
  const [sections, setSections] = useState(() => readJSON("sidebar.sections", { records: true, lists: true, chats: true }));
  const [invite, setInvite] = useState(false);
  const unread = db.inbox.filter((i) => !i.read).length;
  const trialDays = Math.max(0, Math.ceil((new Date(db.workspace.trialEndsAt).getTime() - Date.now()) / 86400000));
  const toggle = (k: keyof typeof sections) => {
    const next = { ...sections, [k]: !sections[k] };
    setSections(next);
    writeJSON("sidebar.sections", next);
  };

  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-app-line bg-app-side transition-[width] duration-200 ease-[var(--ease-out-expo)]",
        collapsed ? "w-16" : "w-[274px]",
      )}
    >
      <div className={cn("flex h-[49px] shrink-0 items-center gap-1 border-b border-app-line-soft", collapsed ? "justify-center px-2" : "px-2.5")}>
        <DropdownRoot>
          <DropdownTrigger
            aria-label="Workspace menu"
            className={cn("flex h-[34px] min-w-0 items-center gap-2 rounded-[7px] px-1.5 text-left text-white transition-colors hover:bg-[#17181a]", !collapsed && "flex-1")}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[#2a2c31] bg-black">
              <LogoMark tone="light" size={18} />
            </span>
            {!collapsed && (
              <>
                <span className="truncate text-[13.5px] font-semibold">{db.workspace.name}</span>
                <ChevronDown aria-hidden className="size-3 shrink-0 text-app-mute" />
              </>
            )}
          </DropdownTrigger>
          <DropdownContent className="w-[240px]">
            <DropdownLabel>{session?.email ?? "Workspace"}</DropdownLabel>
            <DropdownItem onSelect={() => navigate("/app/settings/workspace")}>
              <Settings /> Workspace settings
            </DropdownItem>
            <DropdownItem onSelect={() => setInvite(true)}>
              <UserPlus /> Invite members
            </DropdownItem>
            <DropdownItem onSelect={() => store.reset()}>
              <RotateCcw /> Reset demo data
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              onSelect={() => {
                signOut();
                navigate("/");
              }}
            >
              <LogOut /> Sign out
            </DropdownItem>
          </DropdownContent>
        </DropdownRoot>
        {!collapsed && !mobile && (
          <Tooltip label="Collapse sidebar">
            <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-app-mute hover:bg-[#17181a] hover:text-white">
              <PanelLeft className="size-[15px]" />
            </button>
          </Tooltip>
        )}
        {mobile && (
          <button type="button" onClick={onNavigate} aria-label="Close navigation" className="inline-flex size-8 items-center justify-center rounded-md text-app-dim hover:bg-[#17181a]">
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-px overflow-y-auto overflow-x-hidden p-2.5" aria-label="Main">
        {collapsed ? (
          <Tooltip label="Expand sidebar">
            <button type="button" onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="mb-1 flex h-8 items-center justify-center rounded-[7px] text-app-mute hover:bg-[#17181a] hover:text-white">
              <PanelLeft className="size-[15px]" />
            </button>
          </Tooltip>
        ) : null}
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search (Command K)"
          className={cn(
            "mb-2 flex h-8 shrink-0 items-center gap-2 rounded-[7px] border border-app-line bg-[#111214] px-2 text-left text-[13px] text-app-mute transition-colors hover:bg-[#151618] hover:text-app-dim",
            collapsed && "justify-center",
          )}
        >
          <Search aria-hidden className="size-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Search</span>
              <Kbd className="border-[#2e3033] text-app-dim">⌘K</Kbd>
            </>
          )}
        </button>
        {APP_NAV.map((n) => (
          <NavLink key={n.href} href={n.href} label={n.label} collapsed={collapsed} onNavigate={onNavigate} badge={n.label === "Inbox" ? unread : undefined} icon={<n.icon className="size-[15px]" strokeWidth={1.8} />} />
        ))}

        {!collapsed && <SectionToggle title="Records" open={sections.records} onToggle={() => toggle("records")} />}
        {collapsed && <span aria-hidden className="mx-1 my-2.5 h-px bg-app-line-soft" />}
        <AnimatePresence initial={false}>
          {(collapsed || sections.records) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-px overflow-hidden">
              {RECORD_NAV.map((n) => (
                <NavLink key={n.href} href={n.href} label={n.label} collapsed={collapsed} onNavigate={onNavigate} icon={<n.icon className="size-[15px]" style={{ color: n.color }} strokeWidth={1.8} />} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <>
            <SectionToggle title="Lists" open={sections.lists} onToggle={() => toggle("lists")} />
            <AnimatePresence initial={false}>
              {sections.lists && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-px overflow-hidden">
                  {db.lists.map((l) => (
                    <NavLink key={l.id} href={`/app/lists/${l.id}`} label={l.name} collapsed={false} onNavigate={onNavigate} icon={<span className="size-[11px] rounded-full" style={{ background: l.color }} />} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <SectionToggle title="Chats" open={sections.chats} onToggle={() => toggle("chats")} />
            <AnimatePresence initial={false}>
              {sections.chats && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-px overflow-hidden">
                  {db.chats.map((c) => (
                    <NavLink key={c.id} href={`/app/chats/${c.id}`} label={c.title} collapsed={false} onNavigate={onNavigate} icon={<Hash className="size-[15px]" strokeWidth={1.8} />} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </nav>

      {!collapsed && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-app-line-soft p-2.5">
          <GettingStarted />
          <button
            type="button"
            onClick={() => setInvite(true)}
            className="flex h-8 items-center gap-2 rounded-[7px] border border-app-line px-2.5 text-[13px] text-app-text transition-colors hover:bg-[#1a1b1e]"
          >
            <UserPlus aria-hidden className="size-3.5" /> Invite members
          </button>
          <div className="flex flex-col gap-1.5 rounded-[10px] border border-[rgb(59_91_253/0.3)] bg-[linear-gradient(180deg,rgb(59_91_253/0.18),rgb(59_91_253/0.06))] px-3 py-2.5 text-[12.5px]">
            <span className="font-[550] text-white">{trialDays} days left in your Pro trial</span>
            <Link href="/app/settings/billing" onClick={onNavigate} className="font-[550] text-[#9daeff] hover:text-white">
              Choose a plan →
            </Link>
          </div>
        </div>
      )}
      <InviteModal open={invite} onOpenChange={setInvite} />
    </aside>
  );
}

function TopBar({ onMenu, onAsk }: { onMenu: () => void; onAsk: () => void }) {
  const meta = usePageMetaValue();
  const Icon = meta.icon;
  return (
    <header className="flex h-[49px] shrink-0 items-center gap-2.5 border-b border-app-line px-3.5 sm:pl-4">
      <button type="button" onClick={onMenu} aria-label="Open navigation" className="inline-flex size-8 items-center justify-center rounded-[7px] border border-app-line text-app-text hover:bg-app-hover min-[900px]:hidden">
        <Menu className="size-4" />
      </button>
      {meta.parent && (
        <>
          <Link href={meta.parent.href} className="hidden text-[13px] text-app-mute hover:text-white sm:inline">
            {meta.parent.label}
          </Link>
          <span aria-hidden className="hidden text-[#4a4c52] sm:inline">
            /
          </span>
        </>
      )}
      {Icon && <Icon aria-hidden className="size-4 shrink-0" style={{ color: meta.iconColor ?? "#a9acb6" }} strokeWidth={1.8} />}
      <h1 className="min-w-0 truncate text-sm font-semibold text-white">{meta.title}</h1>
      <span className="ml-auto" />
      <Button href="/contact" variant="ghost" size="sm" className="hidden text-app-dim sm:inline-flex">
        <CircleHelp className="size-3.5" /> Help
      </Button>
      <Button variant="accent" size="sm" onClick={onAsk}>
        <Sparkles className="size-3.5" /> Ask Vult
      </Button>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(() => readJSON("sidebar.collapsed", false));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [ask, setAsk] = useState(false);
  const [location] = useLocation();

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    writeJSON("sidebar.collapsed", v);
  };

  useEffect(() => setMobileOpen(false), [location]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searchHandler = useMemo(() => () => setPalette(true), []);

  return (
    <ThemeScope theme="dark">
      <PageMetaProvider>
        <div className="theme-dark flex h-dvh overflow-hidden bg-app font-sans text-[13.5px] text-app-text">
          <a href="#app-main" className="sr-only-focusable fixed left-3 top-3 z-[100] rounded-md bg-white px-3 py-2 text-sm text-ink">
            Skip to content
          </a>
          <div className="hidden h-full min-[900px]:block">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onSearch={searchHandler} />
          </div>
          <AnimatePresence>
            {mobileOpen && (
              <div className="fixed inset-0 z-[80] min-[900px]:hidden">
                <motion.div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Navigation"
                  className="absolute inset-y-0 left-0"
                  initial={{ x: -280 }}
                  animate={{ x: 0, transition: spring }}
                  exit={{ x: -280, transition: { duration: 0.18 } }}
                >
                  <Sidebar collapsed={false} setCollapsed={() => {}} onSearch={searchHandler} onNavigate={() => setMobileOpen(false)} mobile />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar onMenu={() => setMobileOpen(true)} onAsk={() => setAsk(true)} />
            <main id="app-main" className="relative min-h-0 flex-1 overflow-hidden">
              {children}
            </main>
          </div>
          <CommandPalette open={palette} onOpenChange={setPalette} />
          <AskVultPanel open={ask} onClose={() => setAsk(false)} />
        </div>
      </PageMetaProvider>
    </ThemeScope>
  );
}
