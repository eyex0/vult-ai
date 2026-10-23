import * as NM from "@radix-ui/react-navigation-menu";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Menu, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { PLATFORM_GROUPS, RESOURCES_GROUPS, type NavGroup, type NavItem } from "@/content/nav";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const linkCls =
  "inline-flex h-9 items-center gap-1 rounded-[10px] px-3 text-[15px] font-medium text-[#2b2e35] transition-colors duration-150 hover:bg-soft-2 data-[state=open]:bg-soft-2";

function MenuItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NM.Link asChild>
      <Link href={item.href} className="group flex items-start gap-3 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-soft-2 focus-visible:bg-soft-2">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink shadow-[0_1px_2px_rgb(16_17_26/0.06)] transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-105">
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <span className="flex flex-col">
          <span className="text-[14px] font-semibold text-ink">{item.title}</span>
          <span className="text-[13px] leading-snug text-subtle">{item.desc}</span>
        </span>
      </Link>
    </NM.Link>
  );
}

function GroupPanel({ groups, feature }: { groups: NavGroup[]; feature: React.ReactNode }) {
  return (
    <NM.Content className="nav-content absolute left-0 top-0 flex w-[min(1000px,calc(100vw-232px))] gap-2 p-2">
      <div className="grid flex-1 grid-cols-3 gap-1 p-1">
        {groups.map((g) => (
          <div key={g.title} className="flex flex-col gap-0.5">
            <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-subtle">{g.title}</p>
            {g.items.map((i) => (
              <MenuItem key={i.title} item={i} />
            ))}
          </div>
        ))}
      </div>
      <div className="w-[240px] shrink-0">{feature}</div>
    </NM.Content>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const session = useSession();

  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <header className={cn("sticky top-0 z-50 h-[68px] border-b bg-white/95 backdrop-blur-md transition-colors", scrolled ? "border-line" : "border-transparent")}>
        <div className="flex h-full items-center gap-10 px-4 lg:px-7">
          <Logo size={26} />
          <NM.Root className="relative hidden flex-1 lg:block" delayDuration={60}>
            <NM.List className="flex items-center gap-0.5">
              <NM.Item>
                <NM.Trigger className={linkCls}>
                  Platform <ChevronDown aria-hidden className="size-3.5 text-muted transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </NM.Trigger>
                <GroupPanel
                  groups={PLATFORM_GROUPS}
                  feature={
                    <NM.Link asChild>
                      <Link href="/platform/agents" className="group relative flex h-full min-h-[220px] flex-col justify-end overflow-hidden rounded-xl bg-night p-4 text-white">
                        <span aria-hidden className="vlines-dark absolute inset-0" />
                        <span aria-hidden className="absolute -right-12 -top-12 size-48 rounded-full bg-[radial-gradient(circle,rgb(38_109_240/0.55),transparent_70%)] transition-transform duration-500 group-hover:scale-125" />
                        <span className="relative text-[15px] font-semibold">Vult Agents</span>
                        <span className="relative mt-1 text-[13px] text-[#b4b8c2]">Research, qualify and follow up while you sell.</span>
                        <span className="relative mt-3 inline-flex items-center gap-1 text-[13px]">
                          Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    </NM.Link>
                  }
                />
              </NM.Item>
              <NM.Item>
                <NM.Trigger className={linkCls}>
                  Resources <ChevronDown aria-hidden className="size-3.5 text-muted transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                </NM.Trigger>
                <GroupPanel
                  groups={RESOURCES_GROUPS}
                  feature={
                    <NM.Link asChild>
                      <Link href="/changelog" className="flex h-full flex-col gap-3 rounded-xl border border-line bg-soft p-4 transition-colors hover:border-line-strong">
                        <span className="text-[12px] font-medium text-subtle">Changelog · Oct 14</span>
                        <span className="flex h-24 flex-col gap-1.5 rounded-lg border border-line bg-white p-3">
                          <span className="h-2 w-3/5 rounded bg-line" />
                          <span className="h-2 w-4/5 rounded bg-line" />
                          <span className="mt-auto h-5 w-2/5 rounded-md bg-accent" />
                        </span>
                        <span className="text-[14px] font-semibold text-ink">Kanban swimlanes and saved board views</span>
                      </Link>
                    </NM.Link>
                  }
                />
              </NM.Item>
              {[
                ["Customers", "/customers"],
                ["Pricing", "/pricing"],
                ["Changelog", "/changelog"],
              ].map(([label, href]) => (
                <NM.Item key={href}>
                  <NM.Link asChild active={location === href}>
                    <Link href={href!} className={linkCls} aria-current={location === href ? "page" : undefined}>
                      {label}
                    </Link>
                  </NM.Link>
                </NM.Item>
              ))}
            </NM.List>
            <div className="absolute left-0 top-[calc(100%+12px)]">
              <NM.Viewport className="nav-viewport relative overflow-hidden rounded-2xl border border-line bg-white shadow-pop" />
            </div>
          </NM.Root>
          <div className="ml-auto flex items-center gap-2.5">
            {session ? (
              <Button href="/app/home" size="md">
                Open Vult
              </Button>
            ) : (
              <>
                <Link href={location === "/it" ? "/" : "/it"} className="hidden h-9 items-center rounded-[10px] px-2.5 text-[14px] font-medium text-subtle transition-colors hover:bg-soft-2 hover:text-ink sm:inline-flex" hrefLang={location === "/it" ? "en" : "it"}>
                  {location === "/it" ? "English" : "Italiano"}
                </Link>
                <Button href="/signin" variant="secondary" size="md" className="hidden sm:inline-flex">
                  Sign in
                </Button>
                <Button href="/early-access" size="md">
                  Get early access
                </Button>
              </>
            )}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
              className="inline-flex size-9 items-center justify-center rounded-[10px] transition-colors hover:bg-soft-2 lg:hidden"
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

function Accordion({ group, defaultOpen }: { group: NavGroup & { title: string }; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-[52px] w-full items-center justify-between text-base font-semibold">
        {group.title}
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
            {group.items.map((i) => (
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
          className="site fixed inset-0 z-[60] flex flex-col bg-white lg:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex h-[68px] items-center justify-between border-b border-line px-4">
            <Logo />
            <button type="button" autoFocus aria-label="Close menu" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-[10px] hover:bg-soft-2">
              <X className="size-[18px]" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-2" aria-label="Mobile">
            <Accordion group={{ title: "Platform", items: PLATFORM_GROUPS.flatMap((g) => g.items) }} defaultOpen />
            <Accordion group={{ title: "Resources", items: RESOURCES_GROUPS.flatMap((g) => g.items) }} />
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
            <Button href="/early-access" size="lg">
              Get early access
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
