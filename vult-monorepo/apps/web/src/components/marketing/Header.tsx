import * as NM from "@radix-ui/react-navigation-menu";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PLATFORM_NAV, RESOURCES_NAV, type NavItem } from "@/content/nav";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const linkCls =
  "inline-flex h-9 items-center gap-1 rounded-btn px-3 text-[14.5px] text-ink transition-colors duration-150 hover:bg-soft-2 data-[state=open]:bg-soft-2";

function MenuItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NM.Link asChild>
      <Link href={item.href} className="group flex items-start gap-3 rounded-[10px] p-2.5 transition-colors hover:bg-soft focus-visible:bg-soft">
        <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-soft text-ink transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-110 group-hover:-rotate-6">
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-ink">{item.title}</span>
          <span className="text-[12.5px] leading-snug text-ink-2">{item.desc}</span>
        </span>
      </Link>
    </NM.Link>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <NM.Content
      className={cn(
        "absolute left-0 top-[calc(100%+8px)] w-[760px] max-w-[calc(100vw-48px)] rounded-card border border-line bg-white p-2.5 shadow-pop",
        "data-[state=open]:animate-pop",
        className,
      )}
    >
      {children}
    </NM.Content>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const session = useSession();

  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-line bg-white/85 backdrop-blur-[14px] backdrop-saturate-150">
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-7 px-5">
          <Logo />
          <NM.Root className="relative hidden flex-1 min-[960px]:block" delayDuration={80}>
            <NM.List className="flex items-center gap-0.5">
              <NM.Item className="relative">
                <NM.Trigger className={linkCls}>
                  Platform <ChevronDown aria-hidden className="size-3.5 text-muted transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </NM.Trigger>
                <Panel className="grid grid-cols-[1.4fr_1fr] gap-2.5">
                  <ul className="grid grid-cols-2 gap-0.5">
                    {PLATFORM_NAV.map((i) => (
                      <li key={i.href}>
                        <MenuItem item={i} />
                      </li>
                    ))}
                  </ul>
                  <NM.Link asChild>
                    <Link
                      href="/platform/agents"
                      className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-xl bg-night p-[18px] text-white"
                    >
                      <span aria-hidden className="absolute -right-10 -top-10 size-44 rounded-full bg-[radial-gradient(circle,rgb(59_91_253/0.55),transparent_70%)] transition-transform duration-500 group-hover:scale-125" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a3a6b0]">Featured</span>
                      <span className="relative flex flex-col gap-1.5">
                        <span className="text-lg font-semibold tracking-[-0.03em]">Vult Agents</span>
                        <span className="text-[13px] text-[#c9cbd2]">Research accounts, draft follow-ups and update records while you sell.</span>
                        <span className="text-[13px] font-[550]">Explore agents →</span>
                      </span>
                    </Link>
                  </NM.Link>
                </Panel>
              </NM.Item>
              <NM.Item className="relative">
                <NM.Trigger className={linkCls}>
                  Resources <ChevronDown aria-hidden className="size-3.5 text-muted transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </NM.Trigger>
                <Panel className="grid w-[680px] grid-cols-[1.2fr_1fr] gap-2.5">
                  <ul className="flex flex-col gap-0.5">
                    {RESOURCES_NAV.slice(0, 5).map((i) => (
                      <li key={i.title}>
                        <MenuItem item={i} />
                      </li>
                    ))}
                  </ul>
                  <NM.Link asChild>
                    <Link href="/changelog" className="flex flex-col gap-2.5 rounded-xl border border-line bg-soft p-[18px] transition-colors hover:border-line-strong">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">Changelog · Oct 14</span>
                      <span className="flex h-24 flex-col gap-1.5 rounded-[10px] border border-line bg-white p-3">
                        <span className="h-2 w-3/5 rounded bg-line" />
                        <span className="h-2 w-4/5 rounded bg-line" />
                        <span className="mt-auto h-[22px] w-2/5 rounded-md bg-accent" />
                      </span>
                      <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Kanban swimlanes and saved board views</span>
                    </Link>
                  </NM.Link>
                </Panel>
              </NM.Item>
              {[
                ["Customers", "/customers"],
                ["Pricing", "/pricing"],
                ["Changelog", "/changelog"],
              ].map(([label, href]) => (
                <NM.Item key={href}>
                  <NM.Link asChild active={location === href}>
                    <Link href={href!} className={cn(linkCls, location === href && "font-semibold")} aria-current={location === href ? "page" : undefined}>
                      {label}
                    </Link>
                  </NM.Link>
                </NM.Item>
              ))}
            </NM.List>
          </NM.Root>
          <div className="ml-auto flex items-center gap-2">
            {session ? (
              <Button href="/app/home" size="md" arrow>
                Open workspace
              </Button>
            ) : (
              <>
                <Link href="/signin" className={cn(linkCls, "hidden min-[960px]:inline-flex")}>
                  Sign in
                </Link>
                <Button href="/signup" size="md">
                  Start for free
                </Button>
              </>
            )}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-btn border border-line bg-white transition-colors hover:bg-soft min-[960px]:hidden"
            >
              <Menu className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>
      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Accordion({ title, items }: { title: string; items: NavItem[] }) {
  const [open, setOpen] = useState(title === "Platform");
  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-[52px] w-full items-center justify-between text-base font-semibold"
      >
        {title}
        {open ? <Minus className="size-4 text-subtle" /> : <Plus className="size-4 text-subtle" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {items.map((i) => (
              <li key={i.title}>
                <Link href={i.href} className="flex items-center gap-3 py-2.5 text-[15px] text-ink-2">
                  <i.icon className="size-4 text-subtle" /> {i.title}
                </Link>
              </li>
            ))}
            <li className="h-2" />
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] flex flex-col bg-white min-[960px]:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo />
            <button type="button" autoFocus aria-label="Close menu" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-btn hover:bg-soft">
              <X className="size-[18px]" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-2" aria-label="Mobile">
            <Accordion title="Platform" items={PLATFORM_NAV} />
            <Accordion title="Resources" items={RESOURCES_NAV} />
            {[
              ["Customers", "/customers"],
              ["Pricing", "/pricing"],
              ["Changelog", "/changelog"],
            ].map(([l, h]) => (
              <Link key={h} href={h!} className="flex h-[52px] items-center border-b border-line text-base font-semibold">
                {l}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
            <Button href="/signin" variant="secondary" size="lg">
              Sign in
            </Button>
            <Button href="/signup" size="lg">
              Start for free
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
